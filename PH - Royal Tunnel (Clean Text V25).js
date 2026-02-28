// ==UserScript==
// @name         PH - Royal Tunnel (Clean Text V25)
// @namespace    http://tampermonkey.net/
// @version      25.0
// @description  Waterfall Auto-Nav (Tries Endless -> down to Beginner), Auto-Run safety nets.
// @match        https://pokeheroes.com/royal_tunnel*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // --- Config ---
    const DB_KEY = "RoyalTunnel_DB_V17"; 
    const URL_KEY = "RoyalTunnel_Gist_URL";
    const MAX_RETRIES = 3;

    const getCookie = (n) => { const p = `; ${document.cookie}`.split(`; ${n}=`); return p.length === 2 ? p.pop().split(';').shift() : ""; };
    const setCookie = (n, v) => { document.cookie = `${n}=${v}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`; };

    let tunnelDelay = parseInt(getCookie("tunnelDelay")) || 1000;
    let tunnelBreak = getCookie("tunnelBreak") === "true";
    let autoRun = localStorage.getItem("RT_AutoRun") === "true";

    // --- 1. Init ---
    async function start() {
        addDebugBox();
        renderStatsBox(); 
        log("Bot V25 Initializing...");

        // Process previous guess (Learning System)
        handleLearning();

        // Run waterfall auto-navigation
        if (handleAutoNavigation()) return; 

        const db = await loadDatabase();
        if (!db) return;

        const container = document.querySelector(".royal_tunnel");
        if (!container) return;

        let checks = 0;
        const checkLoad = setInterval(() => {
            const links = container.getElementsByTagName("a");
            let validImages = 0;
            
            for (let i = 0; i < links.length; i++) {
                const img = links[i].querySelector("img");
                if (img && img.src && img.src.includes(".png")) validImages++;
            }

            if (validImages >= 3) {
                clearInterval(checkLoad);
                if (!container.dataset.processed) {
                    container.dataset.processed = "true";
                    
                    // We successfully entered a room! Reset the waterfall navigation index.
                    sessionStorage.removeItem("RT_AutoNavIndex");

                    updateStats(container);
                    setTimeout(() => attemptSolve(container, db, 0), 500);
                }
            }
            checks++;
            if (checks > 100) { 
                clearInterval(checkLoad);
                log("Error: Images did not load in time.");
            }
        }, 100);
    }

    // --- Learning System ---
    function handleLearning() {
        const pendingStr = localStorage.getItem("RT_PendingGuess");
        if (!pendingStr) return;

        const pending = JSON.parse(pendingStr);
        let learnedDB = JSON.parse(localStorage.getItem("RT_Learned_DB")) || { matches: {}, wrongs: {} };
        const bodyText = document.body.innerText;

        if (bodyText.includes("wrong answer") || bodyText.includes("attacked you")) {
            if (!learnedDB.wrongs[pending.qKey]) learnedDB.wrongs[pending.qKey] = [];
            if (!learnedDB.wrongs[pending.qKey].includes(pending.guessedId)) {
                learnedDB.wrongs[pending.qKey].push(pending.guessedId);
            }
            log(`🧠 Learned: ID ${pending.guessedId} is WRONG for this question.`);
        } 
        else if (document.querySelector(".royal_tunnel") || bodyText.includes("Congratulations!")) {
            if (pending.wasGuess) {
                learnedDB.matches[pending.qKey] = pending.guessedId;
                log(`🧠 Learned: ID ${pending.guessedId} is CORRECT! Saved to memory.`);
            }
        }

        localStorage.setItem("RT_Learned_DB", JSON.stringify(learnedDB));
        localStorage.removeItem("RT_PendingGuess");
    }

    // --- Waterfall Auto Navigation ---
    function handleAutoNavigation() {
        if (!autoRun) return false;
        const bodyText = document.body.innerText;

        // 1. Win Screen
        if (bodyText.includes("Congratulations! You reached the end of the tunnel.")) {
            log("Tunnel Completed! Auto-continuing...");
            setTimeout(() => window.location.href = "?cont", tunnelDelay);
            return true;
        }

        // 2. Break Screen
        if (bodyText.includes("You can either take a break or continue")) {
            log("Break Screen. Continuing...");
            if (!tunnelBreak) {
                setTimeout(() => window.location.href = "?cont", tunnelDelay / 2);
                return true;
            }
        }

        // 3. Start Menu / Lose Screen (Waterfall Try-Logic)
        if (bodyText.includes("Start exploring") || bodyText.includes("Choose the right path") || bodyText.includes("this was the wrong answer")) {
            
            const paths = [
                { name: "Endless", url: "?start=endless" },
                { name: "Split-Decision", url: "?start=split" },
                { name: "Pro", url: "?start=pro" },
                { name: "Advanced", url: "?start=advanced" },
                { name: "Beginner", url: "?start=beginner" }
            ];

            let navIndex = parseInt(sessionStorage.getItem("RT_AutoNavIndex") || "0");

            // Safety net: If we tried all 5 and still failed (e.g., out of money)
            if (navIndex >= paths.length) {
                log("All paths failed to start. Out of money? Auto-Run disabled.");
                localStorage.setItem("RT_AutoRun", "false");
                sessionStorage.removeItem("RT_AutoNavIndex");
                setTimeout(() => location.reload(), 2000);
                return true;
            }

            const targetPath = paths[navIndex];
            log(`Trying to start: ${targetPath.name} Path...`);
            
            // Increment the index before reloading. 
            // If the URL is rejected, the page reloads here and tries the next one!
            sessionStorage.setItem("RT_AutoNavIndex", navIndex + 1);
            
            setTimeout(() => window.location.href = targetPath.url, tunnelDelay);
            return true;
        }
        return false;
    }

    // --- Stats Tracker & UI ---
    function updateStats(container) {
        let stats = JSON.parse(localStorage.getItem("RT_Stats")) || { totalRooms: 0, totalGems: 0, gems: {}, lastTrackedLevel: -1, lastGemRoomID: -1 };
        let statsUpdated = false;

        const questEl = document.querySelector(".royal_quest");
        let currentLevel = 0;
        if (questEl) {
            const match = questEl.textContent.match(/Level\s*(\d+)/i);
            if (match) currentLevel = parseInt(match[1]);
        }

        if (currentLevel > 0 && currentLevel !== stats.lastTrackedLevel) {
            stats.totalRooms++;
            stats.lastTrackedLevel = currentLevel;
            statsUpdated = true;
        }

        const gemMatch = container.innerText.match(/\b1x\s+([A-Za-z]+)\s+Gem\s+found!/i);
        if (gemMatch) {
            const gemType = gemMatch[1];
            if (stats.lastGemRoomID !== stats.totalRooms) {
                stats.totalGems++;
                stats.gems[gemType] = (stats.gems[gemType] || 0) + 1;
                stats.lastGemRoomID = stats.totalRooms;
                statsUpdated = true;
                log(`🎉 Tracked: ${gemType} Gem!`);
            }
        }

        if (statsUpdated) localStorage.setItem("RT_Stats", JSON.stringify(stats));
        renderStatsBox();
    }

    function renderStatsBox() {
        let stats = JSON.parse(localStorage.getItem("RT_Stats")) || { totalRooms: 0, totalGems: 0, gems: {} };
        let box = document.getElementById("rt-stats-ui");
        
        if (!box) {
            $("body").append(`
                <div id="rt-stats-ui" style="position: fixed; bottom: 10px; left: 10px; width: 220px; background: rgba(20, 20, 20, 0.9); color: #fff; font-family: sans-serif; border: 2px solid #b8860b; border-radius: 6px; padding: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.5); z-index: 9999;">
                    <div style="font-size: 14px; font-weight: bold; text-align: center; color: #ffd700; margin-bottom: 5px; border-bottom: 1px solid #555; padding-bottom: 5px;">💎 Tunnel Stats</div>
                    <div style="font-size: 12px; line-height: 1.6;">
                        <div>🚪 <b>Total Rooms:</b> <span id="st-rooms">0</span></div>
                        <div>💎 <b>Total Gems:</b> <span id="st-gems">0</span></div>
                        <div>📊 <b>Average:</b> 1 per <span id="st-avg">0</span> rooms</div>
                        <div style="margin-top: 5px; border-top: 1px dotted #555; padding-top: 5px; max-height: 60px; overflow-y: auto; color: #ddd;" id="st-breakdown"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top: 10px;">
                        <button id="toggle-autorun" style="background: ${autoRun ? '#225522' : '#552222'}; color: ${autoRun ? '#99ff99' : '#ff9999'}; border: 1px solid ${autoRun ? '#44ff44' : '#ff4444'}; border-radius:4px; cursor:pointer; font-size:10px; padding:4px 6px; width: 48%; font-weight: bold;">Auto-Run: ${autoRun ? 'ON' : 'OFF'}</button>
                        <button id="reset-rt-stats" style="background:#444; color:#fff; border:1px solid #777; border-radius:4px; cursor:pointer; font-size:10px; padding:4px 6px; width: 48%;">Reset Stats</button>
                    </div>
                    <button id="export-rt-memory" style="width: 100%; margin-top: 6px; background:#2b4b6b; color:#99ccff; border:1px solid #4488ff; border-radius:4px; cursor:pointer; font-size:10px; padding:4px 6px;">💾 Export Memory</button>
                </div>
            `);

            document.getElementById("toggle-autorun").addEventListener("click", () => {
                localStorage.setItem("RT_AutoRun", !autoRun);
                location.reload();
            });

            document.getElementById("reset-rt-stats").addEventListener("click", () => {
                if(confirm("Reset all gem tracking stats?")) {
                    localStorage.removeItem("RT_Stats");
                    location.reload();
                }
            });

            document.getElementById("export-rt-memory").addEventListener("click", () => {
                const mem = localStorage.getItem("RT_Learned_DB");
                if (!mem || mem === '{"matches":{},"wrongs":{}}') {
                    alert("No memory learned yet!");
                    return;
                }
                prompt("Copy this JSON string and paste it at the VERY BOTTOM of your GitHub 'RT clean.txt' file on a new line. The bot will automatically import it next time you reset the DB!", mem);
            });
        }

        document.getElementById("st-rooms").innerText = stats.totalRooms;
        document.getElementById("st-gems").innerText = stats.totalGems;
        const avg = stats.totalGems > 0 ? (stats.totalRooms / stats.totalGems).toFixed(1) : "N/A";
        document.getElementById("st-avg").innerText = avg;

        if (stats.totalGems > 0) {
            let bdHtml = "";
            for (const [type, count] of Object.entries(stats.gems)) { bdHtml += `<div>• ${type}: <b>${count}</b></div>`; }
            document.getElementById("st-breakdown").innerHTML = bdHtml;
        } else {
            document.getElementById("st-breakdown").innerHTML = "No gems yet.";
        }
    }

    // --- DB Loading & Parsing ---
    async function loadDatabase() {
        const cached = localStorage.getItem(DB_KEY);
        if (cached) {
            const db = JSON.parse(cached);
            return db;
        }
        let url = localStorage.getItem(URL_KEY);
        if (!url) {
            url = prompt("Enter your Gist URL:");
            if (!url) return null;
            if (!url.includes("raw")) url = url + "/raw";
            localStorage.setItem(URL_KEY, url);
        }
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET", url: url,
                onload: (res) => {
                    if (res.status === 200) {
                        const db = parseStrictLayout(res.responseText);
                        localStorage.setItem(DB_KEY, JSON.stringify(db));
                        location.reload();
                        resolve(db);
                    } else { alert("Download failed."); localStorage.removeItem(URL_KEY); resolve(null); }
                }
            });
        });
    }

    function parseStrictLayout(text) {
        const db = {};
        const lines = text.split('\n');

        let localMem = JSON.parse(localStorage.getItem("RT_Learned_DB")) || { matches: {}, wrongs: {} };
        let memoryFound = false;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // GitHub Sync Check: Look for exported JSON strings
            if (line.startsWith('{"matches":') || line.startsWith('{"wrongs":')) {
                try {
                    const importedMem = JSON.parse(line);
                    Object.assign(localMem.matches, importedMem.matches || {});
                    for (const [k, v] of Object.entries(importedMem.wrongs || {})) {
                        localMem.wrongs[k] = [...new Set([...(localMem.wrongs[k]||[]), ...v])];
                    }
                    memoryFound = true;
                } catch(e) { log("Found memory JSON but failed to parse it."); }
                continue;
            }

            if (line.startsWith("Pokédex")) continue;
            
            const cols = line.split('\t'); 
            if (cols.length < 5) continue; 
            
            const id = cols[0].trim();
            db[id] = db[id] || [];
            db[id].push({
                n: cols[1].trim(),
                l: (cols[2] || "").replace(/[^0-9]/g, ""),
                h: (cols[3] || "").replace(/[^0-9]/g, ""),
                t: (cols[4] || "").toLowerCase().replace(/,/g, " "),
                c: (cols[5] || "").toLowerCase(),
                e: (cols[6] || "").toLowerCase(),
                d: (cols[7] || "").toLowerCase().replace(/[^a-z0-9]/g, "")
            });
        }

        if (memoryFound) {
            localStorage.setItem("RT_Learned_DB", JSON.stringify(localMem));
            log("Imported Custom Memory from GitHub text file!");
        }

        return db;
    }

    // --- 3. Solver ---
    function attemptSolve(container, db, retryCount) {
        const questEl = document.querySelector(".royal_quest");
        let qHtml = questEl.innerHTML;
        let rawText = questEl.textContent.trim();
        let qText = rawText.replace(/Question.*?Level\s*\d+/gi, "").trim();

        let target = "";
        let mode = "general";

        if (qHtml.includes("type_icons")) {
            mode = "type";
            const match = qHtml.match(/type_icons\/([a-z]+)\.gif/i);
            target = match ? match[1].toLowerCase() : "";
        } else if (qText.match(/evolves.*level/i)) {
            mode = "evo";
            target = (qText.match(/level\s*(\d+)/i) || [])[1] || "";
        } else if (qText.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*(Steps|EHP)/i)) {
            mode = "ehp";
            target = (qText.match(/(\d{1,3}(?:,\d{3})+|\d{3,})/) || [])[1].replace(/,/g, "") || "";
        } else if (qText.match(/Pok[eé]Dex.*?:/i)) {
            mode = "dex";
            target = qText.substring(qText.search(/:/) + 1).toLowerCase().replace(/[^a-z0-9\*]/g, "").replace(/\*+/g, "*"); 
        } else if (qText.match(/considered as/i)) {
            mode = "classification";
            const match = qText.match(/considered as (?:a|an )?(.*?)[\s\-]*Pok/i);
            target = match ? match[1].toLowerCase().trim() : qText.toLowerCase();
        } else if (qText.match(/egggroup|member of the/i)) {
            mode = "egg";
            const quotes = [...qText.matchAll(/"([^"]+)"/g)].map(m => m[1].toLowerCase().trim());
            if (quotes.length > 0) target = quotes; 
            else target = [(qText.match(/member of the (.*?) egg/i) || [])[1]?.toLowerCase().trim() || qText.toLowerCase()];
        } else if (qText.match(/-type/i)) {
            mode = "type";
            target = (qText.match(/is (?:a|an )?(.*?)-type/i) || [])[1]?.toLowerCase().trim() || "";
        } else {
            mode = "name";
            target = qText.replace(/Which of these is (?:a|an )?/i, "").replace(/\?/g, "").trim().toLowerCase();
        }

        const qKey = mode + ":" + JSON.stringify(target);
        if (retryCount === 0) log(`Parsed [${mode}]: ${Array.isArray(target) ? `[${target.join(" & ")}]` : `"${target}"`}`);

        let learnedDB = JSON.parse(localStorage.getItem("RT_Learned_DB")) || { matches: {}, wrongs: {} };
        const learnedMatch = learnedDB.matches[qKey];
        const knownWrongs = learnedDB.wrongs[qKey] || [];

        const links = container.getElementsByTagName("a");
        let matches = [], eliminated = [], unknowns = [];

        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const img = link.querySelector("img");
            if (!img) continue;

            const id = parseInt(img.src.split("/").pop().split(".")[0]).toString(); 
            const variants = db[id];

            if (learnedMatch === id) {
                matches.push({ link, id, name: variants ? variants[0].n : "Memory Match" });
                continue;
            }
            if (knownWrongs.includes(id)) {
                eliminated.push({ link, id, name: variants ? variants[0].n : "Memory Wrong" });
                continue;
            }

            if (!variants) {
                unknowns.push({ link, id, name: "Unknown DB" });
                continue;
            }

            let hasMatch = false, allEliminated = true, hasValidData = false;

            for (const mon of variants) {
                let isFieldValid = false, matchCondition = false;
                if (mode === "evo") { isFieldValid = true; matchCondition = (mon.l === target); } 
                else if (mode === "ehp") { isFieldValid = (mon.h !== ""); matchCondition = (mon.h === target); } 
                else if (mode === "type") { isFieldValid = (mon.t !== ""); matchCondition = mon.t.includes(target); } 
                else if (mode === "dex") {
                    isFieldValid = (mon.d !== "");
                    if (target.includes("*")) {
                        const parts = target.split("*").filter(p => p.length > 0);
                        let validSeq = true, s = 0;
                        for (const p of parts) {
                            const idx = mon.d.indexOf(p, s);
                            if (idx === -1) { validSeq = false; break; }
                            s = idx + p.length; 
                        }
                        matchCondition = validSeq;
                    } else { matchCondition = (mon.d === target || mon.d.includes(target) || target.includes(mon.d)); }
                } 
                else if (mode === "classification") { isFieldValid = (mon.c !== ""); matchCondition = mon.c.includes(target); } 
                else if (mode === "egg") { isFieldValid = (mon.e !== ""); matchCondition = target.every(t => mon.e.includes(t)); } 
                else if (mode === "name") { isFieldValid = (mon.n !== ""); matchCondition = (mon.n.toLowerCase() === target || target.includes(mon.n.toLowerCase())); }

                if (isFieldValid) { hasValidData = true; if (matchCondition) { hasMatch = true; allEliminated = false; } } 
                else { allEliminated = false; }
            }

            if (hasMatch) matches.push({ link, id, name: variants[0].n });
            else if (hasValidData && allEliminated) eliminated.push({ link, id, name: variants[0].n });
            else unknowns.push({ link, id, name: variants[0].n });
        }

        let foundLink = null;
        let chosenId = null;
        let wasGuess = false;

        if (matches.length > 0) {
            log(`MATCH: Clicked ID ${matches[0].id} (${matches[0].name})`);
            foundLink = matches[0].link;
            chosenId = matches[0].id;
        } 
        else if (eliminated.length === 2 && unknowns.length === 1) {
            log(`ELIMINATION: Clicked ID ${unknowns[0].id} (${unknowns[0].name})`);
            foundLink = unknowns[0].link;
            chosenId = unknowns[0].id;
            wasGuess = true; 
        }
        else if (unknowns.length > 0) {
            const guess = unknowns[Math.floor(Math.random() * unknowns.length)];
            log(`GUESS (${unknowns.length} Unk): Clicked ID ${guess.id} (${guess.name})`);
            foundLink = guess.link;
            chosenId = guess.id;
            wasGuess = true;
        } 
        else if (eliminated.length > 0) {
            const guess = eliminated[Math.floor(Math.random() * eliminated.length)];
            log(`GUESS (All Elim): Clicked ID ${guess.id} (${guess.name})`);
            foundLink = guess.link;
            chosenId = guess.id;
            wasGuess = true;
        }

        if (foundLink) {
            localStorage.setItem("RT_PendingGuess", JSON.stringify({ qKey, guessedId: chosenId, wasGuess }));
            const delay = tunnelDelay + (Math.random() * 200); 
            setTimeout(() => window.location.href = foundLink.href, delay);
        } else {
            if (retryCount < MAX_RETRIES) {
                setTimeout(() => attemptSolve(container, db, retryCount + 1), 1000);
            } else {
                log(`FAILED. Cannot determine answer.`);
            }
        }
    }

    function log(msg) {
        console.log("[RTBot]", msg);
        const box = document.getElementById("rt-debug");
        if (box) { box.innerHTML += `<div>> ${msg}</div>`; box.scrollTop = box.scrollHeight; }
    }

    function addDebugBox() {
        if (!document.getElementById("rt-debug")) {
            $("body").append(`
                <div id="rt-debug" style="position: fixed; bottom: 10px; right: 10px; width: 300px; height: 160px; background: rgba(0,0,0,0.85); color: #0f0; font-family: monospace; font-size: 11px; overflow-y: auto; padding: 5px; z-index: 9999; border: 1px solid #0f0; pointer-events:none;"></div>
            `);
        }
    }

    start();
})();