function LayerBuildings(game) {
    let layer = game.world.addLayer("buildings", 14, 14);
    
    layer.createSpace(0, 0, 10, 8, function(space) {
        space.background = "#986830";
        space.onenter = function() {
            game.waitTicks(24).then(()=>{
                game.dialog.display("Level 1\nA dusty home", true, true);
            });
        }
        space.music = "house";
        space.setTiles({
            '00': {name:'solid'},
            '01': {name:'wallWood', variant: 'tl'},
            '02': {name:'wallWood', variant: 't'},
            '03': {name:'wallWood', variant: 'tr'},
            '04': {name:'wallWood', variant: 'l'},
            '05': {name:'floorWood'},
            '06': {name:'wallWood', variant: 'r'},
            '07': {name:'wallWood', variant: 'orb'},
            '08': {name:'wallWood', variant: 'obl'},
            '09': {name:'wallWood', variant: 'bl'},
            '0a': {name:'wallWood', variant: 'b'},
            '0b': {name:'innerDoorway', variant: 'left'},
            '0c': {name:'innerDoorway', variant: 'right'},
            '0d': {name:'wallWood', variant: 'rb'},
        }, [
            '00000102020202030000',
            '00000405050505060000',
            '01020705050505080203',
            '04050505050505050506',
            '04050505050505050506',
            '04050505050505050506',
            '04050505050505050506',
            '090a0a0a0b0c0a0a0a0d',
        ]);
        space.addEntity(new EntityTrigger(game, 16*4+8, 16*7+8, 16, 8, (e,t) => {
            e.direction = 0; // look down
            game.sound.play('stairs');
            game.animations.exitDown().then(()=>{
                let space = game.world.layers.overworld.getSpace(1,0);
                e.setPosition(2*16+8, 2*16+8+5)
                game.world.transitionTo(space, "building");
            });
        }));

        // pull handle test
        let blockLeft = space.addEntity(new EntityTestPhysical(space.game, 4, 1));
        let blockRight = space.addEntity(new EntityTestPhysical(space.game, 5, 1));
        let handle = space.addEntity(new EntityPullHandle(space.game, 1, 2));
        //handle.returnSpeed = 1;
        handle.lineLength = 48;
        handle.onLengthChanged = function(progress) {
            let movedist = Math.round(progress*16);
            blockLeft.moveTo(4*16+8-movedist, 1*16+8);
            blockRight.moveTo(5*16+8+movedist, 1*16+8);
        }
    });

    // recreate
    layer.createSpace(5,5, 10, 8, function(space) { // Know-It-All birds' hut
        space.setTilesB64(
            `c3BhY2Uuc2V0VGlsZXMoeycwMCc6e25hbWU6J3dhbGxXb29kJyx2YXJpYW50
            Oid0bCd9LCcwMSc6e25hbWU6J3dhbGxXb29kJyx2YXJpYW50Oid0J30sJzAy
            Jzp7bmFtZTond2FsbFdvb2QnLHZhcmlhbnQ6J3RyJ30sJzAzJzp7bmFtZTon
            d2FsbFdvb2QnLHZhcmlhbnQ6J2wnfSwnMDQnOntuYW1lOidmbG9vcldvb2Qn
            fSwnMDUnOntuYW1lOid3YWxsV29vZCcsdmFyaWFudDoncid9LCcwNic6e25h
            bWU6J3dhbGxXb29kJyx2YXJpYW50OidibCd9LCcwNyc6e25hbWU6J3dhbGxX
            b29kJyx2YXJpYW50OidiJ30sJzA4Jzp7bmFtZTonaW5uZXJEb29yd2F5Jyx2
            YXJpYW50OidsZWZ0J30sJzA5Jzp7bmFtZTonaW5uZXJEb29yd2F5Jyx2YXJp
            YW50OidyaWdodCd9LCcwYSc6e25hbWU6J3dhbGxXb29kJyx2YXJpYW50Oidy
            Yid9LH0sWycwMDAxMDEwMTAxMDEwMTAxMDEwMicsJzAzMDQwNDA0MDQwNDA0
            MDQwNDA1JywnMDMwNDA0MDQwNDA0MDQwNDA0MDUnLCcwMzA0MDQwNDA0MDQw
            NDA0MDQwNScsJzAzMDQwNDA0MDQwNDA0MDQwNDA1JywnMDMwNDA0MDQwNDA0
            MDQwNDA0MDUnLCcwMzA0MDQwNDA0MDQwNDA0MDQwNScsJzA2MDcwNzA3MDgw
            OTA3MDcwNzBhJyxdKTs=`
        );
        space.addEntity(new EntityTransitionTarget(game, 5*16, space.height, 0, "entrance", () => {
            game.animations.enterUp().then(()=>{
                game.dialog.display("Level 1\nA dusty home", true, true);
            });
        }));
        space.createEntity("transitioner", {x: 16*4+8, y: 16*7+8, w: 16, h: 8, target: "overworld:5,5:knowitall:exitDown"});
    });
}