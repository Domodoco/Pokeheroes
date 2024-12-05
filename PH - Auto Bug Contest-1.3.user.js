// ==UserScript==
// @name         PH - Auto Bug Contest
// @namespace    https://github.com/warpKaiba
// @version      1.3
// @description  try to take over the world!
// @author       Kaiba
// @match        http*://pokeheroes.com/bugcontest*
// @grant        GM.xmlHttpRequest
// @connect      pokeheroes.com
// @connect      staticpokeheroes.com
// @downloadURL  https://github.com/warpKaiba/TMpokeheroes/raw/master/PHAutoBugContest.user.js
// @icon         https://vignette.wikia.nocookie.net/pkmnshuffle/images/7/7f/Ducklett.png/revision/latest?cb=20170409032016
// ==/UserScript==

// This script needs GM.xmlHttpRequest to break CORS so it can get the URL of the pokemon sprites that spawn in the game
// The sprites are loaded in through a redirect link to obscure their pokedex number.
// Using GM.xmlHttpRequest lets it follow the redirect and get the actual URL of the sprite, which has the pkdx number in it
// Normally, since the sprites are hosted on a different domain, your browser would prevent this from happening
// because being able to send requests to a different domain can open security holes. Don't worry though, this script
// ONLY opens a tunnel between pokeheroes.com (domain of the obscured URLs) and staticpokeheroes.com (the real URLs)

// The reason why this needs to be done is the pokedex number is needed to check if its a bug type.

checkCoordinates = function checkCoordinates(x, y) {return true;} // rewrites the onsite function so pokemon can pile up quicker
var activePokemons = $(".innerpkmn").not("[style*=display]").not("[style*='margin-left: -100px']") //this is every pokemon sprite that is currently visible
var pokeImage;
var previousPoke;
var pre
bugTime = 59;

$("[src*=square\\/bug\\/grass]").detach() //gets rid of grass sprites
$("#bugMiniGame").attr("style", "position: relative; width: 600px; height: 800px; border: 2px solid darkgreen; overflow: hidden") // make the playable area BIG

clockBugGame = function clockBugGame() { // rewrites another onsite function to aid in piling
    bugTime--;
    $("#bugMiniGame .bugTimeCounter").text(bugTime);
    $("#bugPkmnContainer .innerpkmn").each(function() {
        $(this).attr('data-ttl', $(this).attr('data-ttl') - 1);
        if ($(this).attr('data-ttl') <= 0) {
            $(this).fadeOut(600);
        }
    });

    var add = 10;
    if (bugTime <= 60)
        add = 10;

    for (var i = 0; i < add; i++) {
        var left, top;
        do {
            left = Math.random() * 500;
            top = Math.random() * 700;
        } while (!checkCoordinates(left, top));
        $("#bugPkmnContainer .pkmn"+bugPkmnArr[0]).css('margin-left', left + 'px').css('margin-top', top+'px').attr('data-ttl', Math.floor(Math.random() * 3 + 2));
        bugPkmnArr.shift();
    }

    if (bugTime == 0) {
        window.clearInterval(bugGameClock);
        endBugGame();
    }
}



var preBuggyInterval = setInterval(function(){
    $(".innerpkmn").attr("data-ttl", 100)
    activePokemons = $(".innerpkmn").not("[style*=display]").not("[style*='margin-left: -100px']") // refresh the list of visible pokemon
    if (activePokemons.length > 0 && activePokemons[0] != previousPoke) { // if the game is loaded and we haven't checked the pokemon type yet ..
        previousPoke = activePokemons[0]
        pokeImage = activePokemons[0].firstChild.src
        getRealId(pokeImage, activePokemons[0]) // run the getRealId function below
    }
    if (activePokemons.length > 0) {
        bugTime = 5 // the time will always be 59 seconds until there are no pokemon left
    }
}, 100)


function getRealId(img, obj) {
    GM.xmlHttpRequest({
        method: "GET",
        url: img,
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/xml"
        },
        onload: function(response) {
            let realIdMatch = response.finalUrl.match(/[?&]c=(\d+)/);
            if (!realIdMatch) {
                console.error("Failed to extract realId from URL:", response.finalUrl);
                return;
            }
            let realId = realIdMatch[1];
            console.log("Extracted Real ID:", realId);

            if (parseInt(realId) === 413 || parseInt(realId) === 412) {
                obj.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                console.log("Bug Pokémon (Burmy/Wormadam) clicked!");
                return;
            }

            let csrfToken = $('meta[name="csrf-token"]').attr('content'); // Update if necessary
            console.log("Sending AJAX request with pkdxnr:", realId);

            $.ajax({
                type: "POST",
                url: "includes/ajax/pokedex/view_entry.php",
                data: {
                    'pkdxnr': realId,
                    'security_token': csrfToken // Include CSRF token if required
                },
                success: function(data) {
                    console.log("Pokedex Data:", data);

                    let pkdxType1 = data.split('type_icons/')[1]?.split('">')[0];
                    let pkdxType2 = data.split('type_icons/')[2]?.split('">')[0] || "";

                    if (pkdxType1?.includes("bug.gif") || pkdxType2?.includes("bug.gif")) {
                        console.log("Bug Pokémon Found:", obj);
                        obj.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    } else {
                        obj.style = "display: none";
                        console.log("Not a bug Pokémon, hidden:", obj);
                    }
                },
                error: function(xhr, status, error) {
                    console.error("AJAX Error:", status, error, "for Real ID:", realId);
                    if (xhr.status === 500) {
                        console.warn("Retrying request for Real ID:", realId);
                        setTimeout(() => getRealId(img, obj), 1000); // Retry after 1 second
                    }
                }
            });
        }
    });
}
