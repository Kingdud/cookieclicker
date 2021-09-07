// ==UserScript==
// @name         Cookiebot
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automates various things. For me, the fun is in automating the game, not playing it.
// @author       Kingdud
// @match        https://orteil.dashnet.org/cookieclicker/
// @grant        none
// ==/UserScript==

/*
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
Startup
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
*/
//Used to make certain functions callable from the otuside world.
window.MCCH = {}

window.MCCH.auto_clicker_is_on = false
window.MCCH.auto_pantheon_is_on = false
window.MCCH.auto_shimmer_is_on = false
window.MCCH.auto_seasons_is_on = false
window.MCCH.auto_ticker_is_on = false
window.MCCH.auto_upgrade_is_on = false
window.MCCH.auto_wrinkler_is_on = false
var orig_game_volume = 50

var do_startup = setInterval(function() {
    if(Game) {
        window.MCCH.auto_shimmer_is_on = true
        window.MCCH.auto_wrinkler_is_on = true
        window.MCCH.auto_ticker_is_on = true
        window.MCCH.auto_seasons_is_on = true
        window.MCCH.doAscendStep2()
        clearInterval(do_startup)
        orig_game_volume = 50
    }
}, 300)

/*
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
Sandbox
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
*/
function testing() {
    for (const idx in Game.UpgradesById) {
        if (Game.UpgradesById[idx].pool != "cookie" && Game.UpgradesById[idx].desc.indexOf("are <b>twice</b> as") == -1) {
            console.log(`${idx} || ${Game.UpgradesById[idx].name} || ${Game.UpgradesById[idx].desc}`)
        }
    }
}

/*
Cereals || 0
Chocolate || 1
Butter || 2
Sugar || 3
Nuts || 4
Salt || 5
Vanilla || 6
Eggs || 7
Cinnamon || 8
Cream || 9
Jam || 10
White chocolate || 11
Honey || 12
Cookies || 13
Recipes || 14
Subsidiaries || 15
*/
function debugStockSweep() {
    var d_start = -0.1,
        rnd_val = 1,
        probability = .51,
        mode = 4,
        good_to_sim = 3;
    console.log(`Settings Good: ${Game.Objects['Bank'].minigame.goodsById[good_to_sim].name}, ` +
                `initial_d ${d_start}, rnd_val ${rnd_val}, probab ${probability}, mode ${mode}`)
    console.log("initial_val, val, initial_d, d, mode")
    for( var i = 1; i < 200; ++i) {
        debugStock(i, d_start, rnd_val, probability, mode, good_to_sim)
    }
}

//Probability breakpoints: 3% (mode 3), 10%, 20%, 30% (modes 3 & 4), 50% (mode 5)
function debugStock(initial_val, initial_d, rnd_val, probability, initial_mode, i) {
    var M = Game.Objects['Bank'].minigame
//    for (var i=0;i<M.goodsById.length;i++)
//    {
        var me=M.goodsById[i];
        //me.last=0;
		var d = initial_d
		var val = initial_val
		var mode = initial_mode

        //From the reset function, we know that d starts off between -.1 and +.1

        //d moved closer to 0 by 3%
        d*=0.97;

        //Stable mode, d moved closer to 0 by 5%, then +- .025
        if (mode==0) {d*=0.95;d+=0.05*(rnd_val-0.5);}
        //Slow rise: d moved cloer to 0 by 1%, then -0.005 to +0.045
        else if (mode==1) {d*=0.99;d+=0.05*(rnd_val-0.1);}
        //Slow fall: d moved cloer to 0 by 1%, then +0.005 to -0.045
        else if (mode==2) {d*=0.99;d-=0.05*(rnd_val-0.1);}
        //Fast Rise: d -0.015 to +.135 || val +0 to +1
        else if (mode==3) {d+=0.15*(rnd_val-0.1);val+=rnd_val;}
        //Fast fall: d +0.015 to -.135 || val -0 to -1
        else if (mode==4) {d-=0.15*(rnd_val-0.1);val-=rnd_val;}
        //Chaos: d +- .15
        else if (mode==5) d+=0.3*(rnd_val-0.5);

        //Brings value closer to 0 by 2% of the difference between the current value and the resting val.
        val+=(M.getRestingVal(me.id)-val)*0.02;
        //+- 0.2
        val+=(rnd_val-0.5)*0.4;
        //d +- .05
        d+=0.1*(rnd_val-0.5);
        //10% chance of val +- 1.5
        if (probability<0.1) val+=(rnd_val-0.5)*3;
        //10% chance of d +- .15
        if (probability<0.1) d+=(rnd_val-0.5)*0.3;
        if (mode==5)
        {
            //In Chaos mode, 50% chance of value +- 5
            if (probability<0.5) val+=(rnd_val-0.5)*10;
            //In Chaos mode, 20% chance of d +- .1
            if (probability<0.2) d=(rnd_val-0.5)*2;
        }
        //If fast rising, 30% chance val changed by -7 to +3 || d +- .05
        if (mode==3 && probability<0.3) {d+=(rnd_val-0.5)*0.1;val+=(rnd_val-0.7)*10;}
        //In fast rising, 3% chance of jumping straight to fast-fall mode, regardless of time.
        if (mode==3 && probability<0.03) {mode=4;}
        //In fast fall, 30% chance val changed by -3 to +7 || d +- .05
        if (mode==4 && probability<0.3) {d+=(rnd_val-0.5)*0.1;val+=(rnd_val-0.3)*10;}

        //Does not change val || At lvl 1 bank, if val > 100 && d > 0, d brought 10% closer to 0.
        //Net effect: goods worth > 100 each change price slower than those < 100.
        if (val>(100+(Game.Objects['Bank'].level-1)*3) && d>0) d*=0.9;

        /* Summary of changes to val and d at this point:
        Stable mode: d
        Slow rise mode: d
        Slow fall mode: d
        Fast rise mode: d
        Fast fall mode: d
        Chaos mode: d
        */

		//console.log(`${initial_val}, ${val}, ${initial_d}, ${d}, ${mode}`)

        val+=d;

        if (val<5) val+=(5-val)*0.5;
        if (val<5 && d<0) d*=0.95;
        val=Math.max(val,1);

		console.log(`${initial_val}, ${val}, ${initial_d}, ${d}, ${mode}`)
    //}
}

