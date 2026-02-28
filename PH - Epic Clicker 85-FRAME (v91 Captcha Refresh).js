// ==UserScript==
// @name         PH - Epic Clicker 85-FRAME (v91 Captcha Refresh)
// @version      91.0
// @description  Visual Load Indicators (Green=Ready, White=Loading). Forces iframe reload after solving Captcha.
// @author       warpKaiba (UI & Logic by Domodoco / AI)
// @match        https://pokeheroes.com/pokemon_lite*
// @match        https://pokeheroes.com/clicklist*
// @grant        GM.xmlHttpRequest
// @connect      pokeheroes.com
// @connect      staticpokeheroes.com
// @icon         https://vignette.wikia.nocookie.net/pkmnshuffle/images/7/7f/Ducklett.png/revision/latest?cb=20170409032016
// ==/UserScript==

(function () {
    'use strict';

    if (window.top !== window.self) return;

    // --- CONFIGURATION DEFAULTS ---
    const SETTINGS = {
        CONCURRENT_TABS: 5, 
        BATCH_SIZE: 30,     
        STREAM_SPEED: 25,   
        feed: localStorage.getItem('PH_CLICKER_ACTION_FEED') === 'true',
    };

    const TARGETS = [
        // Standard
        { id: 'f_random', type: 'Random', url: 'https://pokeheroes.com/pokemon_lite?cl_type=random' },
        { id: 'f_newest', type: 'Newest', url: 'https://pokeheroes.com/pokemon_lite?cl_type=newest' },
        { id: 'f_friend', type: 'Friend', url: 'https://pokeheroes.com/pokemon_lite?cl_type=friend2' },
        { id: 'f_online', type: 'Online', url: 'https://pokeheroes.com/pokemon_lite?cl_type=online' },
        
        // Mass Lists
        { id: 'm_nymph', type: 'Nymphrasis', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Nymphrasis' },
        { id: 'm_royal', type: 'RoyalGecko', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_RoyalGecko' },
        { id: 'm_space', type: 'Spacebar', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Spacebar' },
        { id: 'm_imagi', type: 'imagine', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_imagine' },
        { id: 'm_kazya', type: 'Kazyaquin', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Kazyaquin' },
        { id: 'm_masse', type: 'masserozzo', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_masserozzo' },
        { id: 'm_espy',  type: 'Espy', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Espy' },
        { id: 'm_kast',  type: 'InactiveKastel', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_InactiveKastel' },
        { id: 'm_drag',  type: 'DragonSumedh', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_DragonSumedh' },
        { id: 'm_kd6',   type: 'KD6-37', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_KD6-37' },
        { id: 'm_tord',  type: 'tord', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_tord' },
        { id: 'm_banz',  type: 'BanzhanMushroom', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_BanzhanMushroom' },
        { id: 'm_truo',  type: 'TRUONGNGOCTRIEU', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_TRUONGNGOCTRIEU' },
        { id: 'm_blea',  type: 'BLEACHIchigo1', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_BLEACHIchigo1' },
        { id: 'm_sock',  type: 'socks', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_socks' },
        { id: 'm_lalv',  type: 'LALVOE', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_LALVOE' },
        { id: 'm_peng',  type: 'PenguinPowerful', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_PenguinPowerful' },
        { id: 'm_soff',  type: 'Soffia', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Soffia' },
        { id: 'm_purr',  type: 'Purrloin', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Purrloin' },
        { id: 'm_shys',  type: 'ShyShine', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_ShyShine' },
        { id: 'm_muse',  type: 'Muse', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Muse' },
        { id: 'm_cham',  type: 'champ1509', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_champ1509' },
        { id: 'm_shad',  type: 'ShadowWolf18', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_ShadowWolf18' },
        { id: 'm_finh',  type: 'Finhawk', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Finhawk' },
        { id: 'm_rock',  type: 'TheRockers', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_TheRockers' },
        { id: 'm_kuro',  type: 'Kuroo', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Kuroo' },
        { id: 'm_vixi',  type: 'Vixie', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Vixie' },
        { id: 'm_wolf',  type: 'Wolfsdrache', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Wolfsdrache' },
        { id: 'm_ange',  type: 'Angel_Flamel', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Angel_Flamel' },
        { id: 'm_tiff',  type: 'tiffanyp6', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_tiffanyp6' },
        { id: 'm_jaeg',  type: 'Jaegar', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Jaegar' },
        { id: 'm_alie',  type: 'AlienSnowFlake', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_AlienSnowFlake' },
        { id: 'm_csox',  type: 'Csoxi', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Csoxi' },
        { id: 'm_moma', type: 'momalia', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_momalia' },
        { id: 'm_nobo', type: 'Noboaku', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Noboaku' },
        { id: 'm_loke', type: 'loketoke', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_loketoke' },
        { id: 'm_tuna', type: 'Tuna', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Tuna' },
        { id: 'm_zark', type: 'Zarkesh', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Zarkesh' },
        { id: 'm_nika', type: 'Nika~', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Nika~' },
        { id: 'm_jach', type: 'Jacharias', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Jacharias' },
        { id: 'm_corb', type: 'Corbeau', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Corbeau' },
        { id: 'm_hype', type: 'HyperBeam', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_HyperBeam' },
        { id: 'm_kety', type: 'Kety', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Kety' },
        { id: 'm_fahr', type: '~Fahrenheit~', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_~Fahrenheit~' },
        { id: 'm_mine', type: '~Minerva~', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_~Minerva~' },
        { id: 'm_mani', type: 'Maniac', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Maniac' },
        { id: 'm_dare', type: 'Darenia', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Darenia' },
        { id: 'm_thcp', type: 'ThCPro', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_ThCPro' },
        { id: 'm_kikk', type: 'kikkoman1', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_kikkoman1' },
        { id: 'm_shin', type: 'ShinyMegaHunter', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_ShinyMegaHunter' },
        { id: 'm_ohma', type: 'Ohma_Tokita', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Ohma_Tokita' },
        { id: 'm_anor', type: 'anorchoclown', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_anorchoclown' },
        { id: 'm_barn', type: 'BarnacleBoy', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_BarnacleBoy' },
        { id: 'm_skip', type: 'Skips', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Skips' },
        { id: 'm_arge', type: 'Argentis', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Argentis' },
        { id: 'm_lili', type: 'Lilith99', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Lilith99' },
        { id: 'm_prof', type: 'Professor_Elm', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Professor_Elm' },
        { id: 'm_kimi', type: 'Kimie', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Kimie' },
        { id: 'm_walt', type: 'Waltz', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Waltz' },
        { id: 'm_shad2', type: 'Shadowplay', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Shadowplay' },
        { id: 'm_puni', type: 'punisher023', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_punisher023' },
        { id: 'm_zell', type: 'Zellane', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Zellane' },
        { id: 'm_okay', type: 'Okay', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Okay' },
        { id: 'm_redr', type: 'Redrose199', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Redrose199' },
        { id: 'm_lorr', type: 'Lorry14', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Lorry14' },
        { id: 'm_rsco', type: 'Rscorpions2', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Rscorpions2' },
        { id: 'm_exoc', type: 'Exocomet', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Exocomet' },
        { id: 'm_feen', type: 'Feena', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Feena' },
        { id: 'm_inte', type: 'Internalalloy666', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Internalalloy666' },
        { id: 'm_kitt', type: 'KittyMeow', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_KittyMeow' },
        { id: 'm_silv', type: 'SilverShinyBirdizard', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_SilverShinyBirdizard' },
        { id: 'm_nyx',  type: '_Nyx_', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass__Nyx_' },
        { id: 'm_cher', type: 'Cherry_Blossom', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Cherry_Blossom' },
        { id: 'm_bun',  type: 'Bun-Bun', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Bun-Bun' },
        { id: 'm_impe', type: 'ImperialHound', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_ImperialHound' },
        { id: 'm_catl', type: 'Catlexx', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Catlexx' },
        { id: 'm_mafi', type: 'Mafia', url: 'https://pokeheroes.com/pokemon_lite?cl_type=mass_Mafia' }
    ];

    let state = {
        isRunning: false,
        totalInteractions: 0,
        framesReady: false,
        activeTabIndex: 0,
    };

    // --- UI RENDER ---
    function renderUI() {
        if (!document.body) { setTimeout(renderUI, 100); return; }
        if (document.getElementById('ph-iframe-ui')) return;

        const html = `
            <div id="ph-iframe-ui" style="background: #080808; color: #fff; padding: 10px; border-bottom: 2px solid #333; font-family: sans-serif; margin-bottom: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div>
                        <span style="font-size:16px; font-weight:bold; color:#00ffcc;">VISUAL UPDATE v91</span>
                    </div>
                    <div style="text-align:right;">
                        <button id="ph-btn-init" style="padding: 5px 10px; font-weight:bold; border:none; border-radius:4px; cursor:pointer; background: #2980b9; color:white; margin-right: 5px;">LOAD</button>
                        <button id="ph-btn-run" style="padding: 5px 10px; font-weight:bold; border:none; border-radius:4px; cursor:pointer; background: #333; color:#777;" disabled>ENGAGE</button>
                    </div>
                </div>

                <!-- CONTROLS -->
                <div style="display:flex; gap: 10px; margin-bottom: 10px; background: #1a1a1a; padding: 8px; border-radius: 4px; flex-wrap: wrap; align-items:center;">
                    <div style="display:flex; align-items:center;">
                        <label style="font-size:10px; color:#aaa; margin-right:5px;">Tabs/Cycle:</label>
                        <input id="input-tabs" type="number" value="${SETTINGS.CONCURRENT_TABS}" min="1" max="40" style="width:40px; background:#333; color:white; border:1px solid #555; padding:2px; text-align:center;">
                    </div>
                    <div style="display:flex; align-items:center;">
                        <label style="font-size:10px; color:#aaa; margin-right:5px;">Batch:</label>
                        <input id="input-batch" type="number" value="${SETTINGS.BATCH_SIZE}" min="1" max="100" style="width:40px; background:#333; color:white; border:1px solid #555; padding:2px; text-align:center;">
                    </div>
                    <div style="display:flex; align-items:center;">
                        <label style="font-size:10px; color:#aaa; margin-right:5px;">Delay:</label>
                        <input id="input-speed" type="number" value="${SETTINGS.STREAM_SPEED}" min="10" max="1000" style="width:45px; background:#333; color:white; border:1px solid #555; padding:2px; text-align:center;">
                    </div>
                    <div style="display:flex; align-items:center; margin-left:auto;">
                        <button id="ph-btn-action" style="background:${SETTINGS.feed ? '#8e44ad' : '#e67e22'}; color:white; border:none; border-radius:4px; padding:4px 10px; font-size:11px; font-weight:bold; cursor:pointer;">
                            ${SETTINGS.feed ? '🍓' : '☀️'}
                        </button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 2px; max-height: 350px; overflow-y: auto;">
                    ${TARGETS.map(t => `
                        <div id="card-${t.id}" style="background:#111; padding:2px; font-size:9px; color:#555; text-align:center; border:1px solid #333;">
                            ${t.type.substring(0,8)}
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top: 8px; text-align: center; font-size: 14px;">
                    CLICKS: <b id="ph-global-total" style="color: #fff;">0</b>
                </div>
                <div id="ph-frame-container" style="opacity: 0; pointer-events: none; height: 0; overflow: hidden;"></div>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = html;
        document.querySelector('#textbar').prepend(div);

        // Bind Buttons
        document.getElementById('ph-btn-init').onclick = initFrames;
        document.getElementById('ph-btn-run').onclick = toggleRun;

        // Bind Inputs
        document.getElementById('input-tabs').addEventListener('change', (e) => SETTINGS.CONCURRENT_TABS = parseInt(e.target.value) || 1);
        document.getElementById('input-batch').addEventListener('change', (e) => SETTINGS.BATCH_SIZE = parseInt(e.target.value) || 1);
        document.getElementById('input-speed').addEventListener('change', (e) => SETTINGS.STREAM_SPEED = parseInt(e.target.value) || 25);

        // Bind Toggle Warm/Feed
        document.getElementById('ph-btn-action').addEventListener('click', (e) => {
            SETTINGS.feed = !SETTINGS.feed;
            localStorage.setItem('PH_CLICKER_ACTION_FEED', SETTINGS.feed);
            e.target.innerText = SETTINGS.feed ? '🍓' : '☀️';
            e.target.style.background = SETTINGS.feed ? '#8e44ad' : '#e67e22';
        });
    }

    // --- INITIALIZATION ---

    function initFrames() {
        const container = document.getElementById('ph-frame-container');
        const btnInit = document.getElementById('ph-btn-init');
        btnInit.disabled = true;
        btnInit.innerText = "LOADING...";

        TARGETS.forEach((t, index) => {
            t.solving = false;
            t.exhausted = false; 
            t.lastLoadRequest = 0; 

            setTimeout(() => {
                const iframe = document.createElement('iframe');
                iframe.id = t.id;
                iframe.src = t.url;
                
                t.iframe = iframe;

                iframe.onload = () => {
                    setCardColor(t.id, "READY");
                    checkFrameReady();
                };
                container.appendChild(iframe);
            }, index * 100); 
        });
    }

    function checkFrameReady() {
        const btnRun = document.getElementById('ph-btn-run');
        if(btnRun.disabled) {
            btnRun.disabled = false;
            btnRun.style.background = "#00ffcc";
            btnRun.style.color = "black";
            state.framesReady = true;
        }
    }

    function toggleRun() {
        if (!state.framesReady) return;
        state.isRunning = !state.isRunning;

        const btn = document.getElementById('ph-btn-run');
        if (state.isRunning) {
            btn.innerText = "STOP";
            btn.style.background = "#e74c3c";
            btn.style.color = "white";
            runStreamLoop();
        } else {
            btn.innerText = "ENGAGE";
            btn.style.background = "#00ffcc";
            btn.style.color = "black";
        }
    }

    // --- THE STREAM LOOP ---

    function runStreamLoop() {
        if (!state.isRunning) return;

        let tabsActedThisCycle = 0;
        let tabsCheckedThisCycle = 0;
        let clicksFiredThisCycle = 0;

        // Loop until we have processed enough tabs OR checked everything
        while (tabsCheckedThisCycle < TARGETS.length && tabsActedThisCycle < SETTINGS.CONCURRENT_TABS) {
            const t = TARGETS[state.activeTabIndex];
            state.activeTabIndex = (state.activeTabIndex + 1) % TARGETS.length;
            tabsCheckedThisCycle++;

            if (!t.iframe || !t.iframe.contentWindow) continue;
            if (t.solving || t.exhausted) continue;

            const win = t.iframe.contentWindow;
            const doc = t.iframe.contentDocument || win.document;

            // 1. Check if Finished
            const bodyText = doc.body.innerText || "";
            if (bodyText.includes("interacted with all Pokémon")) {
                t.exhausted = true;
                setCardColor(t.id, "DONE");
                continue;
            }

            // 2. Captcha
            const cheatContainer = doc.querySelector('.cheat_valid');
            if (cheatContainer) {
                handleCaptcha(t, doc, win, cheatContainer);
                continue;
            }

            // 3. Pokemon!
            if (win.pkmn_arr && win.pkmn_arr.length > 0) {
                
                const toProcess = win.pkmn_arr.splice(0, SETTINGS.BATCH_SIZE);
                toProcess.forEach(p => { performInteraction(p[0], p[1], win, t); });

                clicksFiredThisCycle += toProcess.length;
                tabsActedThisCycle++; 
                
                // If emptied, reload
                if (win.pkmn_arr.length === 0 && typeof win.loadNextPkmn === 'function') {
                    setCardColor(t.id, "LOADING");
                    win.loadNextPkmn();
                    // Set back to green after short delay optimistically
                    setTimeout(() => setCardColor(t.id, "READY"), 500);
                }
            } 
            // 4. Empty
            else {
                if (Date.now() - t.lastLoadRequest > 2000) {
                    t.lastLoadRequest = Date.now();
                    const startBtn = doc.querySelector('input[type="submit"][value="Start Clicklist!"]');
                    if (startBtn) {
                        setCardColor(t.id, "LOADING");
                        startBtn.click();
                    } else if (typeof win.loadNextPkmn === 'function') {
                        setCardColor(t.id, "LOADING");
                        win.loadNextPkmn();
                        setTimeout(() => setCardColor(t.id, "READY"), 500);
                    }
                }
            }
        }

        if (clicksFiredThisCycle > 0) {
            state.totalInteractions += clicksFiredThisCycle;
            document.getElementById(`ph-global-total`).innerText = state.totalInteractions;
        }

        setTimeout(runStreamLoop, SETTINGS.STREAM_SPEED);
    }

    // --- HELPERS ---

    function setCardColor(id, status) {
        const card = document.getElementById(`card-${id}`);
        if (!card) return;

        if (status === "READY") {
            card.style.borderColor = "#2ecc71"; // Green
            card.style.color = "#fff";
            card.style.opacity = "1.0";
        } else if (status === "LOADING") {
            card.style.borderColor = "#555"; // Grey
            card.style.color = "#aaa";
        } else if (status === "CAPTCHA") {
            card.style.borderColor = "#f1c40f"; // Yellow
            card.style.color = "#f1c40f";
        } else if (status === "DONE") {
            card.style.borderColor = "#e74c3c"; // Red
            card.style.opacity = "0.3";
        }
    }

    function handleCaptcha(targetObj, doc, win, container) {
        if (targetObj.solving) return;
        targetObj.solving = true;
        setCardColor(targetObj.id, "CAPTCHA");

        const pokemonURLs = Array.from(container.querySelectorAll('img[onclick]'));
        const mainImg = container.querySelector('img');

        if (!mainImg || pokemonURLs.length === 0) {
            targetObj.solving = false;
            return;
        }

        const pokemonAnswer = mainImg.src.match(/\d+/)?.[0];
        const validationNumbers = pokemonURLs.map((img) => img.src.match(/\d+/)?.[0]);
        let completedRequests = 0;

        pokemonURLs.forEach((img, index) => {
            GM.xmlHttpRequest({
                method: 'GET',
                url: img.src,
                headers: { 'User-Agent': navigator.userAgent, 'Accept': 'text/xml' },
                onload: (response) => {
                    const urlMatch = response.finalUrl.match(/\d+/)?.[0];
                    if (parseInt(urlMatch) === parseInt(pokemonAnswer)) {
                        if (typeof win.chooseValidation === 'function') {
                            win.chooseValidation(parseInt(validationNumbers[index]));
                            
                            // FORCE RELOAD AFTER SOLVE
                            setTimeout(() => { 
                                targetObj.iframe.contentWindow.location.reload(); // The magic refresh
                                targetObj.solving = false;
                                setCardColor(targetObj.id, "LOADING"); // Will turn green on onload
                            }, 1500);
                        } else { targetObj.solving = false; }
                    }
                    completedRequests++;
                    // Fallback timeout
                    if (completedRequests >= pokemonURLs.length && targetObj.solving) {
                         setTimeout(() => { targetObj.solving = false; }, 5000);
                    }
                },
                onerror: () => { targetObj.solving = false; }
            });
        });
    }

    function performInteraction(id, sid, frameWindow, targetObj) {
        let method = 'warm';
        let berry = '';

        if (SETTINGS.feed && frameWindow.int_berry && frameWindow.berry_bag) {
            const hasBerries = frameWindow.berry_bag.some(b => b[1] > 0);
            if (hasBerries) {
                method = 'feed';
                berry = frameWindow.int_berry;
            }
        }

        if (typeof frameWindow.cl_c !== 'undefined') frameWindow.cl_c++;

        const params = new URLSearchParams();
        params.append('pkmnid', id);
        params.append('pkmnsid', sid);
        params.append('method', method);
        params.append('berry', berry);
        params.append('timeclick', Date.now());
        params.append('inarow', frameWindow.cl_c || 0);

        fetch('https://pokeheroes.com/includes/ajax/pokemon/lite_interact.php', {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).catch(() => {});
    }

    renderUI();

})();