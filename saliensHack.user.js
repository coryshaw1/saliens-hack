// ==UserScript==
// @name            Saliens Hack
// @description     Saliens Hack for Steam Summer Sale 2018 Game - AutoSelect Planet, Invincibility, InstaKill
//
// @author          Cory "mbsurfer" Shaw
// @namespace       http://github.com/coryshaw1
// @downloadURL     https://github.com/coryshaw1/saliens-hack/raw/master/saliensHack.user.js
//
// @license         MIT License
// @copyright       Copyright (C) 2018, by Cory Shaw
//
// @include         https://steamcommunity.com/saliengame
// @include         https://steamcommunity.com/saliengame/
// @include         https://steamcommunity.com/saliengame/play
// @include         https://steamcommunity.com/saliengame/play/
//
// @version         1.1.2
// @updateURL       https://github.com/coryshaw1/saliens-hack/raw/master/saliensHack.user.js
//
// @run-at          document-start|document-end
//
// @grant           unsafeWindow
//
// @unwrap
// ==/UserScript==

/**
 * MIT License
 *
 * Copyright (c) 2018 Cory Shaw
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function() {
    if (typeof unsafeWindow !== "undefined")
        unsafeWindow.requestAnimationFrame = c => { setTimeout(c, 1000 / 60); };

    // Game broke reload and try again
    GameLoadError = function() {
        clearInterval(intervalFunc);
        setTimeout(function() {
            if (typeof unsafeWindow !== "undefined")
                unsafeWindow.location.reload();
            else
                window.location.reload();
        }, 750);
    }

    CEnemy.prototype.Walk = function(){this.Die(true);};
    var m_SalienInfoBox = {};
    var joiningZone = false;
    var joiningPlanet = false;
    var gameCheck = function(){

        if (!gGame || !gGame.m_State) return;

        if (gGame.m_State instanceof CBootState && gGame.m_State.button) {
            startGame();
            return;
        }

        if (gGame.m_State instanceof CPlanetSelectionState && gGame.m_State.m_rgPlanets) {
            // Go to uncaptured zone with the higheset difficulty
            var uncapturedPlanets = gGame.m_State.m_rgPlanets
                .filter(function(p){ return p.state && !p.state.captured })
                .sort(function(p1, p2){return p2.state.difficulty - p1.state.difficulty});

            if (uncapturedPlanets.length == 0) {
                console.log("ALL PLANETS ARE DONE. GG.");
                return;
            }

            joinPlanet(uncapturedPlanets[0].id);
            return;
        }

        if (gGame.m_State.m_VictoryScreen || gGame.m_State.m_LevelUpScreen) {
            gGame.ChangeState( new CBattleSelectionState( gGame.m_State.m_PlanetData.id ) );
            console.log('round done');
            return;
        }

        if (gGame.m_State.m_ScoreIncrements && gGame.m_State.m_ScoreIncrements != 0 && gGame.m_State.m_rtBattleStart && gGame.m_State.m_rtBattleEnd) {
            var ptPerSec = (gGame.m_State.m_rtBattleEnd - gGame.m_State.m_rtBattleStart) / 1000;
            gGame.m_State.m_Score = gGame.m_State.m_ScoreIncrements * ptPerSec;
            gGame.m_State.m_ScoreIncrements = 0;
        }

        if (gGame.m_State.m_EnemyManager) {

            if (joiningZone && gGame.m_State instanceof CBattleState) {
                if (m_SalienInfoBox && m_SalienInfoBox.destroy)
                    m_SalienInfoBox.destroy();

                m_SalienInfoBox = new CSalienInfoBox();
                m_SalienInfoBox.x = gApp.screen.width - m_SalienInfoBox.width - 12;
                m_SalienInfoBox.y = k_ScreenHeight - 72;
                gApp.stage.addChild(m_SalienInfoBox);
            }

            joiningZone = false;
            return;
        }

        if (gGame.m_State.m_PlanetData && gGame.m_State.m_PlanetData.zones) {
            joiningPlanet = false;
            // Go to boss in uncaptured zone if there is one
            var bossZone = gGame.m_State.m_PlanetData.zones
                .find(function(z){ return !z.captured && z.boss });

            if (bossZone && bossZone.zone_position) {
                console.log('Boss battle at zone:', bossZone.zone_position);
                joinZone(bossZone.zone_position);
                return;
            }

            // Go to uncaptured zone with the higheset difficulty
            var uncapturedZones = gGame.m_State.m_PlanetData.zones
                .filter(function(z){ return !z.captured })
                .sort(function(z1, z2){return z2.difficulty - z1.difficulty});

            if (uncapturedZones.length == 0 && gGame.m_State.m_PlanetData) {
                console.log("Planet is completely captured.");
                leavePlanet(gGame.m_State.m_PlanetData.id);
                return;
            }

            joinZone(uncapturedZones[0].zone_position);
            return;
        }
    };

    var intervalFunc = setInterval(gameCheck, 200);

    var joinZone = function(zoneId) {
        if (joiningZone) return;
        console.log('Joining zone:', zoneId);

        joiningZone = true;

        clearInterval(intervalFunc);

        gServer.JoinZone(
            zoneId,
            function ( results ) {
                gGame.ChangeState( new CBattleState( gGame.m_State.m_PlanetData, zoneId ) );
            },
            GameLoadError
        );

        setTimeout(function() {
            intervalFunc = setInterval(gameCheck, 200);
        }, 10000);
    };

    var joinPlanet = function(planetId) {
        if (joiningPlanet) return;
        console.log('Joining planet:', planetId);

        joiningPlanet = true;

        clearInterval(intervalFunc);

        gServer.JoinPlanet(
            planetId,
            function ( response ) {
                gGame.ChangeState( new CBattleSelectionState( planetId ) );
            },
            function ( response ) {
                ShowAlertDialog( 'Join Planet Error', 'Failed to join planet.  Please reload your game or try again shortly.' );
            }
        );

        setTimeout(function() {
            intervalFunc = setInterval(gameCheck, 200);
        }, 10000);
    };

    var leavePlanet = function(planetDataId) {

        if (joiningPlanet) return;
        console.log('Leaving planet:', planetDataId);

        joiningPlanet = true;

        clearInterval(intervalFunc);

        gServer.LeaveGameInstance(
            planetDataId,
            function() {
                gGame.ChangeState( new CPlanetSelectionState() );
            }
        );

        setTimeout(function() {
            intervalFunc = setInterval(gameCheck, 200);
        }, 10000);
    };

    var startGame = function() {
        console.log('Pressing Play in 2 seconds');

        clearInterval(intervalFunc);

        // wait 2 seconds for game to load
        // TODO: find a way to do this programmatically
        setTimeout(function() {
            // button gone?
            if (!gGame.m_State.button) {
                console.log('"PLAY" button is gone.. retrying...');
                startGame();
                return;
            }

            gGame.m_State.button.click();

            setTimeout(function() {
                intervalFunc = setInterval(gameCheck, 200);
            }, 5000);
        }, 2000);
    };
})();