//function choose(arr) {return arr[Math.floor(Math.random()*arr.length)];}

//Probability breakpoints: 3% (mode 3), 10%, 20%, 30% (modes 3 & 4), 50% (mode 5)
window.MCCH["doStockSim"] = function stockMarketSim() {
    var M = Game.Objects['Bank'].minigame
    for (var i=0;i<M.goodsById.length;i++)
    {
        var me=M.goodsById[i];
        me.last=0;

        //From the reset function, we know that d starts off between -.1 and +.1

        //d moved closer to 0 by 3%
        me.d*=0.97;

        //Stable mode, d moved closer to 0 by 5%, then +- .025
        if (me.mode==0) {me.d*=0.95;me.d+=0.05*(Math.random()-0.5);}
        //Slow rise: d moved cloer to 0 by 1%, then -0.005 to +0.045
        else if (me.mode==1) {me.d*=0.99;me.d+=0.05*(Math.random()-0.1);}
        //Slow fall: d moved cloer to 0 by 1%, then +0.005 to -0.045
        else if (me.mode==2) {me.d*=0.99;me.d-=0.05*(Math.random()-0.1);}
        //Fast Rise: d -0.015 to +.135 || val +0 to +1
        else if (me.mode==3) {me.d+=0.15*(Math.random()-0.1);me.val+=Math.random();}
        //Fast fall: d +0.015 to -.135 || val -0 to -1
        else if (me.mode==4) {me.d-=0.15*(Math.random()-0.1);me.val-=Math.random();}
        //Chaos: d +- .15
        else if (me.mode==5) me.d+=0.3*(Math.random()-0.5);

        //Brings value closer to 0 by 2% of the difference between the current value and the resting val.
        me.val+=(M.getRestingVal(me.id)-me.val)*0.02;
        //+- 0.2
        me.val+=(Math.random()-0.5)*0.4;
        //d +- .05
        me.d+=0.1*(Math.random()-0.5);
        //10% chance of val +- 1.5
        if (Math.random()<0.1) me.val+=(Math.random()-0.5)*3;
        //10% chance of d +- .15
        if (Math.random()<0.1) me.d+=(Math.random()-0.5)*0.3;
        if (me.mode==5)
        {
            //In Chaos mode, 50% chance of value +- 5
            if (Math.random()<0.5) me.val+=(Math.random()-0.5)*10;
            //In Chaos mode, 20% chance of d +- .1
            if (Math.random()<0.2) me.d=(Math.random()-0.5)*2;
        }
        //If fast rising, 30% chance val changed by -7 to +3 || d +- .05
        if (me.mode==3 && Math.random()<0.3) {me.d+=(Math.random()-0.5)*0.1;me.val+=(Math.random()-0.7)*10;}
        //In fast rising, 3% chance of jumping straight to fast-fall mode, regardless of time.
        if (me.mode==3 && Math.random()<0.03) {me.mode=4;}
        //In fast fall, 30% chance val changed by -3 to +7 || d +- .05
        if (me.mode==4 && Math.random()<0.3) {me.d+=(Math.random()-0.5)*0.1;me.val+=(Math.random()-0.3)*10;}

        //Does not change val || At lvl 1 bank, if val > 100 && d > 0, d brought 10% closer to 0.
        //Net effect: goods worth > 100 each change price slower than those < 100.
        if (me.val>(100+(Game.Objects['Bank'].level-1)*3) && me.d>0) me.d*=0.9;

        /* Summary of changes to val and d at this point:
        Stable mode: d
        Slow rise mode: d
        Slow fall mode: d
        Fast rise mode: d
        Fast fall mode: d
        Chaos mode: d
        */

        me.val+=me.d;

        /*Goods under $5 will be moved closer to $5 by 50% of the difference in
           their current value from $5. (IE: $1 good is $4 off $5, so 50% of $4 = $2
         thus, new value == $1 + $2 = $3.
        */
        if (me.val<5) me.val+=(5-me.val)*0.5;
        /*
        If the value is STILL under $5 (and it always will be if it was under $5 above)
         and d is negative, d is brought closer to 0 by 5%. This only effects the next call
         of the function.
        */
        if (me.val<5 && me.d<0) me.d*=0.95;
        //Good cannot go below $1
        me.val=Math.max(me.val,1);

        //These update the graph data
        me.vals.unshift(me.val);
        if (me.vals.length>65) me.vals.pop();

        me.dur--;
        //if (Math.random()<1/me.dur)
        if (me.dur<=0)
        {
            //10 + 0-990 == 10-1000 minutes for this mode.
            me.dur=Math.floor(10+Math.random()*990);
            //70% chance to enter chaos after fast rise/fall.
            if (Math.random()<0.7 && (me.mode==3 || me.mode==4)) me.mode=5;
            //Choose picks a random number between 0 and array length and returns the value in the array
            // at that position.
            //Translates roughly to: mode 0/3/4/5 (12.5%), mode 1/2 (25%)
            //minigame.reset() uses the same probability matrix.
            else me.mode=choose([0,1,1,2,2,3,4,5]);
        }
    }
    M.checkGraphScale();
    M.toRedraw=Math.max(M.toRedraw,1);
    M.ticks++;
}

