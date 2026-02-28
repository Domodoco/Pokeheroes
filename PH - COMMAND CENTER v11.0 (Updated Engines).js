// ==UserScript==
// @name         PH - COMMAND CENTER v11.0 (Updated Engines)
// @version      11.0
// @description  Updated HoL to Deep Socket (v21) and Rumble to Dynamic Timer (v9). Master interface for all bots.
// @author       warpKaiba & Domodoco (Architecture by AI)
// @match        https://pokeheroes.com/
// @grant        none
// @icon         https://vignette.wikia.nocookie.net/pkmnshuffle/images/7/7f/Ducklett.png/revision/latest?cb=20170409032016
// ==/UserScript==

(function () {
    'use strict';

    // Only run on Homepage
    if (window.top !== window.self) return; 
    if (!window.location.href.includes('index') && window.location.href !== 'https://pokeheroes.com/') return;

    // Default toggle states
    const TOGGLES = ['PH_CC_CLICKER_ACTIVE', 'PH_CC_HANGMAN_ACTIVE', 'PH_CC_HOL_ACTIVE', 'RT_AutoRun', 'PH_HATCH_LOOP_RUNNING', 'PH_HT_RUNNING', 'PH_BL_RUN'];
    TOGGLES.forEach(key => { if (!localStorage.getItem(key)) localStorage.setItem(key, 'false'); });
    
    if (!localStorage.getItem('PH_HATCH_LOOP_TARGET')) localStorage.setItem('PH_HATCH_LOOP_TARGET', 'lab');
    if (!localStorage.getItem('PH_HT_TYPE')) localStorage.setItem('PH_HT_TYPE', 'normal');

    const WORKERS = [
        { id: 'w_home',    name: 'Love / Home', url: 'https://pokeheroes.com/index' },
        { id: 'w_rumble',  name: 'Rumble',      url: 'https://pokeheroes.com/rumble_overview' },
        { id: 'w_treasure',name: 'Treasure',    url: 'https://pokeheroes.com/treasures' },
        { id: 'w_dream',   name: 'DreamWorld',  url: 'https://pokeheroes.com/dw_shop' },
        { id: 'w_c_new',   name: 'CL: Newest',  url: 'https://pokeheroes.com/pokemon_lite?cl_type=newest' },
        { id: 'w_hangman', name: 'Hangman',     url: 'https://pokeheroes.com/gc_hangman' },
        { id: 'w_hol',     name: 'HoL RNG',     url: 'https://pokeheroes.com/gc_hol' },
        { id: 'w_concent', name: 'Concentrat.', url: 'https://pokeheroes.com/gc_concentration?d=2' },
        { id: 'w_fish',    name: 'Easy Fish',   url: 'https://pokeheroes.com/beach' },
        { id: 'w_rt',      name: 'Royal Tun.',  url: 'https://pokeheroes.com/royal_tunnel' },
        { id: 'w_slot',    name: 'Turbo Slot',  url: 'https://pokeheroes.com/golden_slot' },
        { id: 'w_hatch',   name: 'Hatch+Store', url: 'https://pokeheroes.com/lab' },
        { id: 'w_honey',   name: 'Honey Tree',  url: 'https://pokeheroes.com/honeytree' },
        { id: 'w_berry',   name: 'Auto Berry',  url: 'https://pokeheroes.com/berrygarden' },
        { id: 'w_radar',   name: 'Shadow Radar',url: 'https://pokeheroes.com/shadowradar' }
    ];

    // =========================================================================
    // SECTION 1: PAYLOADS
    // =========================================================================

    function payloadHome() {
        function clickLoveEggLink() { var a = document.querySelector('a[onclick="interactLoveEgg();"]'); if(a) a.click(); }
        function clickLovePokemonLink() { setTimeout(()=> { var a = document.querySelector('a[onclick="interactLovePkmn();"]'); if(a) a.click(); }, 1000); }
        clickLoveEggLink(); clickLovePokemonLink();
        setTimeout(() => window.location.href = "https://pokeheroes.com/index", 30000);
        try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'Active (30s)' }, '*'); } catch(e){}
    }

    function payloadDream() {
        let clicked = false;
        document.querySelectorAll('a[href*="claim"]').forEach(link => { if (!link.href.includes("claim=4")) { link.click(); clicked = true; } });
        try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: clicked ? "Claimed DP" : "Sleeping (4m)" }, '*'); } catch(e){}
        setTimeout(() => window.location.href = "https://pokeheroes.com/dw_shop", 240000);
    }

    function payloadTreasure() {
        const u = window.location.href; let s = "Running";
        if (!u.includes("?start") && !u.includes("?choose")) { s = "Starting Hunt"; window.location.href = "https://pokeheroes.com/treasures?start"; }
        else if (u.includes("?start")) { s = "Choosing Chest"; setTimeout(() => { window.location.href = "https://pokeheroes.com/treasures?choose=0"; }, 1000); }
        else if (u.includes("?choose=0")) { s = "Sleeping (60s)"; setTimeout(() => { window.location.href = "https://pokeheroes.com/treasures"; }, 60000); }
        try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: s }, '*'); } catch(e){}
    }

    function payloadClicker() {
        async function runLoop() {
            if (localStorage.getItem('PH_CC_CLICKER_ACTIVE') !== 'true') {
                try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'PAUSED' }, '*'); } catch(e){}
                setTimeout(runLoop, 1000); return;
            }
            const sBtn = document.querySelector('input[type="submit"][value="Start Clicklist!"]');
            if (sBtn) { try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'Starting...' }, '*'); } catch(e){} sBtn.click(); return; }
            if (typeof pkmn_arr !== 'undefined' && pkmn_arr.length > 0) {
                try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'Clicking ' + pkmn_arr.length }, '*'); } catch(e){}
                for (let i = 0; i < pkmn_arr.length; i++) {
                    if (localStorage.getItem('PH_CC_CLICKER_ACTIVE') !== 'true') break;
                    const p = pkmn_arr[i]; const xhr = new XMLHttpRequest();
                    xhr.open("POST", "includes/ajax/pokemon/lite_interact.php", true);
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    xhr.send(`pkmnid=${p[0]}&pkmnsid=${p[1]}&method=warm&berry=&timeclick=${Date.now()}&inarow=${cl_c || 0}`);
                    await new Promise(r => setTimeout(r, 80));
                }
                pkmn_arr = []; if (typeof loadNextPkmn === 'function') loadNextPkmn(); setTimeout(runLoop, 2000);
            } else {
                try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'Reloading...' }, '*'); } catch(e){}
                setTimeout(() => window.location.href = "https://pokeheroes.com/pokemon_lite?cl_type=newest", 3000);
            }
        }
        runLoop();
    }

    // --- RUMBLE PAYLOAD (v9 Dynamic Timer Integrated) ---
    function payloadRumble() {
        const SCAN_RATE = 1500;
        const DEFAULT_REFRESH_MS = 5 * 60 * 1000;
        const BUFFER_MS = 3000;
        let dynamicRefreshTimer = null;

        function log(msg) {
             try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: msg }, '*'); } catch(e){}
        }

        function calculateNextRefresh() {
            const bodyText = document.body.innerText;
            const matches = [...bodyText.matchAll(/Return:\s+(\d{1,2}):(\d{2}):(\d{2})/g)];
            
            if (matches.length === 0) {
                setRefresh(DEFAULT_REFRESH_MS, "No active missions");
                return;
            }

            let minMs = DEFAULT_REFRESH_MS;
            let foundShortest = false;

            for (const match of matches) {
                const h = parseInt(match[1]);
                const m = parseInt(match[2]);
                const s = parseInt(match[3]);
                let totalMs = ((h * 3600) + (m * 60) + s) * 1000;

                // 20+ Hour Check (Reset bug)
                if (h >= 20) totalMs = 100;

                if (totalMs < minMs) {
                    minMs = totalMs;
                    foundShortest = true;
                }
            }

            if (foundShortest) {
                setRefresh(minMs + BUFFER_MS, "Calculated");
            } else {
                setRefresh(DEFAULT_REFRESH_MS, "Default");
            }
        }

        function setRefresh(ms, reason) {
            if (dynamicRefreshTimer) clearTimeout(dynamicRefreshTimer);
            if (ms < 2000) ms = 2000;

            const mins = Math.floor(ms / 60000);
            log(`Wait ${mins}m (${reason})`);
            
            dynamicRefreshTimer = setTimeout(() => {
                log("Refreshing...");
                location.reload();
            }, ms);
        }

        function isVisible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }

        function rumbleLoop() {
            let actionTaken = false;
            // 1. Confirm Resend
            const boldTags = document.getElementsByTagName('b');
            for (let b of boldTags) {
                if (b.innerText === "Resend" && isVisible(b)) {
                    let parent = b.parentElement; 
                    if (parent && parent.getAttribute('onclick')) {
                        log("Confirming Resend...");
                        parent.click();
                        actionTaken = true;
                        break;
                    }
                }
            }
            // 2. Summary Resend
            if (!actionTaken) {
                const summaryBtns = document.querySelectorAll('[onclick*="resendRumbler"]');
                for (let btn of summaryBtns) {
                    if (isVisible(btn)) {
                        log("Resending...");
                        btn.click();
                        actionTaken = true;
                        break;
                    }
                }
            }
            // 3. Retrieve
            if (!actionTaken) {
                const retrieveBtns = document.querySelectorAll('.retrieve_screen a div');
                for (const btn of retrieveBtns) {
                    if (isVisible(btn) && btn.innerText.includes("Retrieve")) {
                        log("Retrieving...");
                        if (btn.parentElement && btn.parentElement.tagName === 'A') btn.parentElement.click();
                        else btn.click();
                        actionTaken = true;
                        break;
                    }
                }
            }
            
            if (actionTaken) {
                if (dynamicRefreshTimer) clearTimeout(dynamicRefreshTimer);
                setTimeout(calculateNextRefresh, 2000); 
            }
        }

        setInterval(rumbleLoop, SCAN_RATE);
        setTimeout(calculateNextRefresh, 1000);
        log("Rumble v9 Active");
    }

    function payloadHangman() {
        if (localStorage.getItem('PH_CC_HANGMAN_ACTIVE') !== 'true') {
            try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'PAUSED' }, '*'); } catch(e){}
            setInterval(() => { if (localStorage.getItem('PH_CC_HANGMAN_ACTIVE') === 'true') window.location.href = "https://pokeheroes.com/gc_hangman"; }, 1500); return;
        }
        try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'Playing...' }, '*'); } catch(e){}
        const nextBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Next Hangman'));
        if (nextBtn) { nextBtn.click(); return; }
        const hangmanEl = document.querySelector('[style="font-size: 14pt; letter-spacing: 0.5em"]');
        if (!hangmanEl) {
            const sBtn = document.querySelector('input[value="Play Hangman"], input[value="Start Game"]');
            if (sBtn) { sBtn.click(); return; }
            setTimeout(() => window.location.href = "https://pokeheroes.com/gc_hangman", 4000); return;
        }
        const currentHangman = hangmanEl.textContent;
        const guessedLetters = Array.from(document.querySelectorAll("[style='opacity: 0.6']")).map(e => e.textContent.toLowerCase()).join('');
        const regexStr = '^' + currentHangman.replace(/_/g, `[^${guessedLetters}\\s]`).replace(/\s/g, '\\s') + '$';
        const reg = new RegExp(regexStr, 'i');
        const wordListStr = "Abomasnow,Abra,Absol,Absorb Bulb,Accelgor,Acid Armor,Acro Bike,Acrobatics,Adaptability,Advanced Path,Advent Raffle Ticket,Aegislash,Aerial Ace,Aerodactyl,Aggron,Aggronite,Agility,Aguav Berry,Aipom,Air Balloon,Alakazam,Almia,Alola,Alomomola,Alpha Sapphire,Altaria,Amaura,Ambipom,Amoonguss,Ampharos,Amulet Coin,Ancient Cave,Anger Point,Anime,Anniversary Gift,Anorith,Antidote,Apicot Berry,Appletun,Applewoodo,Applin,Apricorn,Apricorn Battle,Aqua,Araquanid,Arbok,Arcaddly,Arcanine,Arceus,Archen,Archeops,Ariados,Armaldo,Armor Fossil,Aromatherapy,Aromatisse,Aron,Arrokuda,Articuno,Ash Ketchum,Aspear Berry,Aspertia City,Attack,Attack Order,Auction,Auction House,Audino,Aura Sphere,Aurora,Aurora Beam,Aurorus,Autumn Abra,Autumn Alakazam,Autumn Flaaffy,Autumn Kadabra,Autumn Mareep,Avalugg,Avatar,Awakening,Axew,Azelf,Azumarill,Azurill,Babiri Berry,Baby Ducklett,Badge,Badge Case,Badge Set,Bagon,Baltoy,Banette,Banettenstein,Barbaracle,Barboach,Baron Fraxure,Barraskewda,Bastiodon,Battle,Battle Frontier,Battle Shop,Battle Team,Bayleef,Beach,Beachamp,Beartic,Beautifly,Beedrill,Begging,Beginner Path,Beheeyem,Beldum,Bellossom,Bellsprout,Belue Berry,Bergmite,Berry,Berry Garden,Berrydex,Bewear,Bibarel,Bidoof,Big Mushroom,Big Nugget,Big Nuggets,Big Pearl,Big Root,Bills House,Binacle,Bisharp,Blacephalon,Black,Black Kyurem,Blast Burn,Blastoise,Blaze Kick,Blaziken,Blipbug,Blissey,Blitzle,Blossomly,Blue Flute,Blue Meteorite,Blue Orb,Bluk Berry,Bold,Boldore,Boltund,Bonemerang,Bonsly,Bouffalant,Bounsweet,Braixen,Brave Bird,Braviary,Breloom,Bright Beach,Brionne,Brock,Bronzong,Bronzor,Brown Sack,Bruxish,Bubble,Bubble Beam,Budew,Bug Gem,Bugsy,Buizel,Bulbasaur,Buneary,Bunnelby,Buried Relic,Burn Drive,Burn Heal,Buttercream,Butterfree,Buzzwole,Cacnea,Cacophony,Cacturne,Calcium,Camerupt,Candaria,Candy,Candy Belly,Capture Rate,Carbink,Carbos,Carkol,Carnivine,Carracosta,Carvanha,Cascoon,Casteliacone,Castform,Castform Cast,Catch,Catch Rate,Catercream,Caterpie,Celadon City,Celadon City Gym,Celebi,Celesteela,Centiskorch,Cerulean City,Cerulean Gym,Champion,Champion Alder,Champion Cynthia,Champion Diantha,Champion Steven,Champion Wallace,Chandelure,Chansey,Charizard,Charjabug,Charmander,Charmeleon,Charti Berry,Chatot,Chatquiz,Chef,Cheri Berry,Cherrim,Cherubi,Chesnaught,Chespin,Chesto Berry,Chewtle,Chikorita,Chilan Berry,Chill Drive,Chimchar,Chimecho,Chinchou,Chingling,Chocoluv,Chople Berry,Cilan,Cinccino,Cinderace,Clair,Clamperl,Clauncher,Claw Fossil,Clawfa,Clawfairy,Clawitzer,Claydol,Clefable,Clefairy,Cleffa,Clicklist,Clobbopus,Cloyster,Coalossal,Coba Berry,Cobalion,Cocktaillon,Cofagrigus,Coinflip,Colbur Berry,Cold Castform,Combee,Combowsken,Combusken,Comfey,Community,Concentration,Conkeldurr,Constrict,Contest,Contrary,Coocoot,Cornn Berry,Corphish,Corsola,Corviknight,Corvisquire,Cosmoem,Cosmog,Cosmoneon,Cosplay Pikachu,Cottonblu,Cottonee,Cover Fossil,Crabhammer,Crabominable,Crabrawler,Cradily,Cramorant,Cranidos,Crawdaunt,Cresselia,Croagunk,Crobat,Croconaw,Crustle,Cryogonal,Crystal Aggron,Crystal Aron,Crystal Crossing,Crystal Lairon,Cubchoo,Cubone,Cuddlithe,Current Weather,Curse,Cursed Rapidash,Cursola,Custap Berry,Cutiefly,Cyndaquil,Cynthia,Daily Reward,Dark Castform,Dark Gem,Dark Orb,Dark Ponyta,Darkrai,Darmanitan,Dartrix,Darumaka,Database,Dawn Stone,Day Care,Daycare,Daycare Man,Daycare Owner,Dazzling Gleam,Decidueye,Dedenne,Deep Sea Scale,Deep Sea Tooth,Deepseascale,Deepseatooth,Defense,Deino,Delcatty,Delibird,Delivery,Delphox,Deoxys,Derpatung,Desolate Land,Dewgong,Dewott,Dewpider,Dex Rotom,Dhelmise,Dialga,Diancie,Diggersby,Diglett,Dire Hit,Dirndltank,Discharge,Discount Coupon,Disguised Exeggcute,Distortion World,Ditto,Dodrio,Doduo,Dome Fossil,Donphan,Doom Desire,Dottler,Doublade,Double Slap,Douse Drive,Dowsing Machine,Dowsing Mchn,Dr Crazee,Dr Honch,Draco Meteor,Draco Plate,Dragalge,Dragon,Dragon Ascent,Dragon Dance,Dragon Gem,Dragon Rage,Dragon Rush,Dragon Scale,Dragon Type,Dragonair,Dragonite,Draining Kiss,Dralucha,Drampa,Drapion,Dratini,Dread Plate,Dream Ball,Dream Point,Dream World,Dream World Shop,Drednaw,Drenched Bluff,Drifblim,Driflamp,Drifloon,Drilbur,Drill Rotom,Drizzile,Drowzee,Druddigon,Dubious Disc,Dubwool,Ducklett,Dugtrio,Dungeon,Dunsparce,Duosion,Durant,Durin Berry,Dusclops,Dusk Stone,Dusknoir,Duskull,Dustox,Dwebble,Earth Plate,Earthquake,Easter Buneary,Easter Bunnelby,Easter Diggersby,Easter Egg,Easter Egg Hunt,Easter Eggs,Easter Event,Easter Hunt,Easter Lopunny,Easter Slaking,Easter Slakoth,Easter Swanna,Eclipseon,Eclipsode,Eelektrik,Eelektross,Eevee,Egg Group,Egg Hunt,Egg Radar,Egg Radar Chip,Egg Storage,Eggdex,Eiscue,Ekans,Eldegoss,Electabuzz,Electirizer,Electivire,Electric,Electric Gem,Electrike,Electrode,Elekid,Element,Elgyem,Elite Four,Elite Four Drake,Elite Four Glacia,Elite Four Phoebe,Ember,Emboar,Emera,Emera Bank,Emera Beach,Emera Mall,Emera Square,Emera Town,Emerald,Emolga,Empoleon,Endless Path,Enigma Berry,Enigma Pearl,Enigma Stone,Entei,Eon Ticket,Escavalier,Espeon,Espurr,Eternal Tower,Ether,Event,Event Distribution,Event Egg,Event Pass,Event Pokemon,Event Shop,Ever Grande City,Everstone,Eviolite,Evolution,Excadrill,Exeggcute,Exeggutor,Exp Share,Explorer Bag,Explorer Kit,Exploud,Fainted,Fairy,Fairy Gem,Falinks,Fan Rotom,Fashion Case,Fearow,Feebas,Fennekin,Feraligatr,Ferrerocoal,Ferroseed,Ferrothorn,Festival Gardevoir,Festival Ralts,Fiery Furnace,Fiesta Larvesta,Fiesta Volcarona,Fighting Gem,Figy Berry,Finneon,Fiore,Fire Blast,Fire Fang,Fire Gem,Fire Punch,Fire Stone,Fire Type,Fishing,Fist Plate,Flaaffy,Flame Orb,Flame Plate,Flame Thrower,Flame Wheel,Flamethrower,Flapple,Flare,Flare Blitz,Flareon,Flash,Flash Fire,Fletchinder,Fletchling,Floatzel,Flower Boy,Flower Girl,Flygon,Flying,Flying Gem,Foggy Castform,Fomantis,Foongus,Forretress,Forum,Forum Thread,Fossil,Fraxure,Frenzy Plant,Friendship,Frillish,Froakie,Frogadier,Froslass,Frosmoth,Frost Rotom,Frosty Kecleon,Frozen,Frustration,Full Potion,Furfrou,Furret,Fury Cutter,Fury Swipes,Gabite,Galar,Gallade,Galvantula,Gambling,Game Center,Game Chip,Game Chips,Game Freak,Gameboy,Gameboy Advance,Gamecenter,Gametime,Gaming,Ganlon Berry,Garbodor,Garchomp,Gardevoir,Gary Oak,Gastly,Gem Cauldron,Gem Collector,Gem Exchange,Gemcauldron,Gemexchange,Generation,Genesect,Gengar,Geodude,Geomancy,Ghetsis,Ghost,Ghost Gem,Gible,Giga Appletun,Giga Blastoise,Giga Charizard,Giga Coalossal,Giga Drednaw,Giga Eevee,Giga Flapple,Giga Garbodor,Giga Gengar,Giga Hatterene,Giga Impact,Giga Kingler,Giga Lapras,Giga Machamp,Giga Melmetal,Giga Meowth,Giga Orbeetle,Giga Pikachu,Giga Snorlax,Giga Venusaur,Gigalith,Gingergoat,Girafarig,Giratina,Giratina Quest,Glaceon,Glaciate,Glacier Palace,Glalie,Glameow,Gligar,Gliscor,Glitch,Glitch City,Global Trade Station,Gloom,Gloweon,Gogoat,Golbat,Goldeen,Golden Game Chip,Golden Game Chips,Golden Pokeball,Golden Slot,Golduck,Golem,Golett,Golisopod,Golurk,Gomaseel,Goodra,Goomy,Gooseboarder,Gorebyss,Gossifleur,Gothita,Gothitelle,Gothorita,Gourgeist,Gracidea,Gracidea Flower,Granbull,Grapploct,Grass,Grass Gem,Graveler,Great Ball,Greedent,Green Orb,Greninja,Grepa Berry,Grimer,Grimmsnarl,Griseous Orb,Grookey,Groomicott,Grotle,Groudon,Ground,Ground Gem,Grovyle,Growl,Growlithe,Grubbin,Grumpig,Gulpin,Gumshoos,Gurdurr,Gusty Castform,Guzzlord,Gyarados,Gym Badge,Haban Berry,Hakamo O,Halloween Sweets,Hangman,Happiny,Harden,Hariyama,Harvest,Harvest Sprite,Hashtag,Hatch,Hatenna,Hatterene,Hattrem,Haunter,Hawlucha,Haxorus,Hazy Pass,Heal Order,Heart Scale,Heartomb,Heat Castform,Heat Rotom,Heatmor,Heatran,Heliolisk,Helioptile,Helix Fossil,Helper,Helping Hand,Heracross,Herdier,Herochat,Herowalker,Hidden Ability,Hidden Power,Higher Or Lower,Hippopotain,Hippopotas,Hippowdon,Hippowtain,Hitmonchan,Hitmonlee,Hitmontop,Hoenn,Hoenn Certificate,Hoggy,Honchkrow,Hondew Berry,Honedge,Honey,Honey Jar,Honey Tree,Honeycomb,Honeycombs,Honeytree,Hoothoot,Hoppip,Horsea,Houndoom,Houndour,Huntail,Hydreigon,Hydro Cannon,Hydro Pump,Hyper Beam,Iapapa Berry,Ice Beam,Ice Cream Cornet,Ice Gem,Ice Heal,Ice Punch,Ice Shard,Icicle Plate,Igglybath,Igglybuff,Ikkakugong,Illumise,Illusion,Impasta,Impidimp,Impish,Incineroar,Indigo League,Infernape,Inkay,Insect Plate,Inteleon,Interact,Interaction,Interactions,Iron Defense,Iron Plate,Iron Tail,Item Bag,Item Delivery,Item Shop,Ivysaur,Jaboca Berry,Jade Orb,James,Jangmo O,Jaw Fossil,Jellicent,Jesterig,Jigglybath,Jigglypuff,Jirachi,Johto,Johto Certificate,Jolly Jr,Jolteon,Joltik,Judgement,Jumpluff,Juniper,Jynx,Kabuto,Kabutops,Kadabra,Kakuna,Kalos,Kalos Certificate,Kangaskhan,Kanto,Kanto Certificate,Kanto League,Karrablast,Kartana,Kasib Berry,Kebia Berry,Kecleon,Kee Berry,Keggleon,Keldeo,Kelpsy Berry,Ketchum,Key Stone,Kinesis,Kingdra,Kingler,Kirlia,Klang,Klefki,Kleopard,Klink,Klinklang,Knight Axew,Koffing,Komala,Kommo O,Krabby,Kricketot,Kricketune,Krokorok,Krookodile,Kyogre,Kyurem,Lairon,Lake Trio,Lake Valor,Lampent,Lance,Landorus,Lansat Berry,Lanturn,Lapras,Large Candy Bag,Larvesta,Larviprop,Larvitar,Latias,Latiasite,Latios,Lava Cookie,Lavender Town,Leaf Stone,Leafeon,Leavanny,Ledian,Ledyba,Leech Life,Leftovers,Legend,Legendary,Legendary Dogs,Lemonade,Leppa Berry,Lepreowth,Level,Lickilicky,Lickitung,Liechi Berry,Liepard,Light Ball,Light Rock,Light Screen,Light Stone,Lightblim,Lightstone Cave,Lileep,Lillibride,Lilligant,Lillipup,Link Cable,Linoone,Litleo,Litten,Littleroot Town,Litwick,Lombre,Lopunny,Lord Salamance,Lord Salamence,Los Seashellos,Lotad,Lottery,Loudred,Lovemeter,Lucario,Lucario Sensei,Lucarionite,Ludicolo,Lugia,Lum Berry,Lumiday,Lumineon,Lunala,Lunar Wing,Lunatone,Lurantis,Luvdisc,Luxio,Luxray,Mach Bike,Machamp,Machine Part,Machoke,Machop,Machotide,Magcargo,Magical Leaf,Magikarp,Magmar,Magmarizer,Magmortar,Magnemite,Magneton,Magnezone,Mago Berry,Magost Berry,Makuhita,Malamar,Mamoswine,Manaphy,Mandibuzz,Manectric,Maneki Espurr,Mankey,Mantine,Mantyke,Maractus,Maranga Berry,Mareanie,Mareep,Marill,Marine Cave,Marowak,Marshadow,Marshtomp,Masquerain,Master,Master Ball,Masuda,Mawile,Max Repel,Meadow Plate,Medal Rally,Medicham,Meditite,Mega Able,Mega Aggron,Mega Alakazam,Mega Ampharos,Mega Audino,Mega Banette,Mega Beedrill,Mega Blastoise,Mega Braviary,Mega Camerupt,Mega Charizard,Mega Claydol,Mega Crobat,Mega Diancie,Mega Dunsparce,Mega Easter Lopunny,Mega Evolution,Mega Flygon,Mega Froslass,Mega Gallade,Mega Garchomp,Mega Gardevoir,Mega Gengar,Mega Giratina,Mega Glalie,Mega Gyarados,Mega Lopunny,Mega Luxray,Mega Manectric,Mega Mawile,Mega Medicham,Mega Meganium,Mega Mewtwo,Mega Mewtwo X,Mega Milotic,Mega Pidgeot,Mega Pinsir,Mega Pokemon,Mega Rapidash,Mega Rayquaza,Mega Ring,Mega Sableye,Mega Salamence,Mega Sceptile,Mega Scizor,Mega Sharpedo,Mega Skarmory,Mega Steelix,Mega Stone,Mega Swampert,Mega Tyranitar,Mega Venusaur,Mega Yorebro,Meganium,Melmetal,Meloetta,Meltan,Meltan Candy,Meowstic,Meowth,Mesprit,Metacream,Metagross,Metal Coat,Metang,Metapod,Meteorite Castform,Metronome,Mew,Mewton M Meowth,Mewtwo,Mewtwonite Y,Micle Berry,Mienfoo,Mienshao,Mightyena,Mikofoo,Mikoshao,Milker,Milotic,Miltank,Mime Jr,Mimic,Mimikyu,Minccino,Mind Plate,Minun,Misc Settings,Misdreavus,Misdreavus Cosplay,Mismagius,Missingno,Mission,Misty,Mixer Rotom,Moderators,Moltres,Monferno,Monitor Rotom,Moomoo Milk,Moomoo Ranch,Moon Stone,Morelull,Morgrem,Mossdeep City,Mossy Forest,Mothim,Mouse,Mow Rotom,Mr Bagon,Mr Mime,Mr Moody,Mt Moon,Mt Silver,Mudbray,Mudkip,Mudsdale,Muggy,Muggy Castform,Muk,Munchlax,Munna,Murkrow,Musharna,Mushroom,Mysterious Tree,Mystery Box,Mystery Dungeon,Mystery Egg,Mystery Key,Naganadel,Nanab Berry,Nappy,Narichu,Naruchu,Natu,Nature,Nessy,New Bark Town,Nickit,Nidoking,Nidoqueen,Nidorina,Nidorino,Night Slash,Nightmare Munna,Nihilego,Nincada,Ninetales,Ninjask,Nintendo,Nintendo Ds,Nocnoc,Noctowl,Noibat,Noivern,Nomel Berry,Normal,Normal Gem,Nosepass,Nosepharos,Notification,Notification Wall,Nugget,Numel,Nurse Joy,Nuvema Town,Nuzleaf,Oblivion Wing,Obstagoon,Occa Berry,Octazooka,Octillery,Odd Incense,Oddish,Officer Jenny,Old Amber,Old Amber Fossil,Omanyte,Omastar,Omega,Omega Ruby,Ominous Wind,Onix,Oran Berry,Orange Islands,Oranguru,Orbeetle,Oshawott,Oval Stone,Overheat,Pachirisnow,Pachirisu,Pal Pad,Palkia,Pallet Town,Palossand,Palpad,Palpitoad,Pamtre Berry,Pancham,Pangoro,Panpour,Pansage,Pansear,Paralysis,Paralyze Heal,Paralyzed,Paras,Parasect,Party,Pass Orb,Passho Berry,Passimian,Patrat,Pawniard,Payapa Berry,Pearl,Pecha Berry,Pelipper,Perchaun,Permanent Ban,Perrserker,Persian,Persim Berry,Petal Dance,Petaya Berry,Petilil,Phanpy,Phantump,Pharraloin,Pheromosa,Phione,Pichu,Pickup,Pidgeot,Pidgeotto,Pidgey,Pidove,Pignite,Pika Pika,Pikachu,Pikipek,Piloswine,Pinap Berry,Pineco,Pinsir,Piplup,Pixie Plate,Plaguekrow,Playground,Plume Fossil,Plushie,Plusle,Pocket Monsters,Poipole,Poison,Poison Gem,Poke Ball,Pokeball,Pokeblock,Pokedex,Pokedollar,Pokegear,Pokehero,Pokeheroes,Pokeheroes Wiki,Pokemon,Pokemon Amie,Pokemon League,Pokemon Master,Pokemon Movie,Pokemon Ranger,Pokeradar,Pokeradar Chain,Pokerus,Pokewalker,Pokeworld,Polestar,Politoed,Poliwag,Poliwhirl,Poliwrath,Poll Manager,Pomeg Berry,Ponyta,Poochyena,Popplio,Porygon,Potion,Power Anklet,Power Band,Power Belt,Power Bracer,Power Lens,Power Weight,Primal,Primal Groudon,Primal Kyogre,Primal Reversion,Primarina,Primeape,Primordial Sea,Princess Smoochum,Prinplup,Prism Scale,Prison Bottle,Privacy Policy,Private Message,Prize Exchange,Pro Path,Probolight,Probopass,Prof Birch,Prof Madno,Prof Rowan,Prof Rowans Lab,Professor,Professor Birch,Professor Oak,Professor Rowan,Protector,Protein,Psychic,Psychic Gem,Psyduck,Pumpkaboo,Pumple,Pupibot,Pupitar,Purrloin,Purugly,Puzzle,Puzzle Collection,Pyroar,Pyukumuku,Quagschnee,Quagsire,Qualot Berry,Queen Jynx,Quest,Quick Attack,Quick Ball,Quilava,Quilladin,Qwilfish,Raboot,Rabuta Berry,Radio Tower,Raffle,Raichu,Raikou,Rain Badge,Rain Dance,Rainbow Castform,Rainbow Wing,Rainy Castform,Raitoshi,Raizumaki,Ralts,Rambo Rumble,Rampardos,Ranklist,Rapidash,Rare Bone,Rare Candy,Rarity,Raticate,Rattata,Rawst Berry,Raylong,Rayquaza,Razor Claw,Razor Fang,Razor Leaf,Razz Berry,Reaper Cloth,Red Lunar Wing,Red Meteorite,Red Orb,Regice,Regigigas,Regirock,Registeel,Relic Band,Relic Copper,Relic Crown,Relic Gold,Relic Silver,Relic Statue,Relic Vase,Relicanth,Remakes,Remoraid,Rescue,Reshiram,Resolute Stone,Retro,Retro Starters,Reuniclus,Revive,Rhydon,Rhyhorn,Rhyperior,Ribombee,Rillaboom,Rindo Berry,Riolu,Rival,Roar Of Time,Robin Blaze,Rock Blast,Rock Gem,Rockruff,Rocky Cave,Rodeo Scraggy,Roggenrola,Rokkyu,Roleplay,Rolycoly,Rookidee,Root Fossil,Roseli Berry,Roselia,Roserade,Rotom,Round,Route,Rowan,Rowap Berry,Royal,Royal Tunnel,Ruby Valley,Rudolph,Rufflet,Rules,Rumble,Rumble Area,Rumble Mission,Rumble Missions,Rumbling,Run Away,Rusted Shield,Rusted Sword,Sableye,Sachet,Sacred Ash,Sad Jr,Safari,Safari Ball,Safari Zone,Sail Fossil,Sala Da Menci,Salac Berry,Salamence,Salandit,Salazzle,Salon,Samurott,Sandaconda,Sandcrustle,Sandile,Sandshrew,Sandslash,Sandstorm,Sandwebble,Sandygast,Santa Birb,Santa Bird,Sapphire,Satochu,Sawk,Scanner,Scary Glasses,Scatterbug,Scattercube,Sceptile,Scizor,Scolipede,Scope Lens,Scorbunny,Scrafty,Scraggy,Scyther,Seadra,Seaking,Sealeo,Seatran,Secret Base,Seed Bomb,Seedot,Seel,Seismitoad,Seller Clothes,Selunar,Sentret,Serena,Serperior,Servine,Settings,Seviper,Sewaddle,Shadow Lugia,Shadow Mewtwo,Sharpedo,Shaymin,Shaysola,Shedinja,Shelgon,Shell Bell,Shellder,Shelmet,Shieldon,Shiftry,Shiinotic,Shinies,Shinx,Shiny,Shiny Chaining,Shiny Charm,Shiny Ditto,Shiny Hunt,Shiny Sprite,Shiny Stone,Shipping,Shoal Shell,Shock Drive,Shroomish,Shuca Berry,Shuckle,Shuppet,Sigilyph,Silcoon,Silent Forest,Silicobra,Silph Co,Silvally,Silver Wing,Simipour,Simisage,Simisear,Sinnoh,Sinnoh Certificate,Sir Haxelot,Sir Shelgon,Sitrus Berry,Sizzlipede,Skarmory,Skiddo,Skiploom,Skitty,Skorupi,Skrelp,Skugar,Skull Fossil,Skuntank,Skwovet,Sky Pillar,Sky Plate,Sky Uppercut,Slaking,Slakoth,Sliggoo,Slow Start,Slowbro,Slowking,Slowpoke,Slowpoketail,Slowyore,Slugma,Slurpuff,Small Nugget,Smeargle,Smog Castform,Smoochum,Sneasel,Snivy,Snom,Snorlax,Snorunt,Snover,Snowbuck,Snowling,Snowy Castform,Snowy Mountains,Snubbull,Sobble,Soda Pop,Solar Beam,Solastra,Solgaleo,Solgilyph,Solorb,Solosis,Solrock,Soothe Bell,Space Spinda,Spear Pillar,Spearow,Speed Click,Spelon Berry,Spewbrella,Spewpa,Spheal,Spinarak,Spinda,Spiritomb,Splash Plate,Spoink,Spooky Manor,Spooky Plate,Spore,Spray Duck,Sprayduck,Spring Ampharos,Spring Flaaffy,Spring Mareep,Spring Update,Sprite,Spriter,Spritzee,Sproutlett,Sproutrio,Squirtle,Ss Anne,Ss Aqua,Ss Tidal,Staff,Staid,Stakataka,Stantler,Star Piece,Staraptor,Staravia,Stardust,Starf Berry,Starly,Starmie,Starter,Starters,Staryu,Steam Eruption,Steamo,Steel Gem,Steelix,Steenee,Steven,Steven Stone,Stone Plate,Stoutland,Strength,String Shot,Strong Earthquakes,Struggle,Stufful,Stunfisk,Stunky,Sudowoodo,Sugar Shock,Suggest A Word,Suicune,Summer Ampharos,Summer Flaaffy,Summer Mareep,Summon,Sun Stone,Sunflora,Sunkern,Sunny Castform,Super Breloomio,Super Honey,Super Rod,Super Shroom,Super Training,Surfer Machop,Surfing Pikachu,Surskit,Swablu,Swadloon,Swagger,Swalot,Swampert,Swampras,Swanna,Sweet Heart,Swellow,Swelluhodo,Swift,Swinub,Swirlix,Swoobat,Swords Dance,Sylveon,Synchronize,Tackle,Tail Whip,Taillow,Tailluchi,Tall Grass,Talonflame,Tamato Berry,Tanga Berry,Tangela,Tanghetti,Tangrowth,Tapu Bulu,Tapu Fini,Tapu Koko,Tapu Lele,Tauros,Team Aqua,Team Flare,Team Magma,Team Plasma,Team Rocket,Technical Machine,Teddiursa,Telepathy,Tendenne,Tentacool,Tentacruel,Tepig,Terra Cave,Terrakion,Teslagon,Thievul,Throh,Thunder Punch,Thunderbolt,Thundershock,Thunderstone,Thunderstorm,Thundurus,Thwackey,Timburr,Timid,Tiny Mushroom,Tinymushroom,Tirtouga,Togedemaru,Togekiss,Togepi,Togetic,Tom Nook,Toraros,Torcharch,Torchic,Torkoal,Tornadus,Torracat,Torterra,Totodile,Toucannon,Toxapex,Toxel,Toxic,Toxic Orb,Toxic Plate,Toxicroak,Trade,Trading,Trainer,Trainer Red,Trainerlevel,Trainerpoint,Trainerpoints,Training,Tranquill,Trapinch,Treasure,Treasure Hunt,Treecko,Trevenant,Tropius,Truant,Trubbish,Trumbeak,Tsareena,Tunnel,Turtonator,Turtwig,Twinleaf Town,Tympole,Tynamo,Type Null,Types,Typhlosion,Tyranitar,Tyrantrum,Tyrogue,Tyrunt,Ultra Ball,Ultra Beast,Umbreon,Undiscovered,Unfezant,Union Cave,Union Room,Unova,Unova Certificate,Unown,Unown Flake,Uproar,Ursaring,Userlist,Username,Users,Uxie,Valenfloon,Valentine,Van Bagon,Vanillish,Vanillite,Vanilluxe,Vaniville Town,Vaporeon,Venipede,Venomoth,Venonat,Venoshock,Venusaur,Vespiquen,Vibrava,Victini,Victreebel,Vigoroth,Vikavolt,Vileplume,Vine Whip,Viridian City,Virizion,Vitamin,Vivillon,Volbeat,Volcarona,Volkner,Volt Absorb,Volt Switch,Volt Tackle,Voltorb,Vs Seeker,Vullaby,Vulpix,Wacan Berry,Wailmer,Wailmer Pail,Wailord,Wally,Walrein,Wartortle,Wash Rotom,Watchog,Water,Water Gem,Water Gun,Water Stone,Watmel Berry,Weather,Weather Balloon,Weather Channel,Weather Forecast,Weavile,Weedle,Weepinbell,Weezing,Wepear Berry,Whimsicott,Whipped Dream,Whirlipede,Whiscash,Whismur,White Hand,White Kyurem,Wide Lens,Wigglybath,Wigglytuff,Wiki Berry,Wimpod,Windy Castform,Windy Prairie,Wingull,Winter Camerupt,Winter Numel,Wishiwashi,Witch Vulpix,Wobbuffet,Wonder Guard,Wonder Trade,Wonder Trade Station,Woobat,Wood Hammer,Wooloo,Wooper,Woopice,Wreafki,Wurmple,Wynaut,X Attack,X Defense,X Speed,Xatu,Xerneas,Xurkitree,Yache Berry,Yamask,Yamper,Yanma,Yanmega,Yellow Forest,Yellow Meteorite,Yorebro,Yoreking,Yungoos,Yveltal,Zacian,Zamazenta,Zangoose,Zap Cannon,Zap Plate,Zapdos,Zebstrika,Zekrom,Zenith Marshadow,Zeraora,Zero Isle,Zigzagoon,Zombeagle,Zomppet,Zoroark,Zorua,Zubat,Zweilous,Zweipunk,Zygarde,Archeops,Gem Collector";
        const possibleAnswers = wordListStr.split(',').filter(word => reg.test(word));
        const freq = {}; let maxLetter = null; let maxCount = 0;
        possibleAnswers.forEach(word => {
            for (const char of word.toUpperCase()) {
                if (char >= 'A' && char <= 'Z' && !currentHangman.includes(char) && !guessedLetters.toUpperCase().includes(char)) {
                    freq[char] = (freq[char] || 0) + 1;
                    if (freq[char] > maxCount) { maxCount = freq[char]; maxLetter = char; }
                }
            }
        });
        if (maxLetter) {
            const btn = Array.from(document.querySelectorAll('a.letterGuess')).find(a => a.textContent.trim() === maxLetter);
            if (btn) { setTimeout(() => btn.click(), 2500); return; }
        }
        setTimeout(() => window.location.href = "https://pokeheroes.com/gc_hangman", 3000);
    }

    // --- HoL PAYLOAD (v21 Deep Socket integrated) ---
    function payloadHoL() {
        const BET_AMOUNT = 10000;
        const SPEED_DELAY = 300; 

        let isRunning = false;
        let isActiveCheckTimer = null;
        let gameLoopTimer = null;
        const parser = new DOMParser();

        function log(msg) {
             try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: msg }, '*'); } catch(e){}
        }

        // Check toggle state from localstorage frequently
        isActiveCheckTimer = setInterval(() => {
            const shouldRun = localStorage.getItem('PH_CC_HOL_ACTIVE') === 'true';
            if (shouldRun && !isRunning) {
                isRunning = true;
                log("Deep Socket Active");
                gameLoop("https://pokeheroes.com/gc_hol");
            } else if (!shouldRun && isRunning) {
                isRunning = false;
                log("PAUSED");
                if (gameLoopTimer) clearTimeout(gameLoopTimer);
            }
        }, 1000);

        function gameLoop(url) {
            if (!isRunning) return;

            fetch(url, {
                method: "GET",
                headers: { "Cache-Control": "no-cache" },
                credentials: "include"
            })
            .then(response => response.text())
            .then(html => {
                if (!isRunning) return;
                const doc = parser.parseFromString(html, "text/html");
                processGameState(doc);
            })
            .catch(err => {
                gameLoopTimer = setTimeout(() => gameLoop(url), 1000);
            });
        }

        function processGameState(doc) {
            // 1. Start Screen
            if (doc.querySelector('input[name="bet"]')) {
                log("New Game");
                const formData = new URLSearchParams();
                formData.append('bet', BET_AMOUNT);

                fetch("https://pokeheroes.com/gc_hol", {
                    method: "POST",
                    body: formData,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    credentials: "include"
                })
                .then(res => res.text())
                .then(html => {
                    const newDoc = parser.parseFromString(html, "text/html");
                    gameLoopTimer = setTimeout(() => processGameState(newDoc), SPEED_DELAY);
                });
                return;
            }

            // 2. Game Over
            const bodyText = doc.body.innerText;
            if (bodyText.includes("Try again") || bodyText.includes("Play again")) {
                log("Lost. Restarting...");
                gameLoopTimer = setTimeout(() => gameLoop("https://pokeheroes.com/gc_hol"), SPEED_DELAY);
                return;
            }

            // 3. Playing
            const numSpan = doc.querySelector('span[style*="3em"]');
            if (numSpan) {
                const num = parseInt(numSpan.innerText.trim());
                let move = num <= 5 ? "higher" : "lower";
                if (num === 5) move = "higher"; 
                if (num === 6) move = "lower";

                log(`Num: ${num} -> ${move.toUpperCase()}`);

                const link = doc.querySelector(`a[href*="guess=${move}"]`);
                let nextUrl = `https://pokeheroes.com/gc_hol?guess=${move}`;
                if (link) nextUrl = link.href;

                gameLoopTimer = setTimeout(() => gameLoop(nextUrl), SPEED_DELAY);
            } else {
                gameLoopTimer = setTimeout(() => gameLoop("https://pokeheroes.com/gc_hol"), 1000);
            }
        }
    }

    function payloadConcentration() {
        try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'Matching...' }, '*'); } catch(e){}
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.get('d') || parseInt(urlParams.get('d'), 10) !== 2) { window.location.href = 'https://pokeheroes.com/gc_concentration?d=2'; return; }
        let deck = Array.from({length: 36}, (_, i) => i); deck.sort(() => Math.random() - 0.5); let memory = {}; 
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        let ui = document.createElement("div");
        ui.style.cssText = "position:fixed; top:5px; right:5px; width:150px; background:rgba(0,0,0,0.9); color:#fff; z-index:999999; padding:5px; font-family:Arial; border: 1px solid #4CAF50; zoom:0.8;";
        ui.innerHTML = `<div style="display:grid; grid-template-columns: repeat(6, 1fr); gap: 2px;" id="ph-grid"></div>`;
        document.body.appendChild(ui);
        let grid = document.getElementById("ph-grid");
        for(let i = 0; i < 36; i++) {
            let cell = document.createElement("div"); cell.id = "ph-cell-" + i; cell.style.cssText = "aspect-ratio:1; background:#333; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:bold;"; cell.innerText = "?"; grid.appendChild(cell);
        }
        function updateCell(idx, txt, color) { let c = document.getElementById("ph-cell-" + idx); if(c){ c.innerText=txt; c.style.background=color; } }
        async function safeFlipCard(index) {
            for(let attempts=0; attempts<3; attempts++) {
                try {
                    const response = await fetch("includes/ajax/game_center/concentration_flip.php", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `card=${index}` });
                    const text = await response.text(); if (text.trim() === "") return { pkmnId: null };
                    const container = document.createElement("div"); container.innerHTML = text;
                    const pkdxnr = container.querySelector(".pkdxnr"); if (pkdxnr) return { pkmnId: parseInt(pkdxnr.textContent.trim(), 10) };
                } catch (e) {} await sleep(800);
            } return { pkmnId: null };
        }
        async function playGame() {
            await sleep(1000); 
            while (deck.length > 0 || Object.keys(memory).some(k => memory[k].length === 2)) {
                let pairPkmn = Object.keys(memory).find(k => memory[k].length === 2);
                if (pairPkmn) {
                    let idx1 = memory[pairPkmn][0], idx2 = memory[pairPkmn][1];
                    updateCell(idx1, pairPkmn, "#ff9800"); let res1 = await safeFlipCard(idx1); await sleep(250); 
                    updateCell(idx2, pairPkmn, "#ff9800"); let res2 = await safeFlipCard(idx2); delete memory[pairPkmn];
                    if (res1.pkmnId !== null) updateCell(idx1, "✔", "#4CAF50"); if (res2.pkmnId !== null) updateCell(idx2, "✔", "#4CAF50");
                    await sleep(300); continue; 
                }
                let pk1 = null, idx1 = -1;
                while (deck.length > 0) { idx1 = deck.pop(); let res1 = await safeFlipCard(idx1); if (res1.pkmnId !== null) { pk1 = res1.pkmnId; break; } else { updateCell(idx1, "", "#111"); } }
                if (pk1 === null) break; 
                updateCell(idx1, pk1, "#ff9800"); if (!memory[pk1]) memory[pk1] = []; if (!memory[pk1].includes(idx1)) memory[pk1].push(idx1); await sleep(250);
                if (memory[pk1].length === 2) {
                    let idx2 = memory[pk1].find(i => i !== idx1); updateCell(idx2, pk1, "#ff9800"); await safeFlipCard(idx2); delete memory[pk1]; updateCell(idx1, "✔", "#4CAF50"); updateCell(idx2, "✔", "#4CAF50"); await sleep(300); continue; 
                }
                let pk2 = null, idx2 = -1;
                while (deck.length > 0) { idx2 = deck.pop(); let res2 = await safeFlipCard(idx2); if (res2.pkmnId !== null) { pk2 = res2.pkmnId; break; } else { updateCell(idx2, "", "#111"); } }
                if (pk2 === null) break;
                updateCell(idx2, pk2, "#ff9800"); if (!memory[pk2]) memory[pk2] = []; if (!memory[pk2].includes(idx2)) memory[pk2].push(idx2);
                if (pk1 === pk2) { delete memory[pk1]; updateCell(idx1, "✔", "#4CAF50"); updateCell(idx2, "✔", "#4CAF50"); } else { updateCell(idx1, pk1, "#555"); updateCell(idx2, pk2, "#555"); }
                await sleep(300); 
            }
            await sleep(2000); window.location.href = `https://pokeheroes.com/gc_concentration?d=2`;
        }
        playGame();
    }

    function payloadFish() {
        window.addEventListener('message', function(event) { if (event.data && event.data.type === 'FISH_CATCH') { const btn = document.getElementById('catchafish_minimal_reload'); if (btn) btn.click(); } });
        setInterval(() => { try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'Ready to Fish' }, '*'); } catch(e){} }, 5000);
        (function() { 
            const RELOAD_INTERVAL_MS = 5 * 60 * 1000; const INIT_DELAY_MS = 1500; var fishingTimerId = null; 
            function originalCatchAFishLogic() {
                window.isCatchOnRod = true;
                if (typeof window.getFishingEnergy === 'function' && typeof window.MIN_REQ_ENERGY !== 'undefined') {
                     if (window.getFishingEnergy() > window.MIN_REQ_ENERGY) {
                         try { if (typeof window.pullRodBack === 'function') { window.pullRodBack(false); } setTimeout(function(){ try { if (typeof window.catchFish === 'function') { window.catchFish(); } } catch(eInner) {} }, 200); } catch (eOuter) {}
                     } 
                } else { try { if(typeof window.pullRodBack === 'function') window.pullRodBack(false); setTimeout(function(){ if(typeof window.catchFish === 'function') window.catchFish(); }, 200); } catch (e) {} }
            }
            function executeFishingSequence() {
                 const castButton = document.querySelector(".throwRodButton");
                 if (castButton && castButton.style.display !== 'none') { try { if (typeof window.throwRod === 'function') { window.throwRod(); } else { castButton.click(); } setTimeout(originalCatchAFishLogic, 300); } catch (e) { } } 
                 else { originalCatchAFishLogic(); }
            }
            function startCatchMany() { 
                if (fishingTimerId === null) {
                     fishingTimerId = setInterval(executeFishingSequence, 420);
                     document.getElementById('catchmanyfish_minimal_reload').disabled = true; document.getElementById('stopfishing_minimal_reload').disabled = false; document.getElementById('catchafish_minimal_reload').disabled = true; stopPageReloadTimer();
                }
            }
            function stopCatchMany() { 
                if (fishingTimerId !== null) {
                     clearInterval(fishingTimerId); fishingTimerId = null;
                     document.getElementById('catchmanyfish_minimal_reload').disabled = false; document.getElementById('stopfishing_minimal_reload').disabled = true; document.getElementById('catchafish_minimal_reload').disabled = false; schedulePageReload(); 
                }
            }
            var pageReloadTimerId = null; 
            function schedulePageReload() { stopPageReloadTimer(); pageReloadTimerId = setTimeout(function() { location.reload(); }, RELOAD_INTERVAL_MS); }
            function stopPageReloadTimer() { if (pageReloadTimerId !== null) { clearTimeout(pageReloadTimerId); pageReloadTimerId = null; } }
            function initialCatchAndStartReloadTimer() { executeFishingSequence(); schedulePageReload(); }
            function initScript() {
                setTimeout(function() {
                    try {
                        var fishingDiv = document.getElementById("rodinterface");
                        if (fishingDiv && !document.getElementById('catchafish_minimal_reload')) {
                            fishingDiv.insertAdjacentHTML("afterend", `<div style="text-align: center; margin-top: 10px;"><button id='catchafish_minimal_reload' class='button' style='padding:5px; margin:2px;'>Catch a fish</button><button id='catchmanyfish_minimal_reload' class='button' style='padding:5px; margin:2px;'>Catch every fish</button><button id='stopfishing_minimal_reload' class='button' style='padding:5px; margin:2px;' disabled>Stop fishing</button></div>`);
                            document.getElementById('catchafish_minimal_reload').addEventListener("click", executeFishingSequence); document.getElementById('catchmanyfish_minimal_reload').addEventListener("click", startCatchMany); document.getElementById('stopfishing_minimal_reload').addEventListener("click", stopCatchMany);
                            initialCatchAndStartReloadTimer();
                        }
                    } catch (e) { }
                }, INIT_DELAY_MS);
            }
            initScript();
        })();
    }

    function payloadRoyalTunnel() {
        let isRunning = localStorage.getItem("RT_AutoRun") === "true";
        setInterval(() => {
            isRunning = localStorage.getItem("RT_AutoRun") === "true";
            try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: isRunning ? 'Auto-Nav ON' : 'PAUSED' }, '*'); } catch(e){}
        }, 2000);

        (function() {
            const DB_KEY = "RoyalTunnel_DB_V17", URL_KEY = "RoyalTunnel_Gist_URL", MAX_RETRIES = 3;
            const getCookie = (n) => { const p = `; ${document.cookie}`.split(`; ${n}=`); return p.length === 2 ? p.pop().split(';').shift() : ""; };
            let tunnelDelay = parseInt(getCookie("tunnelDelay")) || 1000;
            let tunnelBreak = getCookie("tunnelBreak") === "true";

            async function start() {
                addDebugBox(); renderStatsBox(); log("Bot V25 Initializing..."); handleLearning();
                if (handleAutoNavigation()) return; 
                const db = await loadDatabase(); if (!db) return;
                const container = document.querySelector(".royal_tunnel"); if (!container) return;
                let checks = 0;
                const checkLoad = setInterval(() => {
                    const links = container.getElementsByTagName("a"); let validImages = 0;
                    for (let i = 0; i < links.length; i++) { const img = links[i].querySelector("img"); if (img && img.src && img.src.includes(".png")) validImages++; }
                    if (validImages >= 3) {
                        clearInterval(checkLoad);
                        if (!container.dataset.processed) {
                            container.dataset.processed = "true"; sessionStorage.removeItem("RT_AutoNavIndex");
                            updateStats(container); setTimeout(() => attemptSolve(container, db, 0), 500);
                        }
                    }
                    checks++; if (checks > 100) { clearInterval(checkLoad); log("Error: Images did not load in time."); }
                }, 100);
            }

            function handleLearning() {
                const pendingStr = localStorage.getItem("RT_PendingGuess"); if (!pendingStr) return;
                const pending = JSON.parse(pendingStr); let learnedDB = JSON.parse(localStorage.getItem("RT_Learned_DB")) || { matches: {}, wrongs: {} };
                const bodyText = document.body.innerText;
                if (bodyText.includes("wrong answer") || bodyText.includes("attacked you")) {
                    if (!learnedDB.wrongs[pending.qKey]) learnedDB.wrongs[pending.qKey] = [];
                    if (!learnedDB.wrongs[pending.qKey].includes(pending.guessedId)) { learnedDB.wrongs[pending.qKey].push(pending.guessedId); } log(`🧠 Learned: ID ${pending.guessedId} is WRONG.`);
                } 
                else if (document.querySelector(".royal_tunnel") || bodyText.includes("Congratulations!")) {
                    if (pending.wasGuess) { learnedDB.matches[pending.qKey] = pending.guessedId; log(`🧠 Learned: ID ${pending.guessedId} is CORRECT! Saved.`); }
                }
                localStorage.setItem("RT_Learned_DB", JSON.stringify(learnedDB)); localStorage.removeItem("RT_PendingGuess");
            }

            function handleAutoNavigation() {
                if (!isRunning) return false;
                const bodyText = document.body.innerText;
                if (bodyText.includes("Congratulations! You reached the end of the tunnel.")) {
                    log("Tunnel Completed! Auto-continuing..."); setTimeout(() => window.location.href = "https://pokeheroes.com/royal_tunnel?cont", tunnelDelay); return true;
                }
                if (bodyText.includes("You can either take a break or continue")) {
                    log("Break Screen. Continuing..."); if (!tunnelBreak) { setTimeout(() => window.location.href = "https://pokeheroes.com/royal_tunnel?cont", tunnelDelay / 2); return true; }
                }
                if (bodyText.includes("Start exploring") || bodyText.includes("Choose the right path") || bodyText.includes("this was the wrong answer")) {
                    const paths = [
                        { name: "Endless", url: "https://pokeheroes.com/royal_tunnel?start=endless" },
                        { name: "Split-Decision", url: "https://pokeheroes.com/royal_tunnel?start=split" },
                        { name: "Pro", url: "https://pokeheroes.com/royal_tunnel?start=pro" },
                        { name: "Advanced", url: "https://pokeheroes.com/royal_tunnel?start=advanced" },
                        { name: "Beginner", url: "https://pokeheroes.com/royal_tunnel?start=beginner" }
                    ];
                    let navIndex = parseInt(sessionStorage.getItem("RT_AutoNavIndex") || "0");
                    if (navIndex >= paths.length) {
                        log("All paths failed. Out of money? Auto-Run disabled."); localStorage.setItem("RT_AutoRun", "false"); sessionStorage.removeItem("RT_AutoNavIndex");
                        setTimeout(() => window.location.href = "https://pokeheroes.com/royal_tunnel", 2000); return true;
                    }
                    const targetPath = paths[navIndex]; log(`Trying to start: ${targetPath.name}...`);
                    sessionStorage.setItem("RT_AutoNavIndex", navIndex + 1); setTimeout(() => window.location.href = targetPath.url, tunnelDelay); return true;
                } return false;
            }

            function updateStats(container) {
                let stats = JSON.parse(localStorage.getItem("RT_Stats")) || { totalRooms: 0, totalGems: 0, gems: {}, lastTrackedLevel: -1, lastGemRoomID: -1 };
                let statsUpdated = false; const questEl = document.querySelector(".royal_quest"); let currentLevel = 0;
                if (questEl) { const match = questEl.textContent.match(/Level\s*(\d+)/i); if (match) currentLevel = parseInt(match[1]); }
                if (currentLevel > 0 && currentLevel !== stats.lastTrackedLevel) { stats.totalRooms++; stats.lastTrackedLevel = currentLevel; statsUpdated = true; }
                const gemMatch = container.innerText.match(/\b1x\s+([A-Za-z]+)\s+Gem\s+found!/i);
                if (gemMatch) {
                    const gemType = gemMatch[1];
                    if (stats.lastGemRoomID !== stats.totalRooms) { stats.totalGems++; stats.gems[gemType] = (stats.gems[gemType] || 0) + 1; stats.lastGemRoomID = stats.totalRooms; statsUpdated = true; log(`🎉 ${gemType} Gem!`); }
                }
                if (statsUpdated) localStorage.setItem("RT_Stats", JSON.stringify(stats)); renderStatsBox();
            }

            function renderStatsBox() {
                let stats = JSON.parse(localStorage.getItem("RT_Stats")) || { totalRooms: 0, totalGems: 0, gems: {} }; let box = document.getElementById("rt-stats-ui");
                if (!box) {
                    document.body.insertAdjacentHTML('beforeend', `<div id="rt-stats-ui" style="position: fixed; bottom: 10px; left: 10px; width: 220px; background: rgba(20, 20, 20, 0.9); color: #fff; font-family: sans-serif; border: 2px solid #b8860b; border-radius: 6px; padding: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.5); z-index: 9999; zoom:0.8;"><div style="font-size: 14px; font-weight: bold; text-align: center; color: #ffd700; margin-bottom: 5px; border-bottom: 1px solid #555; padding-bottom: 5px;">💎 Tunnel Stats</div><div style="font-size: 12px; line-height: 1.6;"><div>🚪 <b>Total Rooms:</b> <span id="st-rooms">0</span></div><div>💎 <b>Total Gems:</b> <span id="st-gems">0</span></div><div>📊 <b>Average:</b> 1 per <span id="st-avg">0</span> rooms</div><div style="margin-top: 5px; border-top: 1px dotted #555; padding-top: 5px; max-height: 60px; overflow-y: auto; color: #ddd;" id="st-breakdown"></div></div></div>`);
                }
                document.getElementById("st-rooms").innerText = stats.totalRooms; document.getElementById("st-gems").innerText = stats.totalGems; document.getElementById("st-avg").innerText = stats.totalGems > 0 ? (stats.totalRooms / stats.totalGems).toFixed(1) : "N/A";
                if (stats.totalGems > 0) { let bdHtml = ""; for (const [type, count] of Object.entries(stats.gems)) { bdHtml += `<div>• ${type}: <b>${count}</b></div>`; } document.getElementById("st-breakdown").innerHTML = bdHtml; } else { document.getElementById("st-breakdown").innerHTML = "No gems yet."; }
            }

            async function loadDatabase() {
                const cached = localStorage.getItem(DB_KEY); if (cached) return JSON.parse(cached);
                let url = localStorage.getItem(URL_KEY);
                if (!url) { url = prompt("Enter your Gist URL:"); if (!url) return null; if (!url.includes("raw")) url = url + "/raw"; localStorage.setItem(URL_KEY, url); }
                return new Promise((resolve) => {
                    fetch(url).then(res => res.text()).then(text => {
                        const db = parseStrictLayout(text); localStorage.setItem(DB_KEY, JSON.stringify(db));
                        window.location.href = "https://pokeheroes.com/royal_tunnel"; resolve(db);
                    }).catch(() => { alert("Download failed."); localStorage.removeItem(URL_KEY); resolve(null); });
                });
            }

            function parseStrictLayout(text) {
                const db = {}; const lines = text.split('\n'); let localMem = JSON.parse(localStorage.getItem("RT_Learned_DB")) || { matches: {}, wrongs: {} };
                for (let line of lines) {
                    line = line.trim(); if (!line) continue;
                    if (line.startsWith('{"matches":') || line.startsWith('{"wrongs":')) {
                        try { const importedMem = JSON.parse(line); Object.assign(localMem.matches, importedMem.matches || {}); for (const [k, v] of Object.entries(importedMem.wrongs || {})) { localMem.wrongs[k] = [...new Set([...(localMem.wrongs[k]||[]), ...v])]; } } catch(e) {} continue;
                    }
                    if (line.startsWith("Pokédex")) continue; const cols = line.split('\t'); if (cols.length < 5) continue; 
                    const id = cols[0].trim(); db[id] = db[id] || [];
                    db[id].push({ n: cols[1].trim(), l: (cols[2] || "").replace(/[^0-9]/g, ""), h: (cols[3] || "").replace(/[^0-9]/g, ""), t: (cols[4] || "").toLowerCase().replace(/,/g, " "), c: (cols[5] || "").toLowerCase(), e: (cols[6] || "").toLowerCase(), d: (cols[7] || "").toLowerCase().replace(/[^a-z0-9]/g, "") });
                }
                localStorage.setItem("RT_Learned_DB", JSON.stringify(localMem)); return db;
            }

            function attemptSolve(container, db, retryCount) {
                const questEl = document.querySelector(".royal_quest"); let qHtml = questEl.innerHTML; let rawText = questEl.textContent.trim(); let qText = rawText.replace(/Question.*?Level\s*\d+/gi, "").trim(); let target = ""; let mode = "general";
                if (qHtml.includes("type_icons")) { mode = "type"; const match = qHtml.match(/type_icons\/([a-z]+)\.gif/i); target = match ? match[1].toLowerCase() : ""; } 
                else if (qText.match(/evolves.*level/i)) { mode = "evo"; target = (qText.match(/level\s*(\d+)/i) || [])[1] || ""; } 
                else if (qText.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*(Steps|EHP)/i)) { mode = "ehp"; target = (qText.match(/(\d{1,3}(?:,\d{3})+|\d{3,})/) || [])[1].replace(/,/g, "") || ""; } 
                else if (qText.match(/Pok[eé]Dex.*?:/i)) { mode = "dex"; target = qText.substring(qText.search(/:/) + 1).toLowerCase().replace(/[^a-z0-9\*]/g, "").replace(/\*+/g, "*"); } 
                else if (qText.match(/considered as/i)) { mode = "classification"; const match = qText.match(/considered as (?:a|an )?(.*?)[\s\-]*Pok/i); target = match ? match[1].toLowerCase().trim() : qText.toLowerCase(); } 
                else if (qText.match(/egggroup|member of the/i)) { mode = "egg"; const quotes = [...qText.matchAll(/"([^"]+)"/g)].map(m => m[1].toLowerCase().trim()); if (quotes.length > 0) target = quotes; else target = [(qText.match(/member of the (.*?) egg/i) || [])[1]?.toLowerCase().trim() || qText.toLowerCase()]; } 
                else if (qText.match(/-type/i)) { mode = "type"; target = (qText.match(/is (?:a|an )?(.*?)-type/i) || [])[1]?.toLowerCase().trim() || ""; } 
                else { mode = "name"; target = qText.replace(/Which of these is (?:a|an )?/i, "").replace(/\?/g, "").trim().toLowerCase(); }

                const qKey = mode + ":" + JSON.stringify(target); let learnedDB = JSON.parse(localStorage.getItem("RT_Learned_DB")) || { matches: {}, wrongs: {} };
                const learnedMatch = learnedDB.matches[qKey]; const knownWrongs = learnedDB.wrongs[qKey] || []; const links = container.getElementsByTagName("a");
                let matches = [], eliminated = [], unknowns = [];

                for (let i = 0; i < links.length; i++) {
                    const link = links[i]; const img = link.querySelector("img"); if (!img) continue;
                    const id = parseInt(img.src.split("/").pop().split(".")[0]).toString(); const variants = db[id];
                    if (learnedMatch === id) { matches.push({ link, id, name: variants ? variants[0].n : "Memory Match" }); continue; }
                    if (knownWrongs.includes(id)) { eliminated.push({ link, id, name: variants ? variants[0].n : "Memory Wrong" }); continue; }
                    if (!variants) { unknowns.push({ link, id, name: "Unknown DB" }); continue; }
                    let hasMatch = false, allEliminated = true, hasValidData = false;
                    for (const mon of variants) {
                        let isFieldValid = false, matchCondition = false;
                        if (mode === "evo") { isFieldValid = true; matchCondition = (mon.l === target); } 
                        else if (mode === "ehp") { isFieldValid = (mon.h !== ""); matchCondition = (mon.h === target); } 
                        else if (mode === "type") { isFieldValid = (mon.t !== ""); matchCondition = mon.t.includes(target); } 
                        else if (mode === "dex") { isFieldValid = (mon.d !== ""); if (target.includes("*")) { const parts = target.split("*").filter(p => p.length > 0); let validSeq = true, s = 0; for (const p of parts) { const idx = mon.d.indexOf(p, s); if (idx === -1) { validSeq = false; break; } s = idx + p.length; } matchCondition = validSeq; } else { matchCondition = (mon.d === target || mon.d.includes(target) || target.includes(mon.d)); } } 
                        else if (mode === "classification") { isFieldValid = (mon.c !== ""); matchCondition = mon.c.includes(target); } 
                        else if (mode === "egg") { isFieldValid = (mon.e !== ""); matchCondition = target.every(t => mon.e.includes(t)); } 
                        else if (mode === "name") { isFieldValid = (mon.n !== ""); matchCondition = (mon.n.toLowerCase() === target || target.includes(mon.n.toLowerCase())); }
                        if (isFieldValid) { hasValidData = true; if (matchCondition) { hasMatch = true; allEliminated = false; } } else { allEliminated = false; }
                    }
                    if (hasMatch) matches.push({ link, id, name: variants[0].n }); else if (hasValidData && allEliminated) eliminated.push({ link, id, name: variants[0].n }); else unknowns.push({ link, id, name: variants[0].n });
                }

                let foundLink = null; let chosenId = null; let wasGuess = false;
                if (matches.length > 0) { foundLink = matches[0].link; chosenId = matches[0].id; } 
                else if (eliminated.length === 2 && unknowns.length === 1) { foundLink = unknowns[0].link; chosenId = unknowns[0].id; wasGuess = true;  }
                else if (unknowns.length > 0) { const guess = unknowns[Math.floor(Math.random() * unknowns.length)]; foundLink = guess.link; chosenId = guess.id; wasGuess = true; } 
                else if (eliminated.length > 0) { const guess = eliminated[Math.floor(Math.random() * eliminated.length)]; foundLink = guess.link; chosenId = guess.id; wasGuess = true; }

                if (foundLink) {
                    localStorage.setItem("RT_PendingGuess", JSON.stringify({ qKey, guessedId: chosenId, wasGuess }));
                    setTimeout(() => window.location.href = foundLink.href, tunnelDelay + (Math.random() * 200));
                } else {
                    if (retryCount < MAX_RETRIES) { setTimeout(() => attemptSolve(container, db, retryCount + 1), 1000); } else { log(`FAILED. Cannot determine answer.`); }
                }
            }
            function log(msg) { console.log("[RTBot]", msg); const box = document.getElementById("rt-debug"); if (box) { box.innerHTML += `<div>> ${msg}</div>`; box.scrollTop = box.scrollHeight; } }
            function addDebugBox() { if (!document.getElementById("rt-debug")) { document.body.insertAdjacentHTML('beforeend', `<div id="rt-debug" style="position: fixed; bottom: 10px; right: 10px; width: 300px; height: 160px; background: rgba(0,0,0,0.85); color: #0f0; font-family: monospace; font-size: 11px; overflow-y: auto; padding: 5px; z-index: 9999; border: 1px solid #0f0; pointer-events:none;"></div>`); } }
            setTimeout(start, 500);
        })();
    }

    function payloadSlot() {
        window.addEventListener('message', async (event) => {
            if (event.data && event.data.type === 'SLOT_BLAST') {
                const count = event.data.count || 100;
                const SPIN_URL = 'https://pokeheroes.com/golden_slot?mode=plus&spin=true&noanim';
                try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'Blasting ' + count + 'x...' }, '*'); } catch(e){}
                let promises = [];
                for (let i = 1; i <= count; i++) {
                    let url = SPIN_URL + "&_=" + Date.now() + i;
                    let p = fetch(url, { cache: "no-store" }).catch(() => {});
                    promises.push(p);
                    await new Promise(r => setTimeout(r, 5));
                }
                await Promise.all(promises);
                try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'Done! Reloading...' }, '*'); } catch(e){}
                setTimeout(() => window.location.href = "https://pokeheroes.com/golden_slot", 500);
            }
        });
        setInterval(() => { try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'Ready to Blast' }, '*'); } catch(e){} }, 5000);
    }

    function payloadHatch() {
        setInterval(() => {
            const isActive = localStorage.getItem('PH_HATCH_LOOP_RUNNING') === 'true';
            const tgt = localStorage.getItem('PH_HATCH_LOOP_TARGET') === 'lab' ? 'Lab' : 'Grass';
            try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: isActive ? `Running (${tgt})` : 'PAUSED' }, '*'); } catch(e){}
        }, 1500);

        (function() {
            const KEYS = { RUN: 'PH_HATCH_LOOP_RUNNING', TARGET: 'PH_HATCH_LOOP_TARGET' };
            if (!localStorage.getItem(KEYS.RUN)) localStorage.setItem(KEYS.RUN, 'false');
            if (!localStorage.getItem(KEYS.TARGET)) localStorage.setItem(KEYS.TARGET, 'lab');
            const SETTINGS = { STEP_DELAY: 1500, MOVE_DELAY: 4000 };
            window.alert = function() { return true; };
            let isRunning = localStorage.getItem(KEYS.RUN) === 'true';
            
            // Re-sync isRunning on internal timer to catch Parent overrides without reloading
            setInterval(() => { isRunning = localStorage.getItem(KEYS.RUN) === 'true'; }, 1000);

            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            function waitForElement(selector, callback) {
                let retries = 0; const interval = setInterval(() => {
                    if (!isRunning) { clearInterval(interval); return; }
                    const element = document.querySelector(selector);
                    if (element) { clearInterval(interval); callback(element); }
                    retries++; if (retries > 30) clearInterval(interval); 
                }, 1000);
            }

            function router() {
                if (!isRunning) return;
                const url = window.location.href; const currentTarget = localStorage.getItem(KEYS.TARGET);
                if (url.includes('storage_box')) { runStorageLogic(); } 
                else if (url.includes('lab')) { if (currentTarget === 'grass') window.location.href = "https://pokeheroes.com/tall_grass"; else runLabLogic(); } 
                else if (url.includes('tall_grass')) { if (currentTarget === 'lab') window.location.href = "https://pokeheroes.com/lab"; else runGrassLogic(); }
            }

            async function runStorageLogic() {
                if (!isRunning) return; await sleep(1000);
                waitForElement("a[onclick='selectAll();']", async (selectAllButton) => {
                    selectAllButton.click(); await sleep(SETTINGS.STEP_DELAY); 
                    waitForElement("button.b1", async (movePokemonButton) => {
                        movePokemonButton.click(); await sleep(SETTINGS.STEP_DELAY); 
                        waitForElement("button[onclick^='selectBox(3']", async (box3Button) => {
                            box3Button.click(); box3Button.dispatchEvent(new Event('click', { bubbles: true })); 
                            await sleep(SETTINGS.MOVE_DELAY); redirectHome();
                        });
                    });
                });
            }

            function redirectHome() {
                if (!isRunning) return;
                const target = localStorage.getItem(KEYS.TARGET) || 'lab'; 
                if (target === 'lab') { window.location.href = "https://pokeheroes.com/lab"; } else { window.location.href = "https://pokeheroes.com/tall_grass"; }
            }

            function runLabLogic() {
                if (!isRunning) return; const bodyText = document.body.innerText.toLowerCase();
                if (bodyText.includes("party is full") || bodyText.includes("already carry 6 pok")) { setTimeout(() => { window.location.href = "https://pokeheroes.com/storage_box"; }, 1000); return; }
                const eggLink = document.querySelector('a[href*="pos=1"]');
                if (eggLink) { setTimeout(() => { if(isRunning) window.location.href = eggLink.href; }, 1000); } 
                else { setTimeout(() => { if(isRunning) window.location.href = "https://pokeheroes.com/lab"; }, 2000); }
            }

            function runGrassLogic() {
                const grassLoop = async () => {
                    if (!isRunning) return; const bodyText = document.body.innerText;
                    if (bodyText.includes("Party is full") || document.querySelector('.ui-dialog')) {
                        const closeBtn = document.querySelector('.ui-dialog-buttonpane button'); if (closeBtn) closeBtn.click();
                        await sleep(1000); window.location.href = "https://pokeheroes.com/storage_box"; return;
                    }
                    const allGrass = Array.from(document.querySelectorAll('img[src*="/img/tall_grass/"]'));
                    const validGrass = allGrass.filter(img => { const style = window.getComputedStyle(img); return !style.filter.includes('grayscale') && parseFloat(style.opacity) > 0.5; });
                    if (validGrass.length > 0) {
                        const randomGrass = validGrass[Math.floor(Math.random() * validGrass.length)]; randomGrass.click(); setTimeout(grassLoop, 800);
                    } else { await sleep(2000); window.location.href = "https://pokeheroes.com/storage_box"; }
                }; grassLoop();
            }

            if (isRunning) { setTimeout(router, 1500); }
        })();
    }

    function payloadHoney() {
        setInterval(() => {
            const isActive = localStorage.getItem('PH_HT_RUNNING') === 'true';
            const type = localStorage.getItem('PH_HT_TYPE') === 'normal' ? 'Norm' : 'Super';
            try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: isActive ? `Running (${type})` : 'PAUSED' }, '*'); } catch(e){}
        }, 2000);

        (function() {
            const RUN_KEY = 'PH_HT_RUNNING', TYPE_KEY = 'PH_HT_TYPE';
            if (!localStorage.getItem(RUN_KEY)) localStorage.setItem(RUN_KEY, 'false');
            if (!localStorage.getItem(TYPE_KEY)) localStorage.setItem(TYPE_KEY, 'normal');

            let isRunning = localStorage.getItem(RUN_KEY) === 'true';
            let actionTimer = null;
            
            // Re-sync isRunning on internal timer to catch Parent overrides
            setInterval(() => { isRunning = localStorage.getItem(RUN_KEY) === 'true'; }, 1000);

            function runBotLogic() {
                if (!isRunning) return;
                const honeyType = localStorage.getItem(TYPE_KEY) || 'normal';
                const bodyText = document.body.innerText.toLowerCase();

                const pokeball = document.querySelector('[src*="poke-ball.png"]');
                if (pokeball) { pokeball.click(); actionTimer = setTimeout(runBotLogic, 5000); return; }

                if (bodyText.includes("was caught") || bodyText.includes("ran away") || bodyText.includes("fled") || bodyText.includes("escaped")) {
                    actionTimer = setTimeout(() => { window.location.href = "https://pokeheroes.com/honeytree"; }, 2000); return;
                }

                if (bodyText.includes("a lot of honey sticks to the tree") || bodyText.includes("covered with honey") || bodyText.includes("the tree is smeared with super honey")) {
                    actionTimer = setTimeout(() => location.reload(), 4 * 60 * 1000); return;
                }

                const engageLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent.toLowerCase().includes('a wild') || a.textContent.toLowerCase().includes('look closer'));
                if (engageLink) { engageLink.click(); actionTimer = setTimeout(runBotLogic, 2000); return; }

                const targetHref = honeyType === 'normal' ? 'brush=honey' : 'brush=super';
                const brushLink = document.querySelector(`a[href*="${targetHref}"]`);
                if (brushLink) { window.location.href = brushLink.href; return; }

                actionTimer = setTimeout(runBotLogic, 3000);
            }

            if (isRunning) { setTimeout(runBotLogic, 1500); }
        })();
    }

    function payloadBerry() {
        const K = {
            RUN: 'PH_BL_RUN', G_BERRY: 'PH_BL_G_BERRY', G_LEVEL: 'PH_BL_G_LEVEL', G_MAX: 'PH_BL_G_MAX',
            S_BERRY: 'PH_BL_S_BERRY', S_LEVEL: 'PH_BL_S_LEVEL', S_MAX: 'PH_BL_S_MAX', S_DELAY: 'PH_BL_S_DELAY',
            GARDEN_IDX: 'PH_BL_GARDEN_IDX', SKIP_MASK:  'PH_BL_SKIP_MASK', UI_OPEN: 'PH_BL_UI_OPEN'
        };
        const SETTINGS = { ACTION_DELAY: 1200 };
        const BERRY_LIST = ["Aguav", "Apicot", "Aspear", "Babiri", "Belue", "Bluk", "Charti", "Cheri", "Chesto", "Chilan", "Chople", "Coba", "Colbur", "Cornn", "Custap", "Durin", "Enigma", "Figy", "Ganlon", "Grepa", "Haban", "Hondew", "Iapapa", "Jaboca", "Kasib", "Kebia", "Kelpsy", "Lansat", "Leppa", "Liechi", "Lum", "Mago", "Magost", "Micle", "Nanab", "Nomel", "Occa", "Oran", "Pamtre", "Passho", "Payapa", "Pecha", "Persim", "Petaya", "Pinap", "Pomeg", "Qualot", "Rabuta", "Rawst", "Razz", "Rowap", "Salac", "Shuca", "Sitrus", "Spelon", "Starf", "Tamato", "Tanga", "Wacan", "Wepear", "Wiki", "Yache"];
        window.alert = function() { return true; }; window.confirm = function() { return true; };
        
        let isRunning = localStorage.getItem(K.RUN) === 'true'; 
        let skipMask = localStorage.getItem(K.SKIP_MASK) || "1111"; 
        let currentGarden = parseInt(localStorage.getItem(K.GARDEN_IDX) || '1');
        let lastState = isRunning;
        
        setInterval(() => { 
            isRunning = localStorage.getItem(K.RUN) === 'true'; 
            if (isRunning && !lastState) router(); // Instantly trigger if turned on remotely
            lastState = isRunning;
        }, 1000);

        const css = `#ph-berry-dash { background: #1a1a1a; color: #eee; font-family: 'Segoe UI', sans-serif; font-size: 12px; border-bottom: 3px solid #2ecc71; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); } #ph-berry-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 15px; background: #111; border-bottom: 1px solid #333; cursor: pointer; } .ph-title { font-weight: bold; font-size: 14px; color: #2ecc71; letter-spacing: 1px; } .ph-status { font-weight: bold; color: #aaa; margin-left: 15px; } .ph-toggle-icon { font-weight: bold; color: #555; transition: transform 0.3s; } #ph-berry-body { display: flex; flex-wrap: wrap; padding: 10px; gap: 15px; transition: all 0.3s; overflow: hidden; } .ph-panel { flex: 1; min-width: 250px; background: #222; padding: 10px; border-radius: 5px; border: 1px solid #333; } .ph-panel-title { font-weight: bold; margin-bottom: 8px; font-size: 13px; border-bottom: 1px solid #444; padding-bottom: 4px; } .ph-row { display: flex; align-items: center; margin-bottom: 6px; gap: 8px; } .ph-label { width: 40px; color: #888; } select, input { background: #333; border: 1px solid #555; color: white; padding: 3px; border-radius: 3px; } .ph-btn-group { display: flex; gap: 2px; flex: 1; } .ph-skip-btn { flex: 1; border: none; padding: 4px; font-weight: bold; font-size: 10px; cursor: pointer; color: white; } #ph-main-toggle { background: #e74c3c; color: white; border: none; padding: 10px 20px; font-weight: bold; font-size: 14px; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 5px; transition: background 0.2s; } #ph-main-toggle:hover { opacity: 0.9; } .hidden-body { max-height: 0; padding: 0 !important; opacity: 0; }`;
        const style = document.createElement('style'); style.innerHTML = css; document.head.appendChild(style);
        function createOptions(selected) { return BERRY_LIST.map(b => `<option value="${b}" ${b === selected ? 'selected' : ''}>${b}</option>`).join(''); }
        function renderUI() {
            if (document.getElementById('ph-berry-dash')) return; const target = document.querySelector('#textbar') || document.querySelector('#content'); if (!target) return;
            const gBerry = localStorage.getItem(K.G_BERRY) || 'Oran'; const gLevel = localStorage.getItem(K.G_LEVEL) || '1'; const gMax = localStorage.getItem(K.G_MAX) === 'true';
            const sBerry = localStorage.getItem(K.S_BERRY) || 'Oran'; const sLevel = localStorage.getItem(K.S_LEVEL) || '1'; const sMax = localStorage.getItem(K.S_MAX) === 'true'; const sDelay = localStorage.getItem(K.S_DELAY) || '60'; const isOpen = localStorage.getItem(K.UI_OPEN) !== 'false';
            const dash = document.createElement('div'); dash.id = 'ph-berry-dash';
            dash.innerHTML = `<div id="ph-berry-header"><div style="display:flex; align-items:center;"><span class="ph-title">BERRY BOT v8</span><span id="ph-status-text" class="ph-status">${isRunning ? 'RUNNING' : 'PAUSED'}</span></div><span class="ph-toggle-icon" style="transform: ${isOpen ? 'rotate(0deg)' : 'rotate(-90deg)'}">▼</span></div><div id="ph-berry-body" class="${isOpen ? '' : 'hidden-body'}"><div class="ph-panel" style="border-top: 3px solid #27ae60;"><div class="ph-panel-title" style="color:#27ae60">🌱 GARDEN (Planting)</div><div class="ph-row"><div class="ph-label">Berry:</div><select id="ui-g-berry" style="flex:1">${createOptions(gBerry)}</select></div><div class="ph-row"><div class="ph-label">Level:</div><input type="number" id="ui-g-level" value="${gLevel}" style="width:50px" ${gMax ? 'disabled' : ''}><input type="checkbox" id="ui-g-max" ${gMax ? 'checked' : ''}><label for="ui-g-max">Highest</label></div><div class="ph-row"><div class="ph-label">Skip:</div><div class="ph-btn-group" id="ph-skip-group"></div></div></div><div class="ph-panel" style="border-top: 3px solid #e67e22;"><div class="ph-panel-title" style="color:#e67e22">🍂 SHED (Mulching)</div><div class="ph-row"><div class="ph-label">Berry:</div><select id="ui-s-berry" style="flex:1">${createOptions(sBerry)}</select></div><div class="ph-row"><div class="ph-label">Level:</div><input type="number" id="ui-s-level" value="${sLevel}" style="width:50px" ${sMax ? 'disabled' : ''}><input type="checkbox" id="ui-s-max" ${sMax ? 'checked' : ''}><label for="ui-s-max">Highest</label></div><div class="ph-row"><div class="ph-label">Delay:</div><input type="number" id="ui-s-delay" value="${sDelay}" style="width:50px"> <span style="color:#888">seconds</span></div></div><div style="width:100%"><button id="ph-main-toggle"></button></div></div>`;
            target.prepend(dash); updateToggleBtn(); renderSkipButtons();
            document.getElementById('ph-berry-header').onclick = () => { const body = document.getElementById('ph-berry-body'); const icon = document.querySelector('.ph-toggle-icon'); const wasOpen = !body.classList.contains('hidden-body'); if (wasOpen) { body.classList.add('hidden-body'); icon.style.transform = 'rotate(-90deg)'; localStorage.setItem(K.UI_OPEN, 'false'); } else { body.classList.remove('hidden-body'); icon.style.transform = 'rotate(0deg)'; localStorage.setItem(K.UI_OPEN, 'true'); } };
            document.getElementById('ph-main-toggle').onclick = () => { isRunning = !isRunning; localStorage.setItem(K.RUN, isRunning); if (!isRunning) localStorage.setItem(K.GARDEN_IDX, '1'); updateToggleBtn(); if (isRunning) router(); };
            document.getElementById('ui-g-berry').onchange = (e) => localStorage.setItem(K.G_BERRY, e.target.value); document.getElementById('ui-g-level').onchange = (e) => localStorage.setItem(K.G_LEVEL, e.target.value); document.getElementById('ui-g-max').onchange = (e) => { localStorage.setItem(K.G_MAX, e.target.checked); document.getElementById('ui-g-level').disabled = e.target.checked; };
            document.getElementById('ui-s-berry').onchange = (e) => localStorage.setItem(K.S_BERRY, e.target.value); document.getElementById('ui-s-level').onchange = (e) => localStorage.setItem(K.S_LEVEL, e.target.value); document.getElementById('ui-s-max').onchange = (e) => { localStorage.setItem(K.S_MAX, e.target.checked); document.getElementById('ui-s-level').disabled = e.target.checked; }; document.getElementById('ui-s-delay').onchange = (e) => localStorage.setItem(K.S_DELAY, e.target.value);
        }
        function renderSkipButtons() { const group = document.getElementById('ph-skip-group'); group.innerHTML = ''; for(let i=0; i<4; i++) { const btn = document.createElement('button'); btn.className = 'ph-skip-btn'; btn.innerText = `G${i+1}`; const active = skipMask[i] === '1'; btn.style.background = active ? '#27ae60' : '#c0392b'; btn.onclick = () => { let arr = skipMask.split(''); arr[i] = arr[i] === '1' ? '0' : '1'; skipMask = arr.join(''); localStorage.setItem(K.SKIP_MASK, skipMask); renderSkipButtons(); }; group.appendChild(btn); } }
        function updateToggleBtn() { const btn = document.getElementById('ph-main-toggle'); const stat = document.getElementById('ph-status-text'); if (isRunning) { btn.innerText = "🛑 STOP LOOP"; btn.style.background = "#e74c3c"; stat.innerText = "RUNNING"; stat.style.color = "#2ecc71"; } else { btn.innerText = "▶️ START LOOP"; btn.style.background = "#2ecc71"; stat.innerText = "PAUSED"; stat.style.color = "#e74c3c"; } }
        
        function log(msg) { 
            const el = document.getElementById('ph-status-text'); if (el) el.innerText = msg; 
            try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: msg }, '*'); } catch(e){}
        }

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        function router() { if (!isRunning) { log("PAUSED"); return; } if (window.location.href.includes('berrygarden')) runGardenLogic(); else if (window.location.href.includes('toolshed')) runToolShedLogic(); }
        function findItem(bagId, typePrefix, berryName, targetLvl, useMax) { const bag = document.getElementById(bagId); if (!bag) return null; if (useMax) { for (let l = 100; l >= 1; l--) { const el = bag.querySelector(`.${typePrefix}${berryName} .level${l}`); if (el) { const count = parseInt(el.querySelector('.itemAmount')?.innerText || "0") || 999; if (count > 0) return { name: berryName, level: l, count: count }; } } } else { const l = parseInt(targetLvl); const el = bag.querySelector(`.${typePrefix}${berryName} .level${l}`); if (el) { const count = parseInt(el.querySelector('.itemAmount')?.innerText || "0") || 999; if (count > 0) return { name: berryName, level: l, count: count }; } } return null; }
        
        async function runGardenLogic() {
            if (skipMask[currentGarden - 1] === '0') { nextGarden(); return; }
            log(`Garden ${currentGarden}...`); await sleep(1000);
            const harvestBtn = document.querySelector('a[onclick*="harvestAll"]'); let harvested = false;
            if (harvestBtn) { log("Harvesting..."); harvestBtn.click(); harvested = true; await sleep(SETTINGS.ACTION_DELAY * 1.5); }
            if (!harvested) { log("Skipping (Growing)..."); nextGarden(); return; }
            if (!isRunning) return;
            const gName = localStorage.getItem(K.G_BERRY) || 'Oran'; const gLvl = localStorage.getItem(K.G_LEVEL) || '1'; const gMax = localStorage.getItem(K.G_MAX) === 'true';
            const seed = findItem('seedBag', 'seed', gName, gLvl, gMax);
            if (seed) { log(`Planting ${seed.name}...`); const selScript = document.createElement('script'); selScript.textContent = `if(typeof selectSeed === 'function') selectSeed('${seed.name}', ${seed.level});`; document.body.appendChild(selScript); await sleep(800); const pltScript = document.createElement('script'); pltScript.textContent = `if(typeof gardenCoor !== 'undefined' && typeof garden !== 'undefined' && gardenCoor[garden]) { var max = ${seed.count}; var planted = 0; for(let i=0; i<gardenCoor[garden].length && planted < max; i++) { clickOnGarden(gardenCoor[garden][i][0], gardenCoor[garden][i][1]); planted++; } }`; document.body.appendChild(pltScript); await sleep(SETTINGS.ACTION_DELAY * 1.5); } else { log(`No Seeds`); }
            log("Watering..."); const wScript = document.createElement('script'); wScript.textContent = `$('.plantIcon[data-plantid]').each(function() { var pid = $(this).attr('data-plantid'); if($('.dryGround' + pid).length) { waterPlant($(this)); } });`; document.body.appendChild(wScript); await sleep(SETTINGS.ACTION_DELAY);
            nextGarden();
        }
        function nextGarden() {
            if (!isRunning) return;
            if (currentGarden < 4) { currentGarden++; localStorage.setItem(K.GARDEN_IDX, currentGarden); if (skipMask[currentGarden - 1] === '0') { nextGarden(); return; } log(`Loading G${currentGarden}...`); const s = document.createElement('script'); s.textContent = `loadBerryGarden(${currentGarden});`; document.body.appendChild(s); setTimeout(runGardenLogic, 3000); } 
            else { currentGarden = 1; localStorage.setItem(K.GARDEN_IDX, '1'); log("To Tool Shed..."); window.location.href = "https://pokeheroes.com/toolshed"; }
        }
        async function runToolShedLogic() {
            log("Tool Shed..."); await sleep(1000);
            const cScript = document.createElement('script'); cScript.textContent = `if(typeof claimSeed === 'function') { claimSeed(0); claimSeed(1); claimSeed(2); }`; document.body.appendChild(cScript);
            const delaySec = parseInt(localStorage.getItem(K.S_DELAY) || "60");
            for (let i = delaySec; i > 0; i--) { if (!isRunning) return; log(`Sleeping: ${i}s...`); await sleep(1000); }
            if (!isRunning) return;
            const sName = localStorage.getItem(K.S_BERRY) || 'Oran'; const sLvl = localStorage.getItem(K.S_LEVEL) || '1'; const sMax = localStorage.getItem(K.S_MAX) === 'true';
            const berry = findItem('berryBag', 'berry', sName, sLvl, sMax);
            if (berry) { log(`Fill: ${berry.name}...`); const fScript = document.createElement('script'); fScript.textContent = `function autoFill(m) { var d = $(".seedMakerDesc" + m).text(); var mat = d.match(/(\\d+)\\s*Berries/); var cap = mat ? parseInt(mat[1]) : 0; var inv = ${berry.count}; var amt = Math.min(cap, inv); if(amt > 0) { $.ajax({ url: 'includes/ajax/berrygarden/fillSeedMaker.php', type: 'POST', data: { berries: '${berry.name}', amount: amt, level: '${berry.level}', maker: m } }); } } autoFill(0); setTimeout(()=>autoFill(1), 500); setTimeout(()=>autoFill(2), 1000);`; document.body.appendChild(fScript); } else { log(`No Berries`); }
            await sleep(SETTINGS.ACTION_DELAY * 2); if (!isRunning) return; window.location.href = "https://pokeheroes.com/berrygarden";
        }

        renderUI(); if (isRunning) setTimeout(router, 1000); else log("PAUSED");
    }

    function payloadRadar() {
        // Shadow Radar UI Hooks
        const btnHtml = "<button id='autopilot' style='padding:5px 10px; background:#8e44ad; color:white; font-weight:bold; border-radius:4px; border:none; cursor:pointer;'>Auto Pilot</button>";
        const radarBg = document.getElementById("shiny_radar_background");
        if (radarBg && !document.getElementById("autopilot")) {
            radarBg.insertAdjacentHTML("afterend", btnHtml);
            document.getElementById("autopilot").addEventListener("click", generateKaiba);
        }

        var autoFind;
        var shadowIncrement = 0;
        var current_x = 0;
        var current_y = 0;

        function generate0() { if(window.generate) clearInterval(window.generate); current_x = 0; current_y = 0; fightShadow(); }
        function generate9() { if(window.generate) clearInterval(window.generate); current_x = 9; current_y = 9; fightShadow(); }

        function generateKaiba() {
            shadowIncrement++;
            if (shadowIncrement % 2 == 0) generate0(); else generate9();
        }

        window.fightShadow = function() { 
            if(window.generate) clearInterval(window.generate);
            const shadow = document.getElementById("pokemon_shadow"); if (shadow) shadow.innerHTML = "";
            
            // Uses jQuery from PokeHeroes natively
            if(typeof window.$ !== 'undefined') {
                window.$("#shiny_fight").load("/includes/ajax/shadowradar/fight.php", { 'x': current_x, 'y': current_y }, function (data) {
                    window.$("#shiny_fight").fadeTo(0, 0.95);
                    if (data.indexOf("Ball") >= 0) {
                        if(autoFind) clearInterval(autoFind);
                        try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: 'Found! (Throw Ball)' }, '*'); } catch(e){}
                    } else {
                        generateKaiba();
                    }
                });
            }
        }

        // Report Status to Parent
        setInterval(() => {
            let msg = 'Ready (Need Start)';
            if (typeof window.chain_length !== 'undefined' && window.chain_length > 0) msg = 'Chain: ' + window.chain_length;
            try { window.parent.postMessage({ type: 'STATUS', id: window.name, msg: msg }, '*'); } catch(e){}
        }, 2000);
    }

    // =========================================================================
    // SECTION 2: THE INJECTOR ENGINE (Refactored for Individual Control)
    // =========================================================================

    function getPayload(id) {
        if (id === 'w_home') return payloadHome;
        if (id === 'w_rumble') return payloadRumble;
        if (id === 'w_treasure') return payloadTreasure;
        if (id === 'w_dream') return payloadDream;
        if (id === 'w_c_new') return payloadClicker;
        if (id === 'w_hangman') return payloadHangman;
        if (id === 'w_hol') return payloadHoL;
        if (id === 'w_concent') return payloadConcentration;
        if (id === 'w_fish') return payloadFish;
        if (id === 'w_rt') return payloadRoyalTunnel;
        if (id === 'w_slot') return payloadSlot;
        if (id === 'w_hatch') return payloadHatch;
        if (id === 'w_honey') return payloadHoney;
        if (id === 'w_berry') return payloadBerry;
        if (id === 'w_radar') return payloadRadar;
        return null;
    }

    function toggleWorker(workerObj) {
        const container = document.getElementById(`frame-container-${workerObj.id}`);
        const btn = document.getElementById(`btn-power-${workerObj.id}`);
        const status = document.getElementById(`status-${workerObj.id}`);
        const existingFrame = document.getElementById(workerObj.id);

        if (existingFrame) {
            // SHUTDOWN SEQUENCE
            existingFrame.remove();
            btn.innerText = "BOOT";
            btn.style.background = "#27ae60"; // Green
            status.innerText = "OFFLINE";
            status.style.color = "#555";
        } else {
            // BOOT SEQUENCE
            btn.innerText = "KILL";
            btn.style.background = "#ef4444"; // Red
            status.innerText = "Booting...";
            status.style.color = "#fbbf24"; // Yellow
            
            const iframe = document.createElement('iframe');
            iframe.id = workerObj.id; 
            iframe.name = workerObj.id; 
            iframe.src = workerObj.url; 
            iframe.className = "ph-worker";
            
            iframe.onload = function() {
                const win = iframe.contentWindow;
                const payload = getPayload(workerObj.id);
                if (payload) {
                    const script = win.document.createElement('script');
                    script.textContent = `(${payload.toString()})();`;
                    win.document.body.appendChild(script);
                }
            };

            container.appendChild(iframe);
        }
    }

    // =========================================================================
    // SECTION 3: UI
    // =========================================================================

    function initCommandCenter() {
        const target = document.querySelector('#textbar') || document.body;
        if (document.getElementById('ph-command-ui')) return;

        const css = `
            #ph-command-ui {
                background: #111418; color: #e2e8f0; padding: 20px; border: 1px solid #2d3748;
                border-top: 4px solid #3b82f6; border-radius: 8px; font-family: 'Segoe UI', system-ui, sans-serif;
                margin-bottom: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; box-sizing: border-box;
            }
            .ph-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
            .ph-title { font-size: 24px; font-weight: 800; color: #60a5fa; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; }
            .ph-section-title { font-size: 14px; font-weight: 600; color: #9ca3af; margin: 15px 0 10px 0; text-transform: uppercase; border-bottom: 1px solid #374151; padding-bottom: 5px; }
            
            /* Toggles Grid */
            .ph-toggles-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
            .ph-toggle-card { background: #1f2937; border: 1px solid #374151; border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
            
            .ph-btn-main { background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 4px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; width: 100%; text-align: center; }
            .ph-btn-main:hover { filter: brightness(1.1); transform: translateY(-1px); }
            
            /* Dynamic State Colors for Toggles */
            .ph-btn-main.st-off { background: #ef4444; }
            .ph-btn-main.st-on { background: #10b981; }

            .ph-btn-sub { background: #374151; color: #d1d5db; border: 1px solid #4b5563; padding: 6px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: 0.2s; font-weight: 600; width: 100%; text-transform: uppercase; }
            .ph-btn-sub:hover { background: #4b5563; color: white; }
            
            .ph-btn-action { background: #f59e0b; color: #000; border: none; padding: 10px; border-radius: 4px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; width: 100%; text-align: center; }
            .ph-btn-action.purple { background: #8b5cf6; color: white; }
            .ph-btn-action.red { background: #ef4444; color: white; }
            .ph-btn-action:hover { filter: brightness(1.1); transform: translateY(-1px); }

            /* Modules Grid */
            .ph-modules-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-top: 15px;}
            .ph-module-card { background: #1f2937; border: 1px solid #374151; padding: 12px; border-radius: 6px; display: flex; flex-direction: column; text-align: center; transition: all 0.3s ease; }
            .ph-module-card.expanded { grid-column: 1 / -1; background: #111827; border-color: #60a5fa; }
            
            .ph-module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .ph-module-title { font-size: 13px; font-weight: 700; color: #e5e7eb; margin: 0; }
            .ph-module-status { font-size: 11px; font-weight: 600; color: #9ca3af; min-height: 16px; margin-bottom: 10px; background: #111827; padding: 4px; border-radius: 4px; }
            
            .ph-power-btn { background: #10b981; color: white; border: none; padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px; transition: 0.2s; }
            
            .ph-expand-btn { background: none; border: none; color: #9ca3af; font-size: 18px; cursor: pointer; padding: 0 5px; line-height: 1; font-weight: bold; }
            .ph-expand-btn:hover { color: #60a5fa; }
            
            /* iFrame Container Magic */
            .ph-iframe-container { display: none; width: 100%; margin-top: 10px; }
            .ph-card.expanded .ph-iframe-container { display: block; }
            iframe.ph-worker { width: 100%; height: 500px; border: 2px solid #4b5563; background: #fff; border-radius: 4px; }
        `;

        const style = document.createElement('style'); style.innerHTML = css; document.head.appendChild(style);

        const html = `
            <div id="ph-command-ui">
                <div class="ph-header">
                    <h1 class="ph-title">PH COMMAND CENTER v10</h1>
                    <button id="ph-btn-bootall" class="ph-btn-action red" style="width: auto; padding: 10px 20px;">⚡ BOOT ALL WORKERS</button>
                </div>
                
                <div class="ph-section-title">Automation Loops</div>
                <div class="ph-toggles-grid">
                    <div class="ph-toggle-card">
                        <button id="ph-btn-clicker" class="ph-btn-main">CLICKER</button>
                    </div>
                    <div class="ph-toggle-card">
                        <button id="ph-btn-hang" class="ph-btn-main">HANGMAN</button>
                    </div>
                    <div class="ph-toggle-card">
                        <button id="ph-btn-hol" class="ph-btn-main">HOL RNG</button>
                    </div>
                    <div class="ph-toggle-card">
                        <button id="ph-btn-rt" class="ph-btn-main">ROYAL TUNNEL</button>
                    </div>
                    <div class="ph-toggle-card">
                        <button id="ph-btn-hatch" class="ph-btn-main">HATCHER</button>
                        <button id="ph-btn-hatch-tgt" class="ph-btn-sub">TGT: LAB</button>
                    </div>
                    <div class="ph-toggle-card">
                        <button id="ph-btn-honey" class="ph-btn-main">HONEY TREE</button>
                        <button id="ph-btn-honey-type" class="ph-btn-sub">🍯 NORMAL</button>
                    </div>
                    <div class="ph-toggle-card">
                        <button id="ph-btn-berry" class="ph-btn-main">BERRY GARDEN</button>
                    </div>
                </div>

                <div class="ph-section-title">Manual Actions</div>
                <div class="ph-toggles-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                    <div class="ph-toggle-card"><button id="ph-btn-fish" class="ph-btn-action">🎣 CATCH FISH</button></div>
                    <div class="ph-toggle-card"><button id="ph-btn-slot" class="ph-btn-action purple">🎰 BLAST SLOT</button></div>
                </div>

                <div class="ph-section-title">Worker Modules</div>
                <div class="ph-modules-grid">
                    ${WORKERS.map(w => `
                        <div class="ph-module-card ph-card" id="card-${w.id}">
                            <div class="ph-module-header">
                                <h3 class="ph-module-title">${w.name}</h3>
                                <button class="ph-expand-btn frame-toggle" data-target="${w.id}">+</button>
                            </div>
                            <div id="status-${w.id}" class="ph-module-status">OFFLINE</div>
                            <button class="ph-power-btn power-btn" id="btn-power-${w.id}" data-target="${w.id}">BOOT</button>
                            <div class="ph-iframe-container" id="frame-container-${w.id}"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const div = document.createElement('div'); div.innerHTML = html; target.prepend(div);

        // Map Toggle Button Styling
        const setBtnStyle = (id, isActive, textBase) => {
            const btn = document.getElementById(id);
            btn.innerText = (isActive ? "STOP " : "START ") + textBase;
            if (isActive) {
                btn.classList.remove('st-on'); btn.classList.add('st-off');
            } else {
                btn.classList.remove('st-off'); btn.classList.add('st-on');
            }
        };

        // Initialize Toggle visual states
        setBtnStyle('ph-btn-clicker', localStorage.getItem('PH_CC_CLICKER_ACTIVE') === 'true', 'CLICKER');
        setBtnStyle('ph-btn-hang', localStorage.getItem('PH_CC_HANGMAN_ACTIVE') === 'true', 'HANGMAN');
        setBtnStyle('ph-btn-hol', localStorage.getItem('PH_CC_HOL_ACTIVE') === 'true', 'HOL RNG');
        setBtnStyle('ph-btn-rt', localStorage.getItem('RT_AutoRun') === 'true', 'TUNNEL');
        setBtnStyle('ph-btn-hatch', localStorage.getItem('PH_HATCH_LOOP_RUNNING') === 'true', 'HATCHER');
        setBtnStyle('ph-btn-honey', localStorage.getItem('PH_HT_RUNNING') === 'true', 'HONEY');
        setBtnStyle('ph-btn-berry', localStorage.getItem('PH_BL_RUN') === 'true', 'BERRY');

        // Initialize Sub-Toggles
        document.getElementById('ph-btn-hatch-tgt').innerText = localStorage.getItem('PH_HATCH_LOOP_TARGET') === 'grass' ? 'TGT: GRASS' : 'TGT: LAB';
        document.getElementById('ph-btn-honey-type').innerText = localStorage.getItem('PH_HT_TYPE') === 'super' ? '🍓 SUPER' : '🍯 NORMAL';

        // Toggles Handlers
        document.getElementById('ph-btn-clicker').onclick = () => { const c = localStorage.getItem('PH_CC_CLICKER_ACTIVE') === 'true'; localStorage.setItem('PH_CC_CLICKER_ACTIVE', !c); setBtnStyle('ph-btn-clicker', !c, 'CLICKER'); };
        document.getElementById('ph-btn-hang').onclick = () => { const c = localStorage.getItem('PH_CC_HANGMAN_ACTIVE') === 'true'; localStorage.setItem('PH_CC_HANGMAN_ACTIVE', !c); setBtnStyle('ph-btn-hang', !c, 'HANGMAN'); };
        document.getElementById('ph-btn-hol').onclick = () => { const c = localStorage.getItem('PH_CC_HOL_ACTIVE') === 'true'; localStorage.setItem('PH_CC_HOL_ACTIVE', !c); setBtnStyle('ph-btn-hol', !c, 'HOL RNG'); };
        document.getElementById('ph-btn-rt').onclick = () => { const c = localStorage.getItem('RT_AutoRun') === 'true'; localStorage.setItem('RT_AutoRun', !c); setBtnStyle('ph-btn-rt', !c, 'TUNNEL'); };
        document.getElementById('ph-btn-hatch').onclick = () => { const c = localStorage.getItem('PH_HATCH_LOOP_RUNNING') === 'true'; localStorage.setItem('PH_HATCH_LOOP_RUNNING', !c); setBtnStyle('ph-btn-hatch', !c, 'HATCHER'); };
        document.getElementById('ph-btn-honey').onclick = () => { const c = localStorage.getItem('PH_HT_RUNNING') === 'true'; localStorage.setItem('PH_HT_RUNNING', !c); setBtnStyle('ph-btn-honey', !c, 'HONEY'); };
        document.getElementById('ph-btn-berry').onclick = () => { const c = localStorage.getItem('PH_BL_RUN') === 'true'; localStorage.setItem('PH_BL_RUN', !c); setBtnStyle('ph-btn-berry', !c, 'BERRY'); };

        // Sub Toggle Controls
        document.getElementById('ph-btn-hatch-tgt').onclick = (e) => {
            const isLab = localStorage.getItem('PH_HATCH_LOOP_TARGET') !== 'grass';
            localStorage.setItem('PH_HATCH_LOOP_TARGET', isLab ? 'grass' : 'lab');
            e.target.innerText = isLab ? 'TGT: GRASS' : 'TGT: LAB';
        };

        document.getElementById('ph-btn-honey-type').onclick = (e) => {
            const isNorm = localStorage.getItem('PH_HT_TYPE') !== 'super';
            localStorage.setItem('PH_HT_TYPE', isNorm ? 'super' : 'normal');
            e.target.innerText = isNorm ? '🍓 SUPER' : '🍯 NORMAL';
        };

        // Action Command Buttons
        document.getElementById('ph-btn-fish').onclick = () => {
            const fishFrame = document.getElementById('w_fish');
            if (fishFrame && fishFrame.contentWindow) {
                fishFrame.contentWindow.postMessage({ type: 'FISH_CATCH' }, '*');
                const btn = document.getElementById('ph-btn-fish');
                btn.innerText = "Casting..."; setTimeout(() => btn.innerText = "🎣 CATCH FISH", 1500);
            } else alert("Boot up 'Easy Fish' frame first!");
        };

        document.getElementById('ph-btn-slot').onclick = () => {
            const slotFrame = document.getElementById('w_slot');
            if (slotFrame && slotFrame.contentWindow) {
                let countStr = prompt("How many MAX SPEED spins?", "100");
                let count = parseInt(countStr);
                if (!isNaN(count) && count > 0) slotFrame.contentWindow.postMessage({ type: 'SLOT_BLAST', count: count }, '*');
            } else alert("Boot up 'Turbo Slot' frame first!");
        };

        // Boot ALL
        document.getElementById('ph-btn-bootall').onclick = () => {
            WORKERS.forEach(w => {
                const existingFrame = document.getElementById(w.id);
                if (!existingFrame) toggleWorker(w);
            });
        };

        // Power Buttons (Boot/Kill)
        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.target.getAttribute('data-target');
                const workerObj = WORKERS.find(w => w.id === id);
                if (workerObj) toggleWorker(workerObj);
            };
        });

        // Card Expansion Toggles (+)
        document.querySelectorAll('.frame-toggle').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.target.getAttribute('data-target');
                const card = document.getElementById(`card-${id}`);
                card.classList.toggle('expanded');
                e.target.innerText = card.classList.contains('expanded') ? '-' : '+';
            };
        });

        // Status Updates Message Listener
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'STATUS') {
                const el = document.getElementById(`status-${event.data.id}`);
                if (el) {
                    el.innerText = event.data.msg;
                    if (event.data.msg.includes('PAUSED') || event.data.msg.includes('Out of')) el.style.color = '#ef4444';
                    else if (event.data.msg.includes('Running') || event.data.msg.includes('Active') || event.data.msg.includes('Found!')) el.style.color = '#10b981';
                    else if (event.data.msg.includes('Sleep') || event.data.msg.includes('Wait') || event.data.msg.includes('Idle')) el.style.color = '#6b7280'; // Gray for sleeping
                    else el.style.color = '#60a5fa'; 
                }
            }
        });
    }

    initCommandCenter();

})();