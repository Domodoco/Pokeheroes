// ==UserScript==
// @name         PH - Easy Fish (Minimal Fix + AutoReload)
// @namespace    https://github.com/warpKaiba
// @version      0.1.3 // Auto-reload version
// @description  Adds fishing buttons, auto-casts if needed, then catches. Reloads page every 5 mins after one catch attempt.
// @author       You (Minimal modification by AI)
// @match        https://pokeheroes.com/beach*
// @downloadURL  https://github.com/warpKaiba/TMpokeheroes/raw/master/PHEasyFish.user.js
// @icon         https://vignette.wikia.nocookie.net/pkmnshuffle/images/7/7f/Ducklett.png/revision/latest?cb=20170409032016
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js // Necessary because the original script uses $
// ==/UserScript==

/* globals $, throwRod, pullRodBack, catchFish, getFishingEnergy, MIN_REQ_ENERGY */

(function() { // Start of IIFE wrapper
    'use strict';

    console.log("PH Minimal Fix + AutoReload v0.1.3 Loading...");

    // --- Constants ---
    const RELOAD_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
    const INIT_DELAY_MS = 1500; // Delay after page load before starting auto-catch/reload (allows page init)

    // --- Global Timer variable (for manual auto-fish) ---
    var fishingTimerId = null; // Declared outside so stopCatchMany can clear it

    // --- Original catchAFish function (Renamed & called by wrapper) ---
    // Contains the EXACT logic from your original script's catchAFish
    function originalCatchAFishLogic() {
        console.log("Minimal Fix + Reload: Running originalCatchAFishLogic...");
        // Original line (likely unnecessary, but kept as requested)
        isCatchOnRod = true;

        // Original energy check (kept as requested)
        if (typeof getFishingEnergy === 'function' && typeof MIN_REQ_ENERGY !== 'undefined') {
             if (getFishingEnergy() > MIN_REQ_ENERGY) {
                 try {
                     console.log("Minimal Fix + Reload: Calling original pullRodBack(false)...");
                     if (typeof pullRodBack === 'function') { pullRodBack(false); }
                     else { console.warn("Minimal Fix + Reload: pullRodBack function not found."); }

                     console.log("Minimal Fix + Reload: Setting original 200ms timeout for catchFish...");
                     setTimeout(function(){
                         console.log("Minimal Fix + Reload: Calling original catchFish()...");
                         try {
                              if (typeof catchFish === 'function') { catchFish(); }
                              else { console.warn("Minimal Fix + Reload: catchFish function not found."); }
                         } catch(eInner) { console.error("Minimal Fix + Reload: Error in catchFish:", eInner); }
                     }, 200); // Original 200ms delay

                 } catch (eOuter) {
                      console.error("Minimal Fix + Reload: Error in pullRodBack:", eOuter);
                      // Don't stop the reload timer on error, let it reload eventually
                 }
             } else {
                  console.log("Minimal Fix + Reload: Not enough energy (checked in original logic location).");
                  // Don't stop the reload timer if out of energy
             }
        } else {
             console.warn("Minimal Fix + Reload: Cannot perform energy check. Proceeding cautiously.");
             try { // Replicate original behaviour without the check
                  console.log("Minimal Fix + Reload: Calling original pullRodBack(false) (energy check failed)...");
                  pullRodBack(false); // Assuming it exists
                  console.log("Minimal Fix + Reload: Setting original 200ms timeout for catchFish (energy check failed)...");
                  setTimeout(function(){
                      console.log("Minimal Fix + Reload: Calling original catchFish() (energy check failed)...");
                       catchFish(); // Assuming it exists
                  }, 200);
             } catch (e) { console.error("Minimal Fix + Reload: Error in pull/catch sequence (energy check failed):", e); }
        }
    }

    // --- Wrapper Function: Handles casting IF needed ---
    function executeFishingSequence() {
         console.log("Minimal Fix + Reload: executeFishingSequence called.");
         const $castButton = $(".throwRodButton:visible"); // Requires jQuery

         if ($castButton.length > 0) {
              console.log("Minimal Fix + Reload: Casting rod...");
              try {
                   if (typeof throwRod === 'function') { throwRod(); }
                   else { console.warn("Minimal Fix + Reload: throwRod() not found, triggering click."); $castButton[0].click(); }

                   console.log("Minimal Fix + Reload: Waiting 300ms after cast...");
                   setTimeout(originalCatchAFishLogic, 300); // Your requested delay before original logic

              } catch (e) {
                   console.error("Minimal Fix + Reload: Error during cast.", e);
                   // Don't stop the reload timer on error
              }
         } else {
              console.log("Minimal Fix + Reload: Cast button not visible, proceeding directly.");
              originalCatchAFishLogic(); // Run original logic immediately
         }
    }

    // --- Manual Auto-Fish Functions (Optional Use) ---
    function startCatchMany() { // For the "Catch every fish" button
        if (fishingTimerId === null) {
             console.log("Minimal Fix + Reload: Starting MANUAL auto-fishing...");
             const manualInterval = 420; // Original interval for manual multi-catch
             fishingTimerId = setInterval(executeFishingSequence, manualInterval);
             $('#catchmanyfish_minimal_reload').prop('disabled', true);
             $('#stopfishing_minimal_reload').prop('disabled', false);
             $('#catchafish_minimal_reload').prop('disabled', true);
             // IMPORTANT: Stop the auto-reload timer if manual fishing is started
             stopPageReloadTimer();
        }
    }

    function stopCatchMany() { // For the "Stop fishing" button
        if (fishingTimerId !== null) {
             console.log("Minimal Fix + Reload: Stopping MANUAL auto-fishing...");
             clearInterval(fishingTimerId);
             fishingTimerId = null;
              $('#catchmanyfish_minimal_reload').prop('disabled', false);
              $('#stopfishing_minimal_reload').prop('disabled', true);
              $('#catchafish_minimal_reload').prop('disabled', false);
              // IMPORTANT: Restart the auto-reload timer when manual fishing stops
              startPageReloadTimer();
        } else {
             console.log("Minimal Fix + Reload: Manual auto-fishing not running.");
        }
    }

    // --- NEW: Auto-Reload Functions ---
    var pageReloadTimerId = null; // Timer ID for the page reload

    function schedulePageReload() {
        // Clear any existing timer before setting a new one
        stopPageReloadTimer();
        console.log(`Minimal Fix + Reload: Scheduling page reload in ${RELOAD_INTERVAL_MS / 1000} seconds.`);
        pageReloadTimerId = setTimeout(function() {
            console.log("Minimal Fix + Reload: Reloading page now...");
            location.reload();
        }, RELOAD_INTERVAL_MS);
    }

    function stopPageReloadTimer() {
        if (pageReloadTimerId !== null) {
            console.log("Minimal Fix + Reload: Clearing scheduled page reload.");
            clearTimeout(pageReloadTimerId);
            pageReloadTimerId = null;
        }
    }

    function initialCatchAndStartReloadTimer() {
        console.log("Minimal Fix + Reload: Performing initial catch attempt...");
        executeFishingSequence(); // Perform the first catch attempt

        // After initiating the catch attempt, schedule the reload
        schedulePageReload();
    }


    // --- Initialization ---
    $(document).ready(function() {
        console.log(`Minimal Fix + Reload: Document ready. Waiting ${INIT_DELAY_MS}ms to initialize...`);
        setTimeout(function() {
            // --- Add Buttons ---
            try {
                var fishingDiv = $("#rodinterface")[0];
                if (!document.getElementById('catchafish_minimal_reload')) {
                    fishingDiv.insertAdjacentHTML("afterend", `
                        <div style="text-align: center; margin-top: 10px;">
                            <button id='catchafish_minimal_reload' class='button'>Catch a fish</button>
                            <button id='catchmanyfish_minimal_reload' class='button'>Catch every fish</button>
                            <button id='stopfishing_minimal_reload' class='button' disabled>Stop fishing</button>
                            <p style='font-size:0.8em; color:grey;'>(Minimal Fix + AutoReload v0.1.3)</p>
                        </div>
                    `);
                    console.log("Minimal Fix + Reload: Buttons added.");

                    // --- Attach Listeners ---
                    document.getElementById('catchafish_minimal_reload').addEventListener("click", executeFishingSequence);
                    document.getElementById('catchmanyfish_minimal_reload').addEventListener("click", startCatchMany);
                    document.getElementById('stopfishing_minimal_reload').addEventListener("click", stopCatchMany);

                     // --- Set Initial Button States ---
                     $('#catchmanyfish_minimal_reload').prop('disabled', false);
                     $('#stopfishing_minimal_reload').prop('disabled', true);
                     $('#catchafish_minimal_reload').prop('disabled', false);

                    // --- Start Auto-Reload Process ---
                    initialCatchAndStartReloadTimer();

                 } else {
                     console.log("Minimal Fix + Reload: Buttons already exist. Assuming process already started.");
                     // If buttons exist from a previous script instance on this load,
                     // we might not want to start another timer/catch attempt.
                     // However, if the reload mechanism relies on *this* script instance,
                     // we might need to call initialCatchAndStartReloadTimer() here too.
                     // Let's assume for now that if buttons exist, the script is already handling it.
                 }
            } catch (e) {
                 console.error("Minimal Fix + Reload: Error adding buttons. Is #rodinterface present?", e);
                 // Attempt to start the reload anyway? Could be useful if only UI fails.
                 // console.log("Minimal Fix + Reload: Attempting to start reload process despite button error...");
                 // initialCatchAndStartReloadTimer();
            }
        }, INIT_DELAY_MS); // Wait after document ready
    });

})(); // End of IIFE wrapper