function autoStockMarket() {
    //Game.Objects["Bank"].minigame.goodsById[3].d
    //Game.Objects["Bank"].minigame.goodsById[idx].mode
    //mode: ['stable','slow rise','slow fall','fast rise','fast fall','chaotic']

    //Nuts
   /* if(Game.Objects["Bank"].minigame.goodsById[4].val > 10){
        Game.Objects["Bank"].minigame.sellGood(4, 10000)
    }
    if(Game.Objects["Bank"].minigame.goodsById[4].val < 4.5){
        Game.Objects["Bank"].minigame.buyGood(4, 10000)
    }*/
}

/*
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
Utility functions
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
*/
function computeActualSucked(b4_sucked, wrinkler_type) {
    var toSuck=1.1;
    if (Game.Has('Sacrilegious corruption')) toSuck*=1.05;
    if (wrinkler_type==1) toSuck*=3;//shiny wrinklers are an elusive, profitable breed
    b4_sucked*=toSuck;//cookie dough does weird things inside wrinkler digestive tracts
    if (Game.Has('Wrinklerspawn')) b4_sucked*=1.05;
    if (Game.hasGod)
    {
        var godLvl=Game.hasGod('scorn');
        if (godLvl==1) b4_sucked*=1.15;
        else if (godLvl==2) b4_sucked*=1.1;
        else if (godLvl==3) b4_sucked*=1.05;
    }
    return b4_sucked
}

