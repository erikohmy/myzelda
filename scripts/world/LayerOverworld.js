function LayerOverworld(game) {
    // somehow do this automatically? by folder structure, 
    // in folder "world", find all folders in folder "layers"
    // each folder in "layers" is a layer, like world/layers/overworld
    // and each folder container a file like chunk0x0.js, chunk1x0.js, etc
    // and a file like layer.js

    // can js even do that? might need a compiler ( like gulp? yarn? )

    let layer = game.world.addLayer("overworld", 14, 14);
    layer.music = "overworld";
    
    layer.createSpace(0, 0, 10, 8, function(space) {
        space.createEntity('transitionTarget', {name:'warp', tx:4, ty:4});
        space.fill({name:"sand"});
        space.border({name:"obstacle", variant:"rock",  background:"sand"});
        space.setTile(3,4,{name:"obstacle", variant:"coconut"});
        space.setTile(4,5,{name:"obstacle", variant:"coconut"});
        space.fill({name:"sand"}, 1, 7, 8);
        space.setTile(9,4,{name:"sand"});
        space.setTile(9, 4, {name:"stone", background:"sand"});

        space.events.on('build', () => {
            console.log("build event fired!");
        });

        space.events.on('dig', (space, x, y, tileinfo) => {
            console.log("dig event fired!", x, y, tileinfo);
        });

        space.events.on('lift', (space, x, y, tileinfo) => {
            console.log("lift event fired!", x, y, tileinfo);
            if(x === 9 && y === 4) { // lifted the rock at 9,4
                space.setTile(9,4,{name:"sand"});
                game.sound.play('secret');
            }
        });

        space.events.on('steppedOn', (space, x, y, tileinfo) => {
            console.log("steppedOn event fired!", x, y, tileinfo);
            if(x === 9 && y === 4) { // we are inside the rock at 9,4
                space.setTile(9,4,{name:"dug"});
            }
        });

        /*
        let blockLeft = space.addEntity(new EntityTestPhysical(space.game, 1, 1));
        let blockRight = space.addEntity(new EntityTestPhysical(space.game, 8, 1));

        let toggle = false;
        space.addEntity(new EntityInterval(space.game, 60*3, (self, count) => {
            if (toggle) {
                blockLeft.moveToTile(1,1);
                blockRight.moveToTile(8,1);
            }else {
                blockLeft.moveToTile(4,1);
                blockRight.moveToTile(5,1);
            }
            toggle = !toggle;
        }, true));

        let blockBlocker = space.addEntity(new EntityTestPhysical(space.game, 9, 4));
        let timer = space.addEntity(new EntityTimer(space.game, 60*2, () => {
            blockBlocker.moveToTile(8, 4, undefined, ()=>{
                blockBlocker.moveToTile(8,1);
            });
        }));
        
        let player  = space.game.world.player;
        let px, py;
        [px, py] = player.position;
        if (px === 160) { // coming from the right
            blockBlocker.remove();
        } else {
            timer.start();
        }
        */

        // pushblock test
        space.addEntity(new EntityPushBlock(space.game, 2, 4));
        space.addEntity(new EntityPushBlock(space.game, 1, 4));
    });

    layer.createSpace(1, 0, 10, 8, function(space) {
        space.setTiles({
            '00': {name:'obstacle', variant: 'rock', background: 'sand'},
            '01': {name:'roof', edges: 'tl', variant: 'red', background: 'sand'},
            '02': {name:'chimney'},
            '03': {name:'roof', edges: 'tr', variant: 'red', background: 'sand'},
            '04': {name:'cliff', part: '29', variant: 'present'},
            '05': {name:'cliff', part: '33', variant: 'present'},
            '06': {name:'cliff', part: '52', variant: 'present'},
            '07': {name:'roof', edges: 'bl', variant: 'red'},
            '08': {name:'roof', edges: 'b', variant: 'red'},
            '09': {name:'roof', edges: 'rb', variant: 'red'},
            '0a': {name:'obstacle', variant: 'coconut'},
            '0b': {name:'grass2', edges: 'l'},
            '0c': {name:'hole'},
            '0d': {name:'grass', edges: 'l'},
            '0e': {name:'flowers'},
            '0f': {name:'cliff', part: '08', variant: 'present'},
            '10': {name:'window'},
            '11': {name:'doorway'},
            '12': {name:'sand'},
            '13': {name:'grass2'},
            '14': {name:'grass', edges: 'bl'},
            '15': {name:'grass', edges: 'b'},
            '16': {name:'road', variant: 'bright'},
            '17': {name:'cliff', part: '22', variant: 'present'},
            '18': {name:'grass2', edges: 'bl'},
            '19': {name:'grass2', edges: 'b'},
            '1a': {name:'cliff', part: '31', variant: 'present'},
            '1b': {name:'obstacle', variant: 'poles2', background: 'sand'},
            '1c': {name:'obstacle', variant: 'poles1', background: 'sand'}
        }, [
            '00010203040505050506',
            '000708090a0b0c0d0e0f',
            '00101110120b1314150c',
            '00121612120b13131317',
            '1616161212181919191a',
            '1b12161616161616121a',
            '0012161212121216121a',
            '001c161c1c1c1c161c1a',
        ]);
        space.addEntity(new EntityTrigger(space.game, 16*8, 16*1, 16, 16, (e,t) => {
            e.damage(1);
            e.push(-1,1);
            return;
            e.setPosition(t.x + 8 - (3*16 + 8), t.y + 8 -16)
            e.direction = 2; // look down
            let space = game.world.currentLayer.getSpace(0,1);
            game.world.transitionTo(space, "building", () => {
                game.animations.test1();
            });
        }));

        space.addEntity(new EntityTrigger(space.game, 16*2, 16*2, 16, 16, (e,t) => {
            let space = game.world.layers.buildings.getSpace(0,0);
            game.sound.play('stairs');
            game.world.transitionTo(space, "building", () => {
                game.animations.enterUp();
            });

            e.setPosition(5*16, space.height)
            e.direction = 0; // look up
        }));
    });
    
    layer.createSpace(0, 1, 10, 24, function(space) {
        space.fill({name:"water"});
        space.border({name:"obstacle", variant:"rock"});
        space.setTile(1,0,{name:"sand"});
        space.setTile(2,0,{name:"sand"});
        space.setTile(3,0,{name:"sand"});
        space.setTile(4,0,{name:"sand"});
        space.setTile(5,0,{name:"sand"});
        space.setTile(6,0,{name:"sand"});
        space.setTile(7,0,{name:"sand"});
        space.setTile(8,0,{name:"sand"});
        space.setTile(1,1,{name:"sand", edges:"b"});
        space.setTile(2,1,{name:"sand", edges:"b"});
        space.setTile(3,1,{name:"sand", edges:"b"});
        space.setTile(4,1,{name:"sand"});
        space.setTile(5,1,{name:"sand"});
        space.setTile(6,1,{name:"sand", edges:"b"});
        space.setTile(7,1,{name:"sand", edges:"b"});
        space.setTile(8,1,{name:"sand", edges:"b"});
        space.setTile(1,2,{name:"puddle"});
        space.setTile(2,2,{name:"puddle"});
        space.setTile(3,2,{name:"puddle"});
        space.setTile(4,2,{name:"sand", edges:"bl"});
        space.setTile(5,2,{name:"sand", edges:"rb"});
        space.setTile(6,2,{name:"puddle"});
        space.setTile(7,2,{name:"puddle"});
        space.setTile(8,2,{name:"puddle"});
        space.setTile(1,3,{name:"puddle"});
        space.setTile(2,3,{name:"puddle"});
        space.setTile(3,3,{name:"puddle"});
        space.setTile(4,3,{name:"puddle"});
        space.setTile(5,3,{name:"puddle"});
        space.setTile(6,3,{name:"puddle"});
        space.setTile(7,3,{name:"puddle"});
        space.setTile(8,3,{name:"puddle"});
    });

    layer.createSpace(1, 1, 10, 8, function(space) {
        space.music = "none";
        space.setTiles({
            'wa': {name:"water"},
            'gr': {name:"grass"},
            'gg': {name:"grass", variant:"green"},
            'g2': {name:"grass", edges:"rb"},
            'fl': {name:"flowers"},
            'ro': {name:"road", variant:"bright"},
            'yg': {name:"grass2"},
            'yt': {name:"grass2", edges:"t"},
            'yb': {name:"grass2", edges:"b"},
            'yr': {name:"grass2", edges:"r"},
            'yl': {name:"grass2", edges:"l"},
            'y1': {name:"grass2", edges:"rb"},
            'y2': {name:"grass2", edges:"bl"},
            'rf': {name:"roofShack", variant:"blue"},
            'wi': {name:"window"},
            'dw': {name:"doorway"},
            'tl': {name:"tree", variant:"tl-common", background:"grass2"},
            'tr': {name:"tree", variant:"tr-common", background:"grass2"},
            'wl': {name:"tree", variant:"tl-common", background:"grass2-t"},
            'wr': {name:"tree", variant:"tr-common", background:"grass2-t"},
        },[
            'g2ygyrwawaylygroggfl',
            'ygygyrwawaylygrorogg',
            'ybyby1waway2ybygrogr',
            'wawawawawawawaylroro',
            'wawawarfrfrfway2ybyb',
            'ytytytwidwwiwawawawa',
            'ygygygygygyrwawawawa',
            'tltrtltrtltrwlwrwlwr',
        ]);
    });
    layer.createSpace(2,1, 10, 8, function(space) {
        space.setTiles({
            '00': {name:'tree', variant: 'rb-common'},
            '01': {name:'tree', variant: 'bl-common'},
            '02': {name:'tree', variant: 'tl-common'},
            '03': {name:'tree', variant: 'tr-common'},
            '04': {name:'obstacle', variant: 'rock', background: 'grass2'},
            '05': {name:'grass2'},
            '06': {name:'road', variant: 'bright'},
            '07': {name:'roof', edges: 'tl', variant: 'red'},
            '08': {name:'chimney'},
            '09': {name:'roof', edges: 'tr', variant: 'red'},
            '0a': {name:'obstacle', variant: 'poles2'},
            '0b': {name:'roof', edges: 'bl', variant: 'red'},
            '0c': {name:'roof', edges: 'b', variant: 'red'},
            '0d': {name:'roof', edges: 'rb', variant: 'red'},
            '0e': {name:'window'},
            '0f': {name:'doorway'},
            '10': {name:'obstacle', variant: 'fence'},
            '11': {name:'grass', edges: 'tl'},
            '12': {name:'grass', edges: 't'},
            '13': {name:'grass', edges: 'tr'},
            '14': {name:'grass', edges: 'l'},
            '15': {name:'flowers'},
            '16': {name:'grass', edges: 'r'},
        }, [
            '00010001000203040402',
            '02030505050100050501',
            '01000505050505050203',
            '06060605070809050100',
            '0a0a06050b0c0d050504',
            '020306050e0f0e101004',
            '01000606060611121304',
            '02030605050514151604',
        ]);
    });

    // recreate
    layer.createSpace(5,5, 10, 8, function(space) { // Know-It-All birds' hut area
        space.music = "lynna-city-present";
        space.setTilesB64(
            `c3BhY2Uuc2V0VGlsZXMoeycwMCc6e25hbWU6J2NsaWZmJyxwYXJ0OicyMics
            dmFyaWFudDoncHJlc2VudCd9LCcwMSc6e25hbWU6J2NsaWZmJyxwYXJ0Oicz
            MycsdmFyaWFudDoncHJlc2VudCd9LCcwMic6e25hbWU6J2NsaWZmJyxwYXJ0
            OiczMCcsdmFyaWFudDoncHJlc2VudCd9LCcwMyc6e25hbWU6J3N0YWlycyd9
            LCcwNCc6e25hbWU6J2NsaWZmJyxwYXJ0OicyOScsdmFyaWFudDoncHJlc2Vu
            dCd9LCcwNSc6e25hbWU6J3dhdGVyZmFsbEJvdHRvbSd9LCcwNic6e25hbWU6
            J2NsaWZmJyxwYXJ0OiczMScsdmFyaWFudDoncHJlc2VudCd9LCcwNyc6e25h
            bWU6J3RyZWUnLHBhcnQ6J3RsJyx2YXJpYW50Oidjb21tb24nfSwnMDgnOntu
            YW1lOid0cmVlJyxwYXJ0Oid0cicsdmFyaWFudDonY29tbW9uJ30sJzA5Jzp7
            bmFtZTonZ3Jhc3MyJ30sJzBhJzp7bmFtZTonZ3Jhc3MnLGVkZ2VzOidsJ30s
            JzBiJzp7bmFtZTonZ3Jhc3MnLGVkZ2VzOidyJ30sJzBjJzp7bmFtZTonZ3Jh
            c3MyJyxlZGdlczoncid9LCcwZCc6e25hbWU6J3dhdGVyJ30sJzBlJzp7bmFt
            ZTondHJlZScscGFydDonYmwnLHZhcmlhbnQ6J2NvbW1vbid9LCcwZic6e25h
            bWU6J3RyZWUnLHBhcnQ6J3JiJyx2YXJpYW50Oidjb21tb24nfSwnMTAnOntu
            YW1lOidmbG93ZXJzJ30sJzExJzp7bmFtZTonZ3Jhc3MnLGVkZ2VzOid0cid9
            LCcxMic6e25hbWU6J2dyYXNzMicsZWRnZXM6J3QnfSwnMTMnOntuYW1lOidy
            b29mU2hhY2snLHZhcmlhbnQ6J2JsdWUnfSwnMTQnOntuYW1lOidncmFzcycs
            dmFyaWFudDonZ3JlZW4nfSwnMTUnOntuYW1lOidncmFzcycsZWRnZXM6J3Qn
            fSwnMTYnOntuYW1lOid3aW5kb3cnfSwnMTcnOntuYW1lOidkb29yd2F5J30s
            JzE4Jzp7bmFtZTonZ3Jhc3MnfSwnMTknOntuYW1lOidncmFzcycsZWRnZXM6
            J2InfSwnMWEnOntuYW1lOidncmFzcycsZWRnZXM6J3JsJ30sJzFiJzp7bmFt
            ZTonZ3Jhc3MnLGVkZ2VzOidibCd9LCcxYyc6e25hbWU6J2dyYXNzJyxlZGdl
            czondGInfSwnMWQnOntuYW1lOidjbGlmZicscGFydDonNTcnLHZhcmlhbnQ6
            J3ByZXNlbnQnfSwnMWUnOntuYW1lOidjbGlmZicscGFydDonMDcnLHZhcmlh
            bnQ6J3ByZXNlbnQnfSx9LFsnMDAwMTAxMDIwMzAzMDQwMjA1MDUnLCcwNjA3
            MDgwOTBhMGIwOTBjMGQwZCcsJzA2MGUwZjA5MGExMDExMDkxMjEyJywnMDYx
            MzEzMTMwYTE0MTQxNTExMDknLCcwNjE2MTcxNjBhMTgxOTE5MTQxNScsJzA2
            MDkxYTA5MGEwYjA5MDkxYjE4JywnMDYxYzE5MWMxMDBiMDkwOTA5MGEnLCcx
            ZDFlMDkwOTBhMTgxNTE1MTUxMCcsXSk7`
        );
        space.createEntity('sign',{ x:1, y:5, text: "Know-It-All\nBirds' Hut\n First-timers\n welcome!!!" });
        space.setTile(2, 4, {name:"doorway", 'goesTo': "buildings:5,5:entrance"});
        //space.addEntity(new EntityTransitionTarget(game, 2*16+8, 4*16+8+4, 2, "knowitall"));
        space.createEntity('transitionTarget', {name:'knowitall', tx:2, y:4*16+8+4, direction: 2});
        space.createEntity('transitionTarget', {name:'warp', tx:3, ty:1});
    }, function(space) {
        space.minimap = (ctx, x, y) => {
            ctx.fillStyle = "#ffbd10";
            ctx.fillRect(x, y, 7, 7);
            ctx.fillStyle = "#845210";
            ctx.fillRect(x, y, 7, 1);
            ctx.fillRect(x, y+1, 1, 6);
            ctx.fillRect(x+1, y+1, 3, 4);
            ctx.fillRect(x+1, y+1, 3, 4);
            ctx.fillStyle= "#1094ff";
            ctx.fillRect(x+1, y+1, 2, 1);
            ctx.fillRect(x+6, y+1, 1, 1);
            ctx.fillStyle= "#ffbd10";
            ctx.fillRect(x+1, y+3, 2, 1);
        }
    });

    layer.createSpace(6,5, 10, 8, function(space) {
        space.music = "lynna-city-present";
        space.setTilesB64(
            `c3BhY2Uuc2V0VGlsZXMoeycwMCc6e25hbWU6J3dhdGVyZmFsbEJvdHRvbSd9
            LCcwMSc6e25hbWU6J2NsaWZmJyxwYXJ0OicyOScsdmFyaWFudDoncHJlc2Vu
            dCd9LCcwMic6e25hbWU6J2NsaWZmJyxwYXJ0OiczMycsdmFyaWFudDoncHJl
            c2VudCd9LCcwMyc6e25hbWU6J3Jvb2YnLGVkZ2VzOid0bCcsdmFyaWFudDon
            Ymx1ZSd9LCcwNCc6e25hbWU6J2NoaW1uZXknfSwnMDUnOntuYW1lOidyb29m
            JyxlZGdlczondHInLHZhcmlhbnQ6J2JsdWUnfSwnMDYnOntuYW1lOid3YXRl
            cid9LCcwNyc6e25hbWU6J2dyYXNzMicsZWRnZXM6J2wnfSwnMDgnOntuYW1l
            OidncmFzczInfSwnMDknOntuYW1lOidyb29mJyxlZGdlczonYmwnLHZhcmlh
            bnQ6J2JsdWUnfSwnMGEnOntuYW1lOidyb29mJyxlZGdlczonYicsdmFyaWFu
            dDonYmx1ZSd9LCcwYic6e25hbWU6J3Jvb2YnLGVkZ2VzOidyYicsdmFyaWFu
            dDonYmx1ZSd9LCcwYyc6e25hbWU6J2dyYXNzMicsZWRnZXM6J3QnfSwnMGQn
            OntuYW1lOidncmFzczInLGVkZ2VzOid0cid9LCcwZSc6e25hbWU6J3dpbmRv
            dyd9LCcwZic6e25hbWU6J2Rvb3J3YXknfSwnMTAnOntuYW1lOidncmFzczIn
            LGVkZ2VzOidyJ30sJzExJzp7bmFtZTonb2JzdGFjbGUnLHZhcmlhbnQ6J3Bv
            bGVzMid9LCcxMic6e25hbWU6J3JvYWQnLHZhcmlhbnQ6J2JyaWdodCd9LCcx
            Myc6e25hbWU6J2dyYXNzJyxlZGdlczondCd9LCcxNCc6e25hbWU6J2dyYXNz
            JyxlZGdlczondHInfSwnMTUnOntuYW1lOidicmlkZ2UnLHZhcmlhbnQ6J3Rv
            cCd9LCcxNic6e25hbWU6J2Zsb3dlcnMnfSwnMTcnOntuYW1lOidncmFzcycs
            ZWRnZXM6J3JiJ30sJzE4Jzp7bmFtZTonYnJpZGdlJyx2YXJpYW50Oidib3R0
            b20nfSwnMTknOntuYW1lOidncmFzcycsdmFyaWFudDonZ3JlZW4nfSwnMWEn
            OntuYW1lOidncmFzcycsZWRnZXM6J3InfSwnMWInOntuYW1lOidncmFzcyd9
            LH0sWycwMDAxMDIwMjAyMDIwMjAzMDQwNScsJzA2MDYwNjA2MDYwNzA4MDkw
            YTBiJywnMGMwYzBkMDYwNjA3MDgwZTBmMGUnLCcwODA4MTAwNjA2MDcwODEx
            MTIxMScsJzEzMTQxMDE1MTUwNzEyMTIxMjEyJywnMTYxNzEwMTgxODA3MTIx
            MjE2MTknLCcxYTA4MTAwNjA2MDcwODEyMTkxOScsJzFhMDgxMDA2MDYwNzA4
            MTIxOTFiJyxdKTs=`
        );
        space.setTile(7,0, {name:"roof", variant:"blue", edges:"tl", background:"cliff-33-present"});
        space.setTile(9,0, {name:"roof", variant:"blue", edges:"tr", background:"cliff-33-present"});
    });
    layer.createSpace(5,6, 10, 8, function(space) {
        space.music = "lynna-city-present";
        space.setTilesB64(
            `c3BhY2Uuc2V0VGlsZXMoeycwMCc6e25hbWU6J2NsaWZmJyxwYXJ0OicyOScs
            dmFyaWFudDoncHJlc2VudCd9LCcwMSc6e25hbWU6J2NsaWZmJyxwYXJ0Oicz
            MCcsdmFyaWFudDoncHJlc2VudCd9LCcwMic6e25hbWU6J2dyYXNzMid9LCcw
            Myc6e25hbWU6J2dyYXNzJyxlZGdlczonbCd9LCcwNCc6e25hbWU6J2dyYXNz
            J30sJzA1Jzp7bmFtZTonZ3Jhc3MnLGVkZ2VzOidiJ30sJzA2Jzp7bmFtZTon
            b2JzdGFjbGUnLHZhcmlhbnQ6J2Jsb2NrMid9LCcwNyc6e25hbWU6J2dyYXNz
            MicsZWRnZXM6J2JsJ30sJzA4Jzp7bmFtZTonZ3Jhc3MnLGVkZ2VzOidibCd9
            LCcwOSc6e25hbWU6J2dyYXNzJyxlZGdlczoncmInfSwnMGEnOntuYW1lOid3
            YXRlcid9LCcwYic6e25hbWU6J2dyYXNzMicsZWRnZXM6J2InfSwnMGMnOntu
            YW1lOidicmlkZ2UnLHZhcmlhbnQ6J2xlZnQnfSwnMGQnOntuYW1lOidicmlk
            Z2UnLHZhcmlhbnQ6J3JpZ2h0J30sJzBlJzp7bmFtZTonb2JzdGFjbGUnLHZh
            cmlhbnQ6J3BvbGVzMid9LCcwZic6e25hbWU6J2dyYXNzMicsZWRnZXM6J3Qn
            fSwnMTAnOntuYW1lOid0b3dlcndhbGwnLHBhcnQ6J3RvcCcsdmFyaWFudDon
            Y3RsJ30sJzExJzp7bmFtZTondG93ZXJ3YWxsJyxwYXJ0Oid0b3AnLHZhcmlh
            bnQ6J2N0cid9LCcxMic6e25hbWU6J2dyYXZlbCcsZWRnZXM6J3QnfSwnMTMn
            OntuYW1lOid0b3dlcndhbGwnLHBhcnQ6J3RvcC10Jyx2YXJpYW50Oidib3R0
            b20nfSwnMTQnOntuYW1lOid0b3dlcndhbGwnLHBhcnQ6J3RvcCcsdmFyaWFu
            dDonaG0nfSx9LFsnMDAwMTAyMDIwMzA0MDUwNTA1MDUnLCcwNjA2MDcwMjA4
            MDkwMjAyMDIwMicsJzBhMGEwYTA3MGIwYjBiMGIwYjBiJywnMGEwYTBhMGEw
            YzBkMGEwYTBhMGEnLCcwNjA2MGEwYTBjMGQwYTBhMGEwYScsJzBlMGUwZjBm
            MGYwZjBmMGYwZjBmJywnMDIwMjAyMDIwMjAyMDIwMjAyMDInLCcwZTBlMTAx
            MTEyMTIxMDEzMTQxNCcsXSk7`
        );
    });
    layer.createSpace(6,6, 10, 8, function(space) {
        space.music = "lynna-city-present";
        space.setTilesB64(
            `c3BhY2Uuc2V0VGlsZXMoeycwMCc6e25hbWU6J2dyYXNzJyxlZGdlczoncmIn
            fSwnMDEnOntuYW1lOidncmFzczInfSwnMDInOntuYW1lOidncmFzczInLGVk
            Z2VzOidyJ30sJzAzJzp7bmFtZTond2F0ZXInfSwnMDQnOntuYW1lOidncmFz
            czInLGVkZ2VzOidsJ30sJzA1Jzp7bmFtZToncm9hZCcsdmFyaWFudDonYnJp
            Z2h0J30sJzA2Jzp7bmFtZTonZ3Jhc3MnLHZhcmlhbnQ6J2dyZWVuJ30sJzA3
            Jzp7bmFtZTonZmxvd2Vycyd9LCcwOCc6e25hbWU6J2dyYXNzMicsZWRnZXM6
            J2InfSwnMDknOntuYW1lOidncmFzczInLGVkZ2VzOidyYid9LCcwYSc6e25h
            bWU6J2dyYXNzMicsZWRnZXM6J2JsJ30sJzBiJzp7bmFtZTonZ3Jhc3MnfSwn
            MGMnOntuYW1lOidyb29mU2hhY2snLHZhcmlhbnQ6J2JsdWUnfSwnMGQnOntu
            YW1lOidncmFzczInLGVkZ2VzOid0J30sJzBlJzp7bmFtZTond2luZG93J30s
            JzBmJzp7bmFtZTonZG9vcndheSd9LCcxMCc6e25hbWU6J3Rvd2Vyd2FsbCcs
            cGFydDondG9wJyx2YXJpYW50OidobSd9LH0sWycwMDAxMDIwMzAzMDQwMTA1
            MDYwNycsJzAxMDEwMjAzMDMwNDAxMDUwNTA2JywnMDgwODA5MDMwMzBhMDgw
            MTA1MGInLCcwMzAzMDMwMzAzMDMwMzA0MDUwNScsJzAzMDMwMzBjMGMwYzAz
            MGEwODA4JywnMGQwZDBkMGUwZjBlMDMwMzAzMDMnLCcwMTAxMDEwMTAxMDIw
            MzAzMDMwMycsJzEwMTAxMDEwMTAxMDEwMTAxMDEwJyxdKTs=`
        );
    });
    layer.createSpace(5,7, 10, 8, function(space) { // tower topleft
        space.music = "none";
        space.setTilesB64(
            `c3BhY2Uuc2V0VGlsZXMoeycwMCc6e25hbWU6J3Rvd2Vyd2FsbCcscGFydDon
            dG9wJyx2YXJpYW50OidjdGwnfSwnMDEnOntuYW1lOid0b3dlcndhbGwnLHBh
            cnQ6J3RvcC10Jyx2YXJpYW50Oidib3R0b20nfSwnMDInOntuYW1lOid0b3dl
            cndhbGwnLHBhcnQ6J3RvcC10Jyx2YXJpYW50Oid0b3AnfSwnMDMnOntuYW1l
            Oid0b3dlcndhbGwnLHBhcnQ6J3RvcCcsdmFyaWFudDonY2JyJ30sJzA0Jzp7
            bmFtZTonZ3JhdmVsJyx2YXJpYW50Oidyb3VnaCd9LCcwNSc6e25hbWU6J3Rv
            d2Vyd2FsbCcscGFydDondG9wJyx2YXJpYW50OidjYmwnfSwnMDYnOntuYW1l
            Oid0b3dlcndhbGwnLHBhcnQ6J3RvcCcsdmFyaWFudDonY3RyJ30sJzA3Jzp7
            bmFtZTondG93ZXJ3YWxsJyxwYXJ0Oid0b3AnLHZhcmlhbnQ6J3ZtJ30sJzA4
            Jzp7bmFtZTondG93ZXJ3YWxsJyx2YXJpYW50OidtaWQnfSwnMDknOntuYW1l
            Oid0b3dlcndhbGwnLHZhcmlhbnQ6J3Ntcid9LCcwYSc6e25hbWU6J2dyYXZl
            bCd9LCcwYic6e25hbWU6J3Rvd2Vyd2FsbCcsdmFyaWFudDonc21sJ30sJzBj
            Jzp7bmFtZTondG93ZXJ3YWxsJyxwYXJ0Oid0b3AtdCcsdmFyaWFudDoncmln
            aHQnfSwnMGQnOntuYW1lOid0b3dlcndhbGwnLHZhcmlhbnQ6J2JvdCd9LCcw
            ZSc6e25hbWU6J3Rvd2Vyd2FsbCcsdmFyaWFudDonc2JyJ30sJzBmJzp7bmFt
            ZTonc3RhaXJzJ30sJzEwJzp7bmFtZTondG93ZXJ3YWxsJyx2YXJpYW50Oidz
            YmwnfSwnMTEnOntuYW1lOid0b3dlcndhbGwnLHBhcnQ6J3RvcC10Jyx2YXJp
            YW50OidsZWZ0J30sJzEyJzp7bmFtZToncm9hZCcsdmFyaWFudDondG93ZXIn
            fSwnMTMnOntuYW1lOid0b3dlcndhbGwnLHBhcnQ6J3RvcCcsdmFyaWFudDon
            dmViJ30sJzE0Jzp7bmFtZTondG93ZXJ3YWxsJyx2YXJpYW50OidjbSd9LH0s
            WycwMDAxMDIwMzA0MDQwNTAyMDEwNicsJzA3MDcwODA5MGEwNDBiMDgwNzA3
            JywnMGMwMzBkMGUwZjBmMTAwZDA1MTEnLCcwNzA5MTIwNDEyMTIxMjA0MGIw
            NycsJzA3MGUwZjBmMGYwZjBmMGYxMDA3JywnMDcwNDA0MTIxMjEyMGEwNDEy
            MGMnLCcwNzBhMTIwYTEyMTIxMjEyMGExMycsJzA3MTIxMjEyMTIxMjEyMTIx
            MjE0JyxdKTs=`
        );
    });
    layer.createSpace(5,8, 10, 8, function(space) { // tower bottomleft
        space.music = "none";
        space.setTilesB64(
            `c3BhY2Uuc2V0VGlsZXMoeycwMCc6e25hbWU6J3Rvd2Vyd2FsbCcscGFydDon
            dG9wJyx2YXJpYW50Oid2bSd9LCcwMSc6e25hbWU6J3JvYWQnLHZhcmlhbnQ6
            J3Rvd2VyJ30sJzAyJzp7bmFtZTonZ3JhdmVsJyx2YXJpYW50Oidyb3VnaCd9
            LCcwMyc6e25hbWU6J2dyYXZlbCd9LCcwNCc6e25hbWU6J3Rvd2Vyd2FsbCcs
            dmFyaWFudDonY2InfSwnMDUnOntuYW1lOid0b3dlcndhbGwnLHBhcnQ6J3Rv
            cC10Jyx2YXJpYW50OidyaWdodCd9LCcwNic6e25hbWU6J3Rvd2Vyd2FsbCcs
            cGFydDondG9wJyx2YXJpYW50OidobSd9LCcwNyc6e25hbWU6J3Rvd2Vyd2Fs
            bCcscGFydDondG9wJyx2YXJpYW50OidjdHInfSwnMDgnOntuYW1lOid0b3dl
            cndhbGwnLHZhcmlhbnQ6J2JvdCd9LCcwOSc6e25hbWU6J3Rvd2Vyd2FsbCcs
            cGFydDondG9wJyx2YXJpYW50OidjYmwnfSwnMGEnOntuYW1lOidwdWRkbGUn
            fSwnMGInOntuYW1lOid0b3dlcndhbGwnLHZhcmlhbnQ6J3NibCd9LCcwYyc6
            e25hbWU6J3Rvd2Vyd2FsbCcscGFydDondG9wLXQnLHZhcmlhbnQ6J3RvcCd9
            LH0sWycwMDAxMDEwMTAxMDIwMTAxMDMwNCcsJzAwMDMwMTAxMDEwMTAxMDEw
            MTAxJywnMDAwMjAzMDEwMTAxMDIwMTAxMDEnLCcwNTA2MDYwNzAyMDMwMTAx
            MDEwMScsJzAwMDgwODA5MDYwNjA3MDEwMTAzJywnMDAwYTBhMGIwODA4MDAw
            MjAxMDEnLCcwMDBhMGEwYTBhMGEwMDAyMDIwMScsJzA5MDYwNjA2MDYwNjBj
            MDYwNjA2JyxdKTs=`
        );
    });
    layer.createSpace(6,8, 10, 8, function(space) { // tower bottomright
        space.music = "none";
        space.setTilesB64(
            `c3BhY2Uuc2V0VGlsZXMoeycwMCc6e25hbWU6J3Rvd2Vyd2FsbCcsdmFyaWFu
            dDonc2JsJ30sJzAxJzp7bmFtZTondG93ZXJ3YWxsJyx2YXJpYW50Oidib3Qn
            fSwnMDInOntuYW1lOid0b3dlcndhbGwnLHZhcmlhbnQ6J3NtbCd9LCcwMyc6
            e25hbWU6J3Rvd2Vyd2FsbCcscGFydDondG9wJyx2YXJpYW50Oid2ZWInfSwn
            MDQnOntuYW1lOidyb2FkJyx2YXJpYW50Oid0b3dlcid9LCcwNSc6e25hbWU6
            J3Rvd2Vyd2FsbCcsdmFyaWFudDonc21yJ30sJzA2Jzp7bmFtZTondG93ZXJ3
            YWxsJyx2YXJpYW50OidzYnInfSwnMDcnOntuYW1lOid0b3dlcndhbGwnLHZh
            cmlhbnQ6J2NtJ30sJzA4Jzp7bmFtZTonb2JzdGFjbGUnLHZhcmlhbnQ6J3Rv
            d2VyYnJpY2tzJ30sJzA5Jzp7bmFtZTonb2JzdGFjbGUnLHZhcmlhbnQ6J3Rv
            d2VycGxpbnRoJ30sJzBhJzp7bmFtZTondG93ZXJ3YWxsJyx2YXJpYW50Oidj
            Yid9LCcwYic6e25hbWU6J3Rvd2Vyd2FsbCcscGFydDondG9wJyx2YXJpYW50
            OidjdGwnfSwnMGMnOntuYW1lOidncmF2ZWwnLHZhcmlhbnQ6J3JvdWdoJ30s
            JzBkJzp7bmFtZTondG93ZXJ3YWxsJyxwYXJ0Oid0b3AnLHZhcmlhbnQ6J3Zt
            J30sJzBlJzp7bmFtZTonZ3JhdmVsJ30sJzBmJzp7bmFtZTondG93ZXJ3YWxs
            JyxwYXJ0Oid0b3AnLHZhcmlhbnQ6J2htJ30sJzEwJzp7bmFtZTondG93ZXJ3
            YWxsJyxwYXJ0Oid0b3AtdCcsdmFyaWFudDondG9wJ30sfSxbJzAwMDEwMjAz
            MDQwNDAzMDUwMTA2JywnMDQwNDAwMDcwNDA0MDcwNjA4MDgnLCcwNDA0MDkw
            YTA0MDQwYTA0MDkwYicsJzA0MDQwNDA0MDQwNDA4MDQwYzBkJywnMDQwNDBj
            MDQwNDBjMDQwYzBjMGQnLCcwNDBjMGMwZTBjMDQwYzA0MDgwZCcsJzBjMGMw
            NDA0MGUwNDA0MDgwODBkJywnMGYwZjBmMGYwZjBmMGYwZjBmMTAnLF0pOw==`
        );
    });
    layer.createSpace(6,7, 10, 8, function(space) { // tower
        space.music = "none";
        space.setTilesB64(
            `c3BhY2Uuc2V0VGlsZXMoeycwMCc6e25hbWU6J3NvbGlkJ30sJzAxJzp7bmFt
            ZTondG93ZXJ3YWxsJyxwYXJ0Oid0b3AnLHZhcmlhbnQ6J2N0cid9LCcwMic6
            e25hbWU6J29ic3RhY2xlJyx2YXJpYW50Oid0b3dlcmJyaWNrcyd9LCcwMyc6
            e25hbWU6J29ic3RhY2xlJyx2YXJpYW50Oid0b3dlcnBsaW50aCd9LCcwNCc6
            e25hbWU6J3Rvd2Vyd2FsbCcscGFydDondG9wJyx2YXJpYW50OidjdGwnfSwn
            MDUnOntuYW1lOid0b3dlcndhbGwnLHBhcnQ6J3RvcCcsdmFyaWFudDonY2Js
            J30sJzA2Jzp7bmFtZTondG93ZXJ3YWxsJyxwYXJ0Oid0b3AnLHZhcmlhbnQ6
            J2htJ30sJzA3Jzp7bmFtZToncm9hZCcsdmFyaWFudDondG93ZXInfSwnMDgn
            OntuYW1lOid0b3dlcndhbGwnLHBhcnQ6J3RvcCcsdmFyaWFudDonY2JyJ30s
            JzA5Jzp7bmFtZTondG93ZXJ3YWxsJyx2YXJpYW50OidzbWwnfSwnMGEnOntu
            YW1lOid0b3dlcndhbGwnLHZhcmlhbnQ6J21pZCd9LCcwYic6e25hbWU6J3Rv
            d2Vyd2FsbCcsdmFyaWFudDonc21yJ30sfSxbJzAwMDAwMDAwMDAwMDAwMDAw
            MDAwJywnMDAwMDAwMDAwMDAwMDAwMDAwMDAnLCcwMDAwMDAwMDAwMDAwMDAw
            MDAwMCcsJzAwMDAwMDAwMDAwMDAwMDAwMDAwJywnMDAwMDAwMDAwMDAwMDAw
            MDAwMDAnLCcwMTAyMDIwMzAyMDIwMzAyMDIwNCcsJzA1MDYwMTA3MDcwNzA3
            MDQwNjA4JywnMDkwYTA1MDEwNzA3MDQwODBhMGInLF0pOw==`
        );
    });
}