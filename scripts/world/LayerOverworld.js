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
        space.setTile(1,3,{name:"gravelRough", goesTo: "buildings:5,5"});

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
        let sign = space.createEntity('sign',{ x:1, y:5, text: "Know-It-All\nBirds' Hut\n First-timers\n welcome!!!" });
        space.setTile(2, 4, {name:"doorway", 'goesTo': "buildings:5,5:entrance"});
        space.addEntity(new EntityTransitionTarget(game, 2*16+8, 4*16+8+4, 2, "knowitall"));
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
            Myc6e25hbWU6J2JyaWRnZScsdmFyaWFudDondG9wJ30sJzE0Jzp7bmFtZTon
            YnJpZGdlJyx2YXJpYW50Oidib3R0b20nfSx9LFsnMDAwMTAyMDIwMjAyMDIw
            MzA0MDUnLCcwNjA2MDYwNjA2MDcwODA5MGEwYicsJzBjMGMwZDA2MDYwNzA4
            MGUwZjBlJywnMDgwODEwMDYwNjA3MDgxMTEyMTEnLCcwODA4MTAxMzEzMDcx
            MjEyMTIxMicsJzA4MDgxMDE0MTQwNzEyMTIwODA4JywnMDgwODEwMDYwNjA3
            MDgxMjA4MDgnLCcwODA4MTAwNjA2MDcwODEyMDgwOCcsXSk7`
        );
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
            fSwnMTAnOntuYW1lOid3YWxsUm9vdCcsdmFyaWFudDonb3JiJ30sJzExJzp7
            bmFtZTonZ3JhdmVsJyxlZGdlczondCd9LH0sWycwMDAxMDIwMjAzMDQwNTA1
            MDUwNScsJzA2MDYwNzAyMDgwOTAyMDIwMjAyJywnMGEwYTBhMDcwYjBiMGIw
            YjBiMGInLCcwYTBhMGEwYTBjMGQwYTBhMGEwYScsJzA2MDYwYTBhMGMwZDBh
            MGEwYTBhJywnMGUwZTBmMGYwZjBmMGYwZjBmMGYnLCcwMjAyMDIwMjAyMDIw
            MjAyMDIwMicsJzBlMGUxMDEwMTExMTEwMTAxMDEwJyxdKTs=`
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
            JzBmJzp7bmFtZTonZG9vcndheSd9LCcxMCc6e25hbWU6J3dhbGxSb290Jyx2
            YXJpYW50OidvcmInfSx9LFsnMDAwMTAyMDMwMzA0MDEwNTA2MDcnLCcwMTAx
            MDIwMzAzMDQwMTA1MDUwNicsJzA4MDgwOTAzMDMwYTA4MDEwNTBiJywnMDMw
            MzAzMDMwMzAzMDMwNDA1MDUnLCcwMzAzMDMwYzBjMGMwMzBhMDgwOCcsJzBk
            MGQwZDBlMGYwZTAzMDMwMzAzJywnMDEwMTAxMDEwMTAyMDMwMzAzMDMnLCcx
            MDEwMTAxMDEwMTAxMDEwMTAxMCcsXSk7`
        );
    });
}