/*
Post-ascend layout: slot 1 = Radiant Appetite, slot 2 = Dragonflight
Pre-ascend layout: slot 1 = Radiant Appetite, slot 2 = Earth Shatter
*/
function configureDragon(is_post_ascend, is_pre_ascend) {
    //We are about to ascend, swap auras.
    if (is_pre_ascend) {
        Game.SetDragonAura(5, 1)
        Game.ConfirmPrompt()
        //needed to fix gfx.
        Game.specialTab = "dragon"
        Game.ToggleSpecialMenu(0)
    }
    //We just came out of the ascend screen and it's a fresh game. Setup dragon.
    if (is_post_ascend) {
        //Step 1, buy 100 of everything.
        if(Game.dragonLevel < 23) {
            for (const name in Game.Objects) {
                if (Game.Objects[name].amount < 100) {
                    Game.Objects[name].buy(100-Game.Objects[name].amount)
                }
            }
            for (var i = Game.dragonLevel; i < 24; ++i) {
                if (Game.dragonLevels[Game.dragonLevel].cost()) {
                    Game.dragonLevels[Game.dragonLevel].buy();
                    ++Game.dragonLevel
                } else {
                    break
                }
            }
        } else if(Game.dragonLevel == 23) {
            //Step 2, buy 50 of everything
            for (const name in Game.Objects) {
                if (Game.Objects[name].amount < 50) {
                    Game.Objects[name].buy(50-Game.Objects[name].amount)
                }
            }
            if (Game.dragonLevels[Game.dragonLevel].cost()) {
                Game.dragonLevels[Game.dragonLevel].buy();
                ++Game.dragonLevel
            }
        } else if(Game.dragonLevel == 24) {
            //Step 3, buy 200 of everything
            for (const name in Game.Objects) {
                if (Game.Objects[name].amount < 200) {
                    Game.Objects[name].buy(200-Game.Objects[name].amount)
                }
            }
            if (Game.dragonLevels[Game.dragonLevel].cost()) {
                Game.dragonLevels[Game.dragonLevel].buy();
                ++Game.dragonLevel
            }
        } else if(Game.dragonLevel == 25) {
            //Step 4, set auras
            Game.Objects["Idleverse"].buy(2-Game.Objects["Idleverse"].amount)
            if (Game.Objects["Idleverse"].amount < 2) {
                return;
            } else {
                Game.SetDragonAura(15, 0)
                Game.ConfirmPrompt()
                Game.SetDragonAura(10, 1)
                Game.ConfirmPrompt()
                //needed to fix gfx.
                Game.specialTab = "dragon"
                Game.ToggleSpecialMenu(0)
                doAscendStep2_state = 1
            }
        }
    }
}

function determineCookieUpgradeCpdollar(upgrade_object) {
    if (upgrade_object.pool == "toggle") {
        return Number.MAX_VALUE
    }
    //For some reason, upgrades don't clear the store list when bought immediately.
    if (upgrade_object.bought == 1) {
        return Number.MAX_VALUE
    }
    var dollars_per_cookie = 0
    //Tooltip for this cookie is different.
    if (upgrade_object.name == "Birthday cookie") {
        const upgrade_amt = upgrade_object.desc.split("%")[1].split('+')[1]
        const cps_now = Game.cookiesPs
        const cps_after = Game.cookiesPs * (1 + upgrade_amt / 100)
        dollars_per_cookie = upgrade_object.basePrice / (cps_after - cps_now)
        return dollars_per_cookie
    }
    if (upgrade_object.pool == "cookie" && upgrade_object.name != "Green Yeast Digestives") {
        const upgrade_amt = upgrade_object.desc.split("%")[0].split("+")[1]
        const cps_now = Game.cookiesPs
        const cps_after = Game.cookiesPs * (1 + upgrade_amt / 100)
        dollars_per_cookie = upgrade_object.basePrice / (cps_after - cps_now)
        return dollars_per_cookie
    } else {
        return upgrade_object.basePrice
    }
}

function doSantaUpgrade() {
    if (Game.santaLevel < 14 && Game.season == "christmas") {
        Game.UpgradeSanta()
        return false
    } else {
        //Not a typo; upgrading santa (visually) breaks the dragon somehow.
        Game.specialTab = "dragon"
        Game.ToggleSpecialMenu(0)
        return true
    }
}

