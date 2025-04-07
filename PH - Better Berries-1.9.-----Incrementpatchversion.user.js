// ==UserScript==
// @name         PH - Better Berries
// @namespace    https://github.com/warpKaiba
// @version      1.9.1 // <-- Increment patch version
// @description  Makes the berry garden into a less tedious user experience. Auto-selects highest Oran berry first in toolshed. Waits for page load before toolshed auto-clicks. No auto-reload after fill. Attempts fix for auto-click.
// @author       You
// @match        https://pokeheroes.com/berrygarden*
// @match        https://pokeheroes.com/toolshed*
// @grant        none
// @downloadURL  https://github.com/warpKaiba/TMpokeheroes/raw/master/PHberries.user.js
// @updateURL    https://github.com/warpKaiba/TMpokeheroes/raw/master/PHberries.user.js // Optional: Add update URL
// @run-at       document-end // Run after DOM is parsed
// @icon         https://vignette.wikia.nocookie.net/pkmnshuffle/images/7/7f/Ducklett.png/revision/latest?cb=20170409032016
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration ---
    const AUTO_CLICK_DELAY_MS = 900; // Slightly increased delay
    const WAIT_FOR_BAG_TIMEOUT_MS = 15000;
    const BAG_CHECK_INTERVAL_MS = 300;

    // --- Global Variables ---
    let berryType = getCookie("berryType") || "Aspear";
    let levelType = getCookie("levelType") || "1"; // Keep as string/number mix from cookie/input
    console.log(`PH - Better Berries: Initial Berry Type: ${berryType}, Level: ${levelType}`);

    // --- Helper Functions ---
    function blockPopups() {
        window.alert = function() { console.log("Blocked alert:", arguments); };
        window.confirm = function() { console.log("Blocked confirm, returning true:", arguments); return true; };
        window.prompt = function() { console.log("Blocked prompt, returning null:", arguments); return null; };
    }

    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') { c = c.substring(1); }
            if (c.indexOf(name) == 0) { return c.substring(name.length, c.length); }
        }
        return "";
    }

    function setCookie(cname, cvalue, days = 3650) {
        var d = new Date();
        d.setTime(d.getTime() + (days*24*60*60*1000));
        var expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        console.log(`PH - Better Berries: Set Cookie - ${cname}=${cvalue}`);
    }

    // --- Berry Data & UI Generation ---
    const berryOptions = [
        "Aguav", "Apicot", "Aspear", "Babiri", "Belue", "Bluk", "Charti", "Cheri", "Chesto",
        "Chilan", "Chople", "Coba", "Colbur", "Cornn", "Custap", "Durin", "Enigma", "Figy",
        "Ganlon", "Grepa", "Haban", "Hondew", "Iapapa", "Jacoba", "Kasib", "Kebia", "Kelpsy",
        "Lansat", "Leppa", "Liechi", "Lum", "Mago", "Magost", "Micle", "Nanab", "Nomel",
        "Occa", "Oran", "Pamtre", "Passho", "Payapa", "Pecha", "Persim", "Petaya", "Pinap",
        "Pomeg", "Qualot", "Rabuta", "Rawst", "Razz", "Rowap", "Salac", "Shuca", "Sitrus",
        "Spelon", "Starf", "Tamato", "Tanga", "Wacan", "Wepear", "Wiki", "Yache"
    ];

    function generateBerryOptionsHTML(bagElementId) {
        let html = "<select id='kaibaberryselect'><option disabled selected value=''>Choose a type</option>";
        const bagElement = document.getElementById(bagElementId);
        if (!bagElement) {
             console.warn(`PH - Better Berries: Bag element #${bagElementId} not found for generating options.`);
             return html + "</select>";
        }
        for (const berry of berryOptions) {
            const berryClassSelector = `.${bagElementId === 'seedBag' ? 'seed' : 'berry'}${berry}`;
            if (bagElement.querySelector(berryClassSelector)) {
                 html += `<option value="${berry}">${berry}</option>`;
            } else {
                 html += `<option value="${berry}" disabled>${berry}</option>`;
            }
        }
        html += "</select>";
        return html;
    }

    function generateLevelSelectHTML() {
        // Ensure levelType is treated as a number for the input, but use current value
        const currentLevel = parseInt(levelType) || 1;
        return `<b> Level:</b><input type='number' id='kaibalevelselect' min='1' max='1000' value="${currentLevel}"></input>`;
    }

    // --- UI Update Functions ---
    // Add more logging to updateButtonState
    function updateButtonState(buttonId, textPrefix, checkSelectorPrefix) {
        const button = document.getElementById(buttonId);
        if (!button) {
            console.warn(`PH - Better Berries: Button #${buttonId} not found for state update.`);
            return;
        }
        // Ensure levelType is treated consistently (might be number from auto-select, string from input/cookie)
        const currentLevelStr = String(levelType); // Use current levelType which might be number or string
        button.innerText = `${textPrefix} ${berryType} Lvl ${currentLevelStr}`;

        const bagId = checkSelectorPrefix === 'seed' ? 'seedBag' : 'berryBag';
        const bagElement = document.getElementById(bagId);
        const itemSelector = `.${checkSelectorPrefix}${berryType} .level${currentLevelStr}`;

        let itemExists = false;
        if (bagElement) {
             const foundElement = bagElement.querySelector(itemSelector);
             itemExists = !!foundElement; // Convert found element (or null) to boolean
             console.log(`PH - Better Berries: Checking selector "${itemSelector}" inside #${bagId}. Found:`, foundElement ? 'YES' : 'NO');
        } else {
             console.warn(`PH - Better Berries: Bag element #${bagId} not found for button state check.`);
             // Optionally check whole document as fallback? Could be unreliable.
             // itemExists = !!document.querySelector(itemSelector);
        }

        button.disabled = !itemExists;
        button.style.color = itemExists ? "" : "#aaa";
        console.log(`PH - Better Berries: Updated button ${buttonId}. Item Exists: ${itemExists}, Disabled: ${!itemExists}`);
    }

    function kaibaUpdateBerry() {
        const selectElement = document.getElementById("kaibaberryselect");
        if (!selectElement) return;
        berryType = selectElement.value;
        console.log("PH - Better Berries: Berry type changed to:", berryType);
        setCookie("berryType", berryType);
        // Update relevant button on the current page
        if (window.location.pathname.includes("/berrygarden")) {
            updateButtonState("selectseedx", "Select", "seed");
        } else if (window.location.pathname.includes("/toolshed")) {
            updateButtonState("fillberry", "Fill with", "berry");
        }
    }

    function kaibaUpdateLevel() {
        const levelElement = document.getElementById("kaibalevelselect");
        if (!levelElement) return;
        levelType = levelElement.value; // Keep as string from input
        console.log("PH - Better Berries: Level changed to:", levelType);
        setCookie("levelType", String(levelType)); // Store as string
        // Update relevant button on the current page
        if (window.location.pathname.includes("/berrygarden")) {
            updateButtonState("selectseedx", "Select", "seed");
        } else if (window.location.pathname.includes("/toolshed")) {
            updateButtonState("fillberry", "Fill with", "berry");
        }
    }

    // --- Auto-Select Highest Level Logic (with Oran Priority) ---
    function autoSelectHighestLevelItem(bagElementId, itemPrefix, buttonId, buttonTextPrefix) {
        return new Promise((resolve) => {
            console.log(`PH - Better Berries: Starting auto-select for ${itemPrefix}...`);
            let finalBerry = null;
            let finalLevel = 0; // Store level as number internally during selection
            let foundItem = false;

            const bagElement = document.getElementById(bagElementId);
            if (!bagElement) {
                console.warn(`PH - Better Berries: Bag element #${bagElementId} not found for auto-selection.`);
                resolve(false); // Indicate failure
                return;
            }

            // --- Oran Berry Priority Logic (Only for Toolshed Berries) ---
            if (itemPrefix === 'berry') {
                console.log("PH - Better Berries: Checking for highest level Oran berry first...");
                let highestOranLevel = 0;
                for (let level = 1000; level >= 1; level--) {
                    if (bagElement.querySelector(`.berryOran .level${level}`)) {
                        highestOranLevel = level;
                        console.log(`PH - Better Berries: Found highest Oran berry at Level ${highestOranLevel}.`);
                        break; // Found the highest Oran, stop checking levels for Oran
                    }
                }

                if (highestOranLevel > 0) {
                    finalBerry = "Oran";
                    finalLevel = highestOranLevel; // Store as number
                    foundItem = true;
                } else {
                    console.log("PH - Better Berries: No Oran berries found. Falling back to highest level of any berry.");
                }
            }

            // --- Fallback / Seed Logic ---
            if (!foundItem) {
                 let highestLevelFallback = 0;
                 let highestBerryFallback = null;

                 for (const berry of berryOptions) {
                    // Skip Oran check if we already determined it wasn't present (minor optimization)
                    if (itemPrefix === 'berry' && berry === 'Oran' && !foundItem) continue;

                     for (let level = 1000; level >= 1; level--) {
                         if (bagElement.querySelector(`.${itemPrefix}${berry} .level${level}`)) {
                             if (level > highestLevelFallback) {
                                 highestLevelFallback = level;
                                 highestBerryFallback = berry;
                             }
                             break; // Found highest for this berry type, move to next type
                         }
                     }
                 }

                 if (highestBerryFallback) {
                      finalBerry = highestBerryFallback;
                      finalLevel = highestLevelFallback; // Store as number
                      foundItem = true;
                      console.log(`PH - Better Berries: Fallback selected ${itemPrefix}: ${finalBerry} Lvl ${finalLevel}`);
                 }
            }

            // --- Update State and UI based on selection outcome ---
            if (foundItem) {
                berryType = finalBerry;
                levelType = finalLevel; // Update global levelType (now a number)

                const berrySelect = document.getElementById("kaibaberryselect");
                const levelSelect = document.getElementById("kaibalevelselect");

                if (berrySelect) berrySelect.value = berryType;
                 // Update level input value (ensure it's string for input.value)
                if (levelSelect) levelSelect.value = String(levelType);

                setCookie("berryType", berryType);
                setCookie("levelType", String(levelType)); // Store level as string in cookie

                // Update the button state after setting the variables
                updateButtonState(buttonId, buttonTextPrefix, itemPrefix);
                console.log(`PH - Better Berries: Successfully auto-selected ${berryType} Lvl ${levelType}.`);
                resolve(true); // Indicate success

            } else {
                console.log(`PH - Better Berries: No suitable ${itemPrefix} items found to auto-select.`);
                // Still update button state (it will become disabled if applicable)
                // Use the *last known* berryType/levelType for the button text, but it will be disabled
                 updateButtonState(buttonId, buttonTextPrefix, itemPrefix);
                resolve(false); // Indicate failure to find *any* suitable item
            }
        });
    }

    // --- Wait for Bag Contents ---
    function waitForBagAndSelectHighest(bagElementId, itemPrefix, buttonId, buttonTextPrefix) {
        return new Promise((resolve, reject) => {
            let elapsedTime = 0;
             console.log(`PH - Better Berries: Waiting for content in #${bagElementId}...`);
            const bagElement = document.getElementById(bagElementId);
            if (!bagElement) {
                 console.error(`PH - Better Berries: Critical Error - Bag element #${bagElementId} does not exist in the DOM.`);
                 return reject(new Error(`Bag element #${bagElementId} not found.`));
            }
            const intervalId = setInterval(() => {
                // Check if the bag has any item element within it (more specific if possible)
                // Look for a div directly inside the bag that might indicate loaded items
                const itemIndicator = bagElement.querySelector(':scope > div'); // Check for any direct child div

                if (itemIndicator) {
                    console.log(`PH - Better Berries: Content indicator found in #${bagElementId}. Proceeding with selection.`);
                    clearInterval(intervalId);

                    // Now run the auto-selection logic
                    autoSelectHighestLevelItem(bagElementId, itemPrefix, buttonId, buttonTextPrefix)
                        .then(success => resolve(success)); // Pass success/failure state

                } else {
                    elapsedTime += BAG_CHECK_INTERVAL_MS;
                    if (elapsedTime >= WAIT_FOR_BAG_TIMEOUT_MS) {
                        clearInterval(intervalId);
                        console.warn(`PH - Better Berries: Timed out waiting for content in #${bagElementId}. Proceeding without guarantee of full inventory.`);
                        // Proceed even on timeout, but selection might be based on incomplete data
                        autoSelectHighestLevelItem(bagElementId, itemPrefix, buttonId, buttonTextPrefix)
                            .then(success => resolve(success)); // Resolve anyway, but logs indicate potential issue
                    } else {
                        // Optional: console.log(`PH - Better Berries: Still waiting for #${bagElementId}...`);
                    }
                }
            }, BAG_CHECK_INTERVAL_MS);
        });
    }


    // --- Page Specific Logic ---

    // == Berry Garden ==
    if (window.location.pathname.includes("/berrygarden")) {
        console.log("PH - Better Berries: Berry Garden script running.");
        // Wrap initialization in DOMContentLoaded listener for consistency
        if (document.readyState === 'loading') { // Check if DOM is still loading
            document.addEventListener('DOMContentLoaded', initializeBerryGardenScript);
        } else { // DOM already loaded
            initializeBerryGardenScript();
        }

        function initializeBerryGardenScript() {
            console.log("PH - Better Berries: DOMContentLoaded fired. Initializing Berry Garden script.");
            blockPopups();
            const gardenLoader = document.getElementById('garden_loader');
            if (gardenLoader) {
                const controlsContainer = document.createElement('div');
                controlsContainer.id = "kaiba-berry-controls";
                controlsContainer.style.cssText = "margin-top: 10px; padding: 5px; border: 1px solid #ccc; border-radius: 5px;";
                controlsContainer.innerHTML = `
                    <button id='waterall'>Water all</button>
                    <button id='plantall'>Plant all</button>
                    <button id='selectseedx' style='width: 16em;'>Select ... Lvl ...</button>
                `;
                gardenLoader.insertAdjacentElement("beforebegin", controlsContainer);
                document.getElementById("waterall")?.addEventListener("click", waterAll);
                document.getElementById("plantall")?.addEventListener("click", plantAll);
                document.getElementById("selectseedx")?.addEventListener("click", selectSeedx);

                waitForBagAndSelectHighest('seedBag', 'seed', 'selectseedx', 'Select')
                    .then(success => {
                        console.log("PH - Better Berries: Seed selection complete (Success: " + success + ")");
                        const berryOptionsHTML = generateBerryOptionsHTML('seedBag');
                        const levelSelectHTML = generateLevelSelectHTML();
                        controlsContainer.insertAdjacentHTML("beforeend", " " + berryOptionsHTML);
                        controlsContainer.insertAdjacentHTML("beforeend", " " + levelSelectHTML);
                        document.getElementById('kaibaberryselect')?.addEventListener("change", kaibaUpdateBerry);
                        document.getElementById('kaibalevelselect')?.addEventListener("change", kaibaUpdateLevel);
                        updateButtonState("selectseedx", "Select", "seed");
                        processGardenLoop();
                    })
                    .catch(error => {
                        console.error("PH - Better Berries: Error during seed bag processing:", error);
                        controlsContainer.insertAdjacentHTML("beforeend", " <span style='color:red;'>Error loading seed inventory!</span>");
                    });
            } else {
                console.error("PH - Better Berries: #garden_loader element not found.");
            }
        }
        // Define garden functions within the scope where they are called
        function waterAll() {
             console.log("PH - Better Berries: Watering all plants...");
             const berries = document.querySelectorAll('.plantIcon[data-plantid]');
             let wateredCount = 0;
             if (typeof waterPlant !== 'function') {
                 console.error("PH - Better Berries: Global 'waterPlant' function not found. Aborting waterAll.");
                 return;
             }
             for (const berryElement of berries) {
                 const plantId = berryElement.getAttribute('data-plantid');
                 const dryGround = document.querySelector(`.dryGround${plantId}`);
                 if (dryGround) {
                     try {
                         // Assuming jQuery ('$') is available on the page for waterPlant
                         if (typeof $ === 'undefined') throw new Error("jQuery ($) is not defined");
                         waterPlant($(berryElement));
                         wateredCount++;
                     } catch (e) {
                          console.error("PH - Better Berries: Error calling waterPlant:", e);
                          break; // Stop loop if waterPlant fails badly
                     }
                 }
             }
             console.log(`PH - Better Berries: Watered ${wateredCount} plants.`);
        }
        function plantAll() {
            if (typeof selSeed !== 'undefined' && selSeed !== null && selSeed !== "") {
                 console.log(`PH - Better Berries: Planting selected seed (${selSeed}) on all plots.`);
                 if (typeof gardenCoor !== 'undefined' && typeof garden !== 'undefined' && gardenCoor[garden]) {
                     if (typeof clickOnGarden === 'function') {
                         let plantedCount = 0;
                         for (let i = 0; i < gardenCoor[garden].length; i++) {
                             try {
                                clickOnGarden(gardenCoor[garden][i][0], gardenCoor[garden][i][1]);
                                plantedCount++;
                             } catch (e) { console.error(`Error calling clickOnGarden for plot ${i}:`, e); }
                         }
                         console.log(`PH - Better Berries: Attempted to plant on ${plantedCount} plots.`);
                     } else { console.error("PH - Better Berries: Global 'clickOnGarden' function not defined."); }
                 } else { console.error("PH - Better Berries: Global 'gardenCoor' or 'garden' variable not defined/invalid."); }
             } else {
                 // Bypass popup block temporarily for essential user feedback
                 const originalAlert = window.alert; window.alert = function(){}; // Temporarily disable block
                 originalAlert("Select a seed first (selSeed variable is empty).");
                 window.alert = blockPopups; // Re-block
                 console.warn("PH - Better Berries: Plant All clicked, but no seed selected.");
             }
        }
        function selectSeedx() {
             const selectButton = document.getElementById('selectseedx');
             if (selectButton && !selectButton.disabled) {
                 if (typeof selectSeed === 'function') {
                     try { selectSeed(berryType, levelType); console.log(`PH - Better Berries: Selected seed: ${berryType} Lvl ${levelType}`); }
                     catch (e) { console.error(`Error calling selectSeed(${berryType}, ${levelType}):`, e); }
                 } else { console.error("PH - Better Berries: Global 'selectSeed' function not defined."); }
             } else {
                 const originalAlert = window.alert; window.alert = function(){};
                 originalAlert(`Cannot select: No level ${levelType} ${berryType} seeds found, or button is disabled.`);
                 window.alert = blockPopups;
                 console.warn(`PH - Better Berries: Select Seed clicked, but no level ${levelType} ${berryType} seeds found or button disabled.`);
             }
        }
        function processGardenLoop() {
            var gardenNumbers = [1, 2, 3, 4];
            var currentGardenIndex = 0;
            var isLooping = true;
            function processSingleGarden() {
                if (!isLooping) { console.log("PH - Better Berries: Script has finished processing all gardens once."); return; }
                var currentGarden = gardenNumbers[currentGardenIndex];
                console.log(`PH - Better Berries: >>> Processing Garden ${currentGarden}...`);
                var gardenButton = document.querySelector(`button[onclick="loadBerryGarden(${currentGarden});"]`);
                if(gardenButton) {
                   gardenButton.click();
                   console.log(`PH - Better Berries: Clicked button for Garden ${currentGarden}. Waiting for load...`);
                   setTimeout(function() {
                      console.log(`PH - Better Berries: Garden ${currentGarden} load wait finished. Starting actions.`);
                      var harvestButton = document.querySelector('a[onclick="harvestAll();"]');
                      if (harvestButton) {
                          console.log("PH - Better Berries: Harvesting all...");
                          harvestButton.click();
                          setTimeout(performPlantingWatering, 1500); // Wait after harvest click
                      } else {
                          console.log("PH - Better Berries: No harvest button found, proceeding to plant/water.");
                          performPlantingWatering(); // Proceed directly
                      }
                    }, 2500); // Wait after switching garden
                } else {
                    console.warn(`PH - Better Berries: Button for Garden ${currentGarden} not found. Skipping.`);
                    moveToNextGarden();
                }
            }
            function performPlantingWatering() {
                console.log("PH - Better Berries: Selecting seed..."); selectSeedx();
                setTimeout(function() {
                    console.log("PH - Better Berries: Planting all..."); plantAll();
                    setTimeout(function() {
                        console.log("PH - Better Berries: Watering all..."); waterAll();
                        moveToNextGarden(); // Move to next after all actions complete
                    }, 1200); // Delay after plantAll
                }, 1200); // Delay after selectSeedx
            }
            function moveToNextGarden() {
                 currentGardenIndex++;
                 if (currentGardenIndex >= gardenNumbers.length) {
                      isLooping = false; console.log("PH - Better Berries: <<< Finished processing all gardens for this cycle."); return;
                 } else {
                      console.log(`PH - Better Berries: Moving to next garden (Index: ${currentGardenIndex}). Short delay...`);
                      setTimeout(processSingleGarden, 1500); // Wait before starting next garden
                 }
            }
            processSingleGarden(); // Start loop
        }

    } // End /berrygarden block


    // == Tool Shed ==
    else if (window.location.pathname.includes("/toolshed")) {
        console.log("PH - Better Berries: Tool Shed script running.");

        // --- Use DOMContentLoaded Listener for Initialization ---
        if (document.readyState === 'loading') { // Redundant with @run-at document-end, but safe
            console.log("PH - Better Berries: DOM not ready, waiting for DOMContentLoaded.");
            document.addEventListener('DOMContentLoaded', initializeToolshedScript);
        } else {
            console.log("PH - Better Berries: DOM already ready. Initializing now.");
            initializeToolshedScript(); // DOM is already parsed
        }
        // --- End of DOMContentLoaded check ---


        function initializeToolshedScript() {
            console.log("PH - Better Berries: DOMContentLoaded fired. Initializing Tool Shed UI and automation...");
            blockPopups();

            // Inject UI Elements
            let injectionAnchor = document.querySelector(".seedMakerList");
            if (!injectionAnchor) {
                 injectionAnchor = document.querySelector("[style*='display: flex'][style*='flex-wrap: wrap'][style*='justify-content: center']");
            }
            if(injectionAnchor) {
                const controlsContainer = document.createElement('div');
                controlsContainer.id = "kaiba-toolshed-controls";
                controlsContainer.style.cssText = "margin-top: 10px; padding: 5px; border: 1px solid #ccc; border-radius: 5px; clear: both;";
                controlsContainer.innerHTML = `
                     <button id="collectseeds">Collect all seeds</button>
                     <button id="fillberry" style="width: 16em;">Fill With ... Lvl ...</button>
                     <button id='maxberries'>Maximize berries</button>
                `;
                injectionAnchor.insertAdjacentElement('afterend', controlsContainer);
                document.getElementById("collectseeds")?.addEventListener("click", collectSeeds);
                document.getElementById("fillberry")?.addEventListener("click", justForYou);
                document.getElementById("maxberries")?.addEventListener("click", maxBerries);

                // Wait for Bag, Select Highest, Add Selectors, THEN Auto-Click
                waitForBagAndSelectHighest('berryBag', 'berry', 'fillberry', 'Fill with')
                    .then(success => {
                        console.log("PH - Better Berries: Berry selection complete (Success: " + success + ")");
                        const berryOptionsHTML = generateBerryOptionsHTML('berryBag');
                        const levelSelectHTML = generateLevelSelectHTML();
                        controlsContainer.insertAdjacentHTML("beforeend", " " + berryOptionsHTML);
                        controlsContainer.insertAdjacentHTML("beforeend", " " + levelSelectHTML);
                        document.getElementById('kaibaberryselect')?.addEventListener("change", kaibaUpdateBerry);
                        document.getElementById('kaibalevelselect')?.addEventListener("change", kaibaUpdateLevel);
                        // Explicitly update button state *after* potential selection and adding elements
                        updateButtonState("fillberry", "Fill with", "berry");

                        // --- Trigger Auto-Click sequence ---
                        console.log("PH - Better Berries: Proceeding with auto-click sequence.");
                        // Add a slight delay before starting clicks to ensure UI is stable
                        setTimeout(() => {
                            const collectButton = document.getElementById("collectseeds");
                            if (collectButton) {
                                console.log("PH - Better Berries: Automatically clicking 'Collect all seeds'.");
                                try {
                                    collectButton.click();
                                    // Wait after collectSeeds click
                                    setTimeout(() => {
                                        const currentFillButton = document.getElementById("fillberry");
                                        console.log(`PH - Better Berries: Checking fill button state before click. Disabled: ${currentFillButton?.disabled}`);
                                        if (currentFillButton && !currentFillButton.disabled) {
                                            console.log("PH - Better Berries: Automatically clicking 'Fill berry'.");
                                            currentFillButton.click(); // This calls justForYou
                                        } else if (currentFillButton && currentFillButton.disabled) {
                                            console.log("PH - Better Berries: 'Fill berry' button is disabled, skipping auto-click.");
                                        } else {
                                            console.warn("PH - Better Berries: 'Fill berry' button not found after delay, skipping auto-click.");
                                        }
                                    }, AUTO_CLICK_DELAY_MS);
                                } catch (e) {
                                     console.error("PH - Better Berries: Error clicking collect button:", e);
                                }
                            } else {
                                console.warn("PH - Better Berries: 'Collect all seeds' button not found, skipping auto-click.");
                            }
                        }, 300); // 300ms delay before starting clicks

                    })
                     .catch(error => {
                        console.error("PH - Better Berries: Error during berry bag processing:", error);
                        controlsContainer.insertAdjacentHTML("beforeend", " <span style='color:red;'>Error loading berry inventory!</span>");
                    });

            } else {
                console.error("PH - Better Berries: Could not find suitable injection anchor point for controls in toolshed.");
            }

            // Cooking Section (should be fine here)
            const recipeInterface = document.getElementById("recipeInterface");
            if (recipeInterface && recipeInterface.parentNode) {
                const claimButton = document.createElement('button');
                claimButton.id = 'claimalldishes';
                claimButton.textContent = 'Claim all dishes';
                claimButton.addEventListener('click', claimAllDishes);
                recipeInterface.parentNode.insertBefore(claimButton, recipeInterface);
            } else {
                 console.warn("PH - Better Berries: Could not find #recipeInterface to add 'Claim all dishes' button.");
            }
        } // --- End of initializeToolshedScript function ---


        // --- Define Tool Shed Functions (accessible within initializeToolshedScript scope) ---
        function claimAllDishes() {
            console.log("PH - Better Berries: Claiming all cooking dishes...");
            document.querySelectorAll("button[onclick^='claimCookingDish']").forEach(button => {
                try { button.click(); } catch (e) { console.error("Error clicking claim dish button:", e); }
            });
        }
        function collectSeeds() {
            console.log("PH - Better Berries: Collecting seeds from all makers.");
            if (typeof claimSeed === 'function') {
                try { claimSeed(0); claimSeed(1); claimSeed(2); } catch (e) { console.error("Error calling claimSeed:", e); }
            } else { console.error("PH - Better Berries: Global 'claimSeed' function not defined."); }
        }
        function justForYou() {
            const fillButton = document.getElementById('fillberry');
            const bagElement = document.getElementById('berryBag');
            // Use consistent string level for selector
            const currentLevelStr = String(levelType);
            const itemSelector = `.berry${berryType} .level${currentLevelStr}`;
            const itemExists = bagElement ? bagElement.querySelector(itemSelector) : document.querySelector(itemSelector);

            if (itemExists) {
                console.log(`PH - Better Berries: Filling seed makers with ${berryType} Lvl ${currentLevelStr}...`);
                if (fillButton) fillButton.disabled = true;
                let ajaxPromises = []; let failedRequests = 0;
                for (let maker = 0; maker < 3; maker++) {
                    const descElement = document.querySelector(".seedMakerDesc" + maker);
                    if (descElement) {
                        const match = descElement.innerHTML.match(/(\d+)\s*Berries/);
                        if (match && match[1]) {
                            const seedMakerCap = parseInt(match[1]);
                             if (isNaN(seedMakerCap)) { console.warn(`Could not parse capacity for maker ${maker}`); continue; }
                            const promise = new Promise((resolve, reject) => {
                                 const formData = new FormData();
                                 formData.append('berries', berryType);
                                 formData.append('amount', String(seedMakerCap));
                                 formData.append('level', currentLevelStr); // Use consistent string level
                                 formData.append('maker', String(maker));
                                 fetch("includes/ajax/berrygarden/fillSeedMaker.php", { method: 'POST', body: formData })
                                 .then(response => { if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`); return response.text(); })
                                 .then(data => { console.log(`PH - Better Berries: Maker ${maker} fill request successful.`); resolve(); })
                                 .catch(error => { console.error(`PH - Better Berries: Error filling maker ${maker}:`, error); failedRequests++; reject(error); });
                            });
                            ajaxPromises.push(promise);
                        } else { console.warn(`Could not parse capacity for maker ${maker}`); }
                    } else { console.warn(`Could not find description element for maker ${maker}`); }
                }
                Promise.allSettled(ajaxPromises).then(() => {
                    console.log("PH - Better Berries: All seed maker fill requests settled.");
                    // Re-enable button regardless of success IF we are not reloading
                    if (fillButton) fillButton.disabled = false;
                    if (failedRequests === 0) { console.log("PH - Better Berries: Fill successful. Auto-reload disabled."); }
                    else { console.warn(`PH - Better Berries: ${failedRequests} fill requests failed.`); }
                });
            } else {
                const originalAlert = window.alert; window.alert=function(){};
                originalAlert(`Cannot fill: You don't have any level ${currentLevelStr} ${berryType} berries.`);
                window.alert = blockPopups;
                console.warn(`PH - Better Berries: Fill clicked, but no level ${currentLevelStr} ${berryType} berries found.`);
                if (fillButton) fillButton.disabled = false; // Ensure enabled if clicked when impossible
            }
        }
        function maxBerries() {
             console.log("PH - Better Berries: Maximizing berries for seed makers.");
             let maxQueue = 0;
             try {
                const capacityElement = document.querySelector(".seedMakerList > [style*='margin-bottom']");
                if (capacityElement) {
                    const match = capacityElement.innerHTML.match(/(\d+)\s*Berries/);
                    if (match && match[1]) { maxQueue = parseInt(match[1]); }
                }
                if (isNaN(maxQueue) || maxQueue <= 0) {
                     console.warn("PH - Better Berries: Could not determine max berry capacity. Aborting maxBerries."); return;
                }
                console.log("PH - Better Berries: Max Queue per maker:", maxQueue);
             } catch(err) { console.error("PH - Better Berries: Error getting max berry capacity:", err); return; }

            let curQueueTotal = 0;
            const seedMakerBerryBag = document.getElementById('seedMakerBerryBag');
            if (!seedMakerBerryBag) { console.error("PH - Better Berries: Cannot find #seedMakerBerryBag container for maxBerries."); return; }
            const berryItems = seedMakerBerryBag.querySelectorAll(":scope > div[data-level]");

            for (let i = berryItems.length - 1; i >= 0; i--) {
                const item = berryItems[i];
                const ownedElement = item.querySelector("span[style*='font-size: 8pt']");
                const inputElement = item.querySelector("input[type='number']");
                if (ownedElement && inputElement) {
                    const ownedCount = parseInt(ownedElement.textContent);
                    if (!isNaN(ownedCount) && ownedCount > 0) {
                        const needed = maxQueue - curQueueTotal; // Logic needs review if it should fill *total* capacity across all inputs vs per maker
                        if (needed <= 0) { inputElement.value = 0; continue; }
                        const amountToAdd = Math.min(ownedCount, needed);
                        inputElement.value = amountToAdd;
                        curQueueTotal += amountToAdd;
                    } else { inputElement.value = 0; }
                } else { console.warn("Could not find owned/input element for item:", item); }
            }
             console.log("PH - Better Berries: Finished maximizing berries. Total amount set in inputs:", curQueueTotal);
        }

    } // End /toolshed block

    console.log("PH - Better Berries: Script execution finished parsing.");

})(); // End IIFE wrapper