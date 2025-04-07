// ==UserScript==
// @name         PokeHeroes Rumble Auto Retriever & Resender
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Automatically retrieves and resends PokeHeroes rumblers
// @author       You
// @match        https://pokeheroes.com/rumble_overview
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const WAIT_TIME = 1000;          // 1 second wait between clicks
    const RETRY_DELAY = 2000;        // 0.2 second retry delay when button not ready
    const MAX_RETRIES = 100;           // Max number of retry attempts
    const CHECK_INTERVAL = 5000; // 1 second interval to check for the button

    let retryCount = 0;
    let processing = false;

    function clickElement(element) {
        if(element) {
            element.click();
        }
    }

    function isElementReady(element) {
        if(!element)
            return false;
        return (element.offsetParent !== null);
    }

    function waitForElement(element, callback) {
        if (isElementReady(element)) {
            callback();
        } else {
            if (retryCount >= MAX_RETRIES) {
                console.warn("Max retries reached, skipping element:", element);
                retryCount = 0;
                return;
            }
            retryCount++;
            setTimeout(() => waitForElement(element, callback), RETRY_DELAY);
        }
    }

     async function findAndClickRetrieve() {
        const retrieveButtons = Array.from(document.querySelectorAll('.retrieve_screen a div'));

        if(retrieveButtons.length === 0)
          return false;

        for(const button of retrieveButtons) {
           if (button.textContent.includes("Retrieve your Pokémon")) {
                await new Promise(resolve => {
                   waitForElement(button.parentElement, () => {
                       clickElement(button.parentElement);
                       resolve();
                    });
                });
                return true;
           }
         }
       return false;
     }

    async function findAndClickResend(isSecondAttempt) {
         let resendButtons;
         if (isSecondAttempt) {
            resendButtons = Array.from(document.querySelectorAll('b'));
         }
         else {
              resendButtons = Array.from(document.querySelectorAll('a, div[onclick*="resendRumbler"], b'));
          }

          if(resendButtons.length === 0)
              return false;

            for (const resendButton of resendButtons) {
                if (resendButton.textContent === "Resend" && !resendButton.getAttribute('clicked')) {
                    await new Promise(resolve => {
                        waitForElement(resendButton, () => {
                           resendButton.setAttribute('clicked', true);
                           clickElement(resendButton);
                            resolve();
                        });
                    });
                    return true;
              }
          }
            return false;
      }

   async function processButtons() {
        if (processing) return;
        processing = true;

        // Attempt to click ALL resend buttons first
        let resendClicked = true;
        while(resendClicked) {
           resendClicked = await findAndClickResend(false);
        }

        // Then try to click retrieve buttons
        await findAndClickRetrieve();

       // Attempt to click ALL resend buttons again, using the new logic.
        resendClicked = true;
        while(resendClicked) {
            resendClicked = await findAndClickResend(true)
        }


        processing = false;
        setTimeout(processButtons, WAIT_TIME);
    }

    function mainLoop() {
      processButtons();
    }

    function initLoop() {
      if(document.querySelector('.retrieve_screen a div') ) {
           mainLoop();
         }
      else {
         setTimeout(initLoop, CHECK_INTERVAL)
       }
    }

    initLoop();
})();