function findBestUpgrade() {
    const dollars_per_cookie = Object()
    var min_name = ""
    var min_cost = Number.MAX_VALUE
    var min_cookie_upg_idx = 0
    var min_cookie_upg_cost = Number.MAX_VALUE
    var min_bld_upg_idx = 0
    var min_bld_upg_cost = Number.MAX_VALUE

    //Buy upgrades before buildings
    for (var i = Game.UpgradesInStore.length - 1; i >= 0; i--) {
        if (Game.UpgradesInStore[i].name == "Communal brainsweep" ||
            Game.UpgradesInStore[i].name == "Milk selector" ||
            Game.UpgradesInStore[i].name == "Chocolate egg") {
            continue
        }
        var dollars_per_cookie_upgrade = determineCookieUpgradeCpdollar(Game.UpgradesInStore[i])
        if (min_cookie_upg_cost > dollars_per_cookie_upgrade) {
            min_cookie_upg_idx = i
            min_cookie_upg_cost = dollars_per_cookie_upgrade
        }
        if (Game.UpgradesInStore[i].canBuy() && dollars_per_cookie_upgrade != Number.MAX_VALUE) {
            //&& Game.edlerWrath != 0
            if (Game.UpgradesInStore[i].pool != "toggle" && Game.UpgradesInStore[i].pool != "cookie") {
                Game.UpgradesInStore[i].buy();
                if (Game.UpgradesInStore[i].name == "One mind") {
                    Game.ConfirmPrompt()
                }
                return true
            }
        }
    }

    //Calculate building stats using new upgrade values.
    for (const name in Game.Objects) {
        dollars_per_cookie[name] = Game.Objects[name].price / (Game.Objects[name].storedCps * Game.globalCpsMult)
        if (dollars_per_cookie[name] < min_cost) {
            min_cost = dollars_per_cookie[name];
            min_name = name;
        }
    }

    //Determine whether to buy a building or a cookie upgrade.
    if (min_cookie_upg_cost != Number.MAX_VALUE) {
        //Cookie upgrade is best bang for buck, so buy/save for that!
        if ( min_cookie_upg_cost < min_cost) {
            if (Game.UpgradesInStore[min_cookie_upg_idx].canBuy()) {
                Game.UpgradesInStore[min_cookie_upg_idx].buy();
                return true
            }
        } else {
            //Buy buildings with whatever's left. No canBuy() function for buildings.
            if (Game.cookies > Game.Objects[min_name].price) {
                Game.Objects[min_name].buy(1);
                return true
            }
        }
    } else {
        //Buy buildings with whatever's left.
        if (Game.cookies > Game.Objects[min_name].price) {
            Game.Objects[min_name].buy(1);
            return true
        }
    }
    return false
}

function handleGodBoostedClickFrenzy() {
    Game.setVolume(0)
    //25% more income from sold buildings.
    Game.SetDragonAura(5, 1)
    Game.ConfirmPrompt()
    //needed to fix gfx.
    Game.specialTab = "dragon"
    Game.ToggleSpecialMenu(0)

    for (const name in Game.Objects) {
        //Save mana
        if(name == "Wizard tower") { continue; }
        Game.Objects[name].sell(Game.Objects[name].amount-1)
    }
    //Immediately re-buy buildings.
    Game.buyMode = 1
    Game.buyBulk = 100
    var found_upgrade = findBestUpgrade()
    while (found_upgrade) {
        found_upgrade = findBestUpgrade()
    }

    //Buffed click frenzy & Dragonflight lasts long enough that we can actually get 2 sell and rebuy rotations off in 10 seconds.
    if (("Click frenzy" in Game.buffs && Game.buffs["Click frenzy"].time / Game.fps > 10) ||
        ("Dragonflight" in Game.buffs && Game.buffs["Dragonflight"].time / Game.fps > 10)) {
        setTimeout(function() {
            for (const name in Game.Objects) {
                //Save mana
                if(name == "Wizard tower") { continue; }
                Game.Objects[name].sell(Game.Objects[name].amount-1)
            }
            //Immediately re-buy buildings.
            Game.buyMode = 1
            Game.buyBulk = 100
            var found_upgrade = findBestUpgrade()
            while (found_upgrade) {
                found_upgrade = findBestUpgrade()
            }
            Game.buyBulk = 1
            Game.SetDragonAura(10, 1)
            Game.ConfirmPrompt()
            //needed to fix gfx.
            Game.specialTab = "dragon"
            Game.ToggleSpecialMenu(0)

            Game.setVolume(orig_game_volume)
        }, 9900)
    } else {
        Game.buyBulk = 1
        //autoUpgrade will handle the rest of leveling.
        //Fix dragon.
        Game.SetDragonAura(10, 1)
        Game.ConfirmPrompt()
        //needed to fix gfx.
        Game.specialTab = "dragon"
        Game.ToggleSpecialMenu(0)

        Game.setVolume(orig_game_volume)
    }
}

