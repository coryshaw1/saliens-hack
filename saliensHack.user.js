// ==UserScript==
// @name          	Saliens Hack
// @description     Saliens Hack for Steam Summer Sale 2018 Game - AutoSelect Planet, Invincibility, InstaKill
//
// @author			Cory "mbsurfer" Shaw 
// @namespace       http://github.com/coryshaw1
// @downloadURL		https://github.com/coryshaw1/saliens-hack/raw/master/saliensHack.user.js
//
// @license         GPLv3 - http://www.gnu.org/licenses/gpl-3.0.txt
// @copyright       Copyright (C) 2018, by Cory Shaw 
//
// @include         https://steamcommunity.com/saliengame/play
// @include         https://steamcommunity.com/saliengame/play/
//
// @version         1.0.7
// @updateURL		https://github.com/coryshaw1/saliens-hack/raw/master/saliensHack.user.js
//
// @run-at			document-start|document-end
// @unwrap
// ==/UserScript==

/**
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * SCRIPT DESCRIPTION.
 *
 * @see http://wiki.greasespot.net/API_reference
 * @see http://wiki.greasespot.net/Metadata_Block
 */
(function() {	
    CEnemy.prototype.Walk = function(){this.Die(true);};
    var joiningZone = false;
    var gameCheck = function(){
        // Game broke reload and try again
        if ($J('.newmodal .newmodal_header .ellipsis') && $J('.newmodal .newmodal_header .ellipsis').length > 0 && $J('.newmodal .newmodal_header .ellipsis').text() == "Game Error") {
            clearInterval(intervalFunc);
            setTimeout(function() {
                window.location.reload();
            }, 750);
        }
        
        if (!gGame || !gGame.m_State) return;

        if (gGame.m_State instanceof CBootState && gGame.m_State.button) {
            startGame();
            return;
        }

        if (gGame.m_State.m_VictoryScreen || gGame.m_State.m_LevelUpScreen) {
            gGame.ChangeState( new CBattleSelectionState( gGame.m_State.m_PlanetData.id ) );
            console.log('round done');
            return;
        }

        if (gGame.m_State.m_EnemyManager) {
            joiningZone = false;
            return;
        }

        if (gGame.m_State.m_PlanetData && gGame.m_State.m_PlanetData.zones) {
            var uncapturedZones = gGame.m_State.m_PlanetData.zones
                .filter(function(z){ return !z.captured })
                .sort(function(z1, z2){return z2.difficulty - z1.difficulty});
            
            if (uncapturedZones.length == 0) {
                console.log("CHOOSE NEW PLANET. THIS ONE IS DONE.");
                return;
            }

            joinZone(uncapturedZones[0].zone_position);
            return;
        }
    };

    var intervalFunc = setInterval(gameCheck, 100);

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
            intervalFunc = setInterval(gameCheck, 100);
        }, 10000);
    };

    var startGame = function() {
        console.log('Pressing Play in 2 seconds');

        clearInterval(intervalFunc);

        // wait 2 seconds for game to load
        // TODO: find a way to do this programmatically
        setTimeout(function() {
            gGame.m_State.button.click();
    
            setTimeout(function() {
                intervalFunc = setInterval(gameCheck, 100);
            }, 5000);
        }, 2000);
    };
})();