//Game.goldenCookieChoices ; first name in pair is the name to put in here.
function optimalGrimoire() {
    //Game.elderWrath
    const pantheon = Game.Objects.Temple.minigame
    const grimoire = Game.Objects["Wizard tower"].minigame
    const expexted_diamond = 'Godzamok, Spirit of Ruin'

    //The pattern below has been tested and *does* yield a higher # of buildings after.
    if (pantheon.godsById[pantheon.slot[0]].name == expexted_diamond &&
        ("Dragonflight" in Game.buffs || "Click frenzy" in Game.buffs) &&
        "Frenzy" in Game.buffs)
    {
        handleGodBoostedClickFrenzy()
    }
    if ("Elder frenzy" in Game.buffs && "Frenzy" in Game.buffs) {
        setTimeout(function(){grimoire.castSpell(grimoire.spells["conjure baked goods"])}, 100)
    }
    const magic_pct = Game.Objects["Wizard tower"].minigame.magic / Game.Objects["Wizard tower"].minigame.magicM
    if ("Frenzy" in Game.buffs && magic_pct > 0.8) {
        setTimeout(function(){grimoire.castSpell(grimoire.spells["hand of fate"])}, 100)
    }
}

function popAllWrinklers() {
    for (var i in Game.wrinklers) {
        if (Game.wrinklers[i].close == 1) {
            Game.wrinklers[i].hp = 0
        }
    }
}

function sellAllBuildings() {
    //Sell lowest to highest CPS.
    for (const name in Game.Objects) {
        Game.Objects[name].sell(Game.Objects[name].amount-1)
    }
}

/*
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
Ascension Handlers
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
*/
//Stuff to do before we ascend.
var doAscendStep1_state = 0
var doAscendStep1_ref = 0
window.MCCH["prepForAscend"] = function doAscendStep1() {
    Game.setVolume(0)

    //Stop autoupgrade.
    window.MCCH.auto_upgrade_is_on = false
    window.MCCH.auto_pantheon_is_on = false

    //Now generate as much cash in the bank as we can.
    configureDragon(false, true)
    sellAllBuildings()

    //Confirmed via testing: swapping out Godz does not remove his buff, it only prevents gaining a new version.
    pantheon_state = 99
    autoPantheon(true)

    //It's actually fine to let shimmers keep getting popped.
    //no reason to stop popping wrinklers.
    popAllWrinklers()
    //Buy Chocolate Egg, if we can.
    if (Game.Upgrades["Chocolate egg"].unlocked == 1 && Game.Upgrades["Chocolate egg"].canBuy()) {
        Game.Upgrades["Chocolate egg"].buy();
    }
    //Game.storeBuyAll()
    Game.buyMode = 1
    Game.buyBulk = 100
    var found_upgrade = findBestUpgrade()
    while (found_upgrade) {
        found_upgrade = findBestUpgrade()
    }
    //re-enable autoupgrade
    window.MCCH.auto_upgrade_is_on = true
    Game.buyBulk = 1
    Game.setVolume(orig_game_volume)
    //Now we want to stop our other scripts, after we spend 10 seconds clicking!
    setTimeout(function() {
        window.MCCH.auto_clicker_is_on = false
        window.MCCH.auto_upgrade_is_on = false
        doAscendStep2_state = 0
        pantheon_state = 0
        Game.WriteSave()
        Game.Ascend()
    }, 10000)
}

var doAscendStep2_state = 0

//Once we leave the ascend screen, call this function to get the game rolling again.
window.MCCH["doAscendStep2"] = function doAscendStep2() {
    Game.setVolume(0)

    Game.Upgrades["Heavenly chip secret"].buy()
    var auto_store = setInterval(function() { Game.storeBuyAll(); }, 1000)
    window.MCCH.auto_clicker_is_on = true
    //May have been disaled while ascending.
    window.MCCH.auto_pantheon_is_on = true

    var fresh_start_interval = setInterval(function() {
        //We *should* be good to go at this point.
        configureDragon(true, false)

        if(doAscendStep2_state == 1) {
            clearInterval(auto_store)
            window.MCCH.auto_upgrade_is_on = true
            Game.ToggleSpecialMenu(0)
            clearInterval(fresh_start_interval)

            Game.setVolume(orig_game_volume)
        }
    }, 1000)
}

/*
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
Interval functions
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
*/

var pantheon_state = 0
function autoPantheon(override = false) {
    /*Plan for active games:
    1. Game starts / post ascension / etc.
    2. Slot Mokalsium into Ruby, wait 1 hour
    3. Slot Godzamuk in Diamond
    4. Slot Muridal in Jade
    The reason is because Mok gives a bonus immediately, but we will only need
     the bonus from Godz later. Also, Mok gives superior CPS to Muridal in all cases.
    We wait 1 hour after slotting Mok so we get 1 extra swap, which we need for ascending.
    For ascending:
    1. Swap Godz for Skruuia
    2. Pop all wrinklers.
    */
    if(! window.MCCH.auto_pantheon_is_on && ! override) { return; }

    const pantheon = Game.Objects.Temple.minigame
    const mokal = "mother"
    const godz = "ruin"
    const muri = "labor"
    const skruu = "scorn"
    var god_to_move;

    if(pantheon_state == 0) {
        //Mokal to Ruby then wait 1 hour.
        god_to_move = pantheon.gods[mokal]
        //if god is already set, move on
        if(pantheon.slot[1] == god_to_move.id) {
            pantheon_state = 2
        } else {
            pantheon.dragGod(god_to_move)
            pantheon.slotHovered = 1
            pantheon.dropGod()
            pantheon_state = 1
            //Cooldown is one hour, add 5 extra seconds for safety.
            setTimeout(function() { pantheon_state = 2 }, 3605*1000)
        }
    }
    if(pantheon_state == 2) {
        //Slot Godz to Diamond
        god_to_move = pantheon.gods[godz]
        if(pantheon.slot[0] != god_to_move.id) {
            pantheon.dragGod(god_to_move)
            pantheon.slotHovered = 0
            pantheon.dropGod()
        }
        pantheon_state = 3
    }
    if(pantheon_state == 3) {
        //Slot Muri to Jade
        god_to_move = pantheon.gods[muri]
        if(pantheon.slot[2] != god_to_move.id) {
            pantheon.dragGod(god_to_move)
            pantheon.slotHovered = 2
            pantheon.dropGod()
        }
        pantheon_state = 4
    }
    if(pantheon_state == 99) {
        //Swap Godz for Skruu in Diamond
        god_to_move = pantheon.gods[skruu]
        pantheon.dragGod(god_to_move)
        pantheon.slotHovered = 0
        pantheon.dropGod()
        pantheon_state = 100
    }
}

function autoSeasons() {
    if(! window.MCCH.auto_seasons_is_on) { return; }

    //List in order we want to go through seasons in
    var count_of_easter_eggs = Game.GetHowManyEggs()
    if (Game.Upgrades["Chocolate egg"].unlocked) {
        ++count_of_easter_eggs
    }

    //Valentines day
    if(Game.GetHowManyHeartDrops() != Game.heartDrops.length) {
        if(Game.Upgrades["Lovesick biscuit"].canBuy() && Game.season != "valentines") {
            Game.Upgrades["Lovesick biscuit"].buy()
        }
    //Christmas
    } else if(Game.GetHowManyReindeerDrops() != Game.reindeerDrops.length) {
        if(Game.Upgrades["Festive biscuit"].canBuy() && Game.season != "christmas") {
            Game.Upgrades["Festive biscuit"].buy()
        }
        var buy_christmas_upgrades = setInterval(function() {
            for (var i = Game.santaLevel; i < 14; ++i) {
                doSantaUpgrade()
            }
            Game.specialTab = "dragon"
            Game.ToggleSpecialMenu(0)
            for (const idx in Game.santaDrops) {
                const name = Game.santaDrops[idx]
                if(Game.Upgrades[name].unlocked == 1 && Game.Upgrades[name].canBuy()) {
                    Game.Upgrades[name].buy()
                }
            }
            if(Game.GetHowManySantaDrops() == Game.santaDrops.length) {
                clearInterval(buy_christmas_upgrades)
            }
        }, 1000)
    //Halloween
    } else if(Game.GetHowManyHalloweenDrops() != Game.halloweenDrops.length){
        if(Game.Upgrades["Ghostly biscuit"].canBuy() && Game.season != "halloween") {
            Game.Upgrades["Ghostly biscuit"].buy()
        }
    //Easter
    } else if(count_of_easter_eggs != Game.easterEggs.length) {
        if(Game.Upgrades["Bunny biscuit"].canBuy() && Game.season != "easter") {
            Game.Upgrades["Bunny biscuit"].buy()
        }
    } else if(Game.season != "fools"){
        Game.Upgrades["Fool's biscuit"].buy()
    }
}

function autoShimmer() {
    if(! window.MCCH.auto_shimmer_is_on) { return; }

    const pantheon = Game.Objects.Temple.minigame
    const bad_god = "Skruuia, Spirit of Scorn"

    //Skruuia makes all cookies wrath cookies. Don't click!
    for(var i = 0; i < pantheon.slot.length; ++i) {
        if (pantheon.slot[i] != -1 && pantheon.godsById[pantheon.slot[i]].name == bad_god) {
            return;
        }
    }

    Game.shimmers.forEach(function(shimmer) {
        //Only pop wrath cookies when we are in stage 1 or lower of G-ma-apoc
        if(Game.elderWrath > 1 && ((shimmer.wrath == 0 && shimmer.type == "golden") || shimmer.type == "reindeer")) {
            shimmer.pop()
            optimalGrimoire()
        } else if (Game.elderWrath <= 1) {
            shimmer.pop()
            optimalGrimoire()
        }
    })
}

function autoTicker() {
    if(! window.MCCH.auto_ticker_is_on) { return; }
    if(! Game.Achievements["Tabloid addiction"].won) {
        for (var i = Game.TickerClicks; i < 51; ++i) {
            Game.tickerL.click()
        }
    }
    if(Game.TickerEffect && Game.TickerEffect.type=='fortune')
    {
        Game.tickerL.click()
    }
}

function autoUpgrade() {
    if(! window.MCCH.auto_upgrade_is_on) { return; }

    //Setting volume to 0 prevents this loop from spamming javascript errors
    // due to how fast sounds will play otherwise.
    Game.setVolume(0)

    if (Date.now() > Game.lumpT + Game.lumpRipeAge) {
        Game.clickLump();
    }
    autoSeasons()
    var found_upgrade = findBestUpgrade()
    var loop_count = 0
    while (found_upgrade) {
        found_upgrade = findBestUpgrade()
            ++loop_count
            if (loop_count > 750) {
                console.log("Circuit breaker tripped.")
                break;
            }
    }
    //Restore volume level when done.
    Game.setVolume(orig_game_volume)
}

function handleWrinklers() {
    var active_wrinklers = 0,
        max_eaten_wrinkler_cookie_cnt = 0,
        max_eaten_wrinkler_idx = 0;
    const max_wrinklers = Game.wrinklers.length

    //disable the cookie click sound.
    Game.playCookieClickSound=function(){return};

    //Disable a bit lower here bcause we always want the cookie click sound off.
    if(! window.MCCH.auto_wrinkler_is_on) { return; }

    if (Game.season == "halloween" && Game.GetHowManyHalloweenDrops() != Game.halloweenDrops.length) {
        popAllWrinklers()
    }

    //While we don't have the Shiny achievement, always keep a slot open.
    //Also if we don't have Moistburster yet.
    if (Game.Achievements["Last Chance to See"].won == 0 || Game.Achievements.Moistburster.won == 0) {
        //Find the oldest wrinkler and pop it.
        for (var i in Game.wrinklers) {
            //Close means 'close to cookie' or 'active'. Type == 0 means non-shiny.
            if (Game.wrinklers[i].close == 1 && Game.wrinklers[i].type == 0) {
                ++active_wrinklers;
                if (Game.wrinklers[i].sucked > max_eaten_wrinkler_cookie_cnt) {
                    max_eaten_wrinkler_idx = i
                    max_eaten_wrinkler_cookie_cnt = Game.wrinklers[i].sucked
                }
            }
        }
        //If all wrinklers are shiny, then this will still pop one.
        //But keep in mind, that case would only ever be relevant if we got
        //12 shinies inside a single 60-second window.
        if (active_wrinklers == max_wrinklers) {
            const hc_to_gain_before = Math.floor(Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned)-Game.HowMuchPrestige(Game.cookiesReset))
            const b4_sucked = Game.wrinklers[max_eaten_wrinkler_idx].sucked
            const wrinkler_type = Game.wrinklers[max_eaten_wrinkler_idx].type
            Game.wrinklers[max_eaten_wrinkler_idx].hp = 0
            //If we try to compute this instantly we just get 0. The game needs time to process the dead wrinkler.
            setTimeout(function(){
                const hc_to_gain_after = Math.floor(Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned)-Game.HowMuchPrestige(Game.cookiesReset))
                const hc_per_wrinkler = hc_to_gain_after - hc_to_gain_before
                const datestring = Date().toLocaleString()
                const actual_sucked = computeActualSucked(b4_sucked, wrinkler_type)
                console.log(`Each wrinkler is worth approx ${hc_per_wrinkler.toLocaleString()} Heavenly Chips from ${actual_sucked} cookies as of ${datestring}`)}, 300, hc_to_gain_before, b4_sucked, wrinkler_type)
        }
    }
    //Otherwise, we do nothing and just let them eat.
}

/*
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
Interval declarations
|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
*/
setInterval(function() { if(! window.MCCH.auto_clicker_is_on) { return; } Game.ClickCookie(); }, 33);

setInterval(autoShimmer, 500);

setInterval(autoUpgrade, 1000);

//Ticker updates every 10 seconds, we check every 9.
setInterval(autoTicker, 9000);

setInterval(handleWrinklers, 30000);

setInterval(autoPantheon, 60000);

// If editing the script, ignore any "Game is not defined" warnings
//(function() {
//    'use strict';
//})();
