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
        space.fill({name:"sand"});
        space.border({name:"obstacle", variant:"rock"});
        space.setTile(3,4,{name:"obstacle", variant:"coconut"});
        space.setTile(4,5,{name:"obstacle", variant:"coconut"});
        space.fill({name:"sand"}, 1, 7, 8);
        space.setTile(9,4,{name:"sand"});

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
        let timer = space.addEntity(new EntityTimer(space.game, 60*4, () => {
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
        space.background = "#f8e010";
        space.setTiles({
            ' ': null,
            's': {name:"sand"},
            'r': {name:"obstacle", variant:"rock"},
            'g': {name:"grass2"},
            '2': {name:"grass2", edges:"b"},
            '3': {name:"grass2", edges:"l"},
            '5': {name:"grass2", edges:"bl"},
        },[
            'rrrrrrrrrr',
            'rssss3gggr',
            'rssss3gggr',
            'rssss3gggr',
            'sssss5222r',
            'rssssssssr',
            'rssssssssr',
            'rrrrrrrrrr',
        ]);
        space.addEntity(new EntityTransitioner(space.game, 16*8, 16*1, 16, 16, (e,t) => {
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
        space.setTile(1,0, {name:"roof", edges:"tl", variant:"green"});
        space.setTile(2,0, {name:"chimney"});
        space.setTile(3,0, {name:"roof", edges:"tr", variant:"green"});
        space.setTile(1,1, {name:"roof", edges:"bl", variant:"green"});
        space.setTile(2,1, {name:"roof", edges:"b", variant:"green"});
        space.setTile(3,1, {name:"roof", edges:"rb", variant:"green"});
        space.setTile(1,2, {name:"window"});
        space.setTile(2,2, {name:"doorway"});
        space.setTile(3,2, {name:"window"});

        //space.setTile(2,1,{name:"floorWood", variant:"carpet2"});
        space.addEntity(new EntityTransitioner(space.game, 16*2, 16*2, 16, 16, (e,t) => {
            let space = game.world.currentLayer.getSpace(1,1);
            game.sound.play('stairs');
            game.world.transitionTo(space, "building", () => {
                game.animations.enterUp().then(()=>{
                    game.dialog.display("Level 1\nA dusty home", true, true);
                });
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
        space.music = "house";
        space.fill({name:"floorWood"});
        space.setTiles({
            'fl': {name:"floorWood"},
            'wt': {name:"wallWood", variant:"t"},
            'wr': {name:"wallWood", variant:"r"},
            'wb': {name:"wallWood", variant:"b"},
            'wl': {name:"wallWood", variant:"l"},
            'c1': {name:"wallWood", variant:"tl"},
            'c2': {name:"wallWood", variant:"tr"},
            'c3': {name:"wallWood", variant:"bl"},
            'c4': {name:"wallWood", variant:"rb"},
            'dl': {name:"innerDoorway", variant:"left"},
            'dr': {name:"innerDoorway", variant:"right"},
        },[
            'c1wtwtwtwtwtwtwtwtc2',
            'wlflflflflflflflflwr',
            'wlflflflflflflflflwr',
            'wlflflflflflflflflwr',
            'wlflflflflflflflflwr',
            'wlflflflflflflflflwr',
            'wlflflflflflflflflwr',
            'c3wbwbwbdldrwbwbwbc4',
        ]);
        space.addEntity(new EntityTransitioner(game, 16*4+8, 16*7+8, 16, 8, (e,t) => {
            e.direction = 0; // look down
            game.sound.play('stairs');
            game.animations.exitDown().then(()=>{
                let space = game.world.currentLayer.getSpace(1,0);
                e.setPosition(2*16+8, 2*16+8+5)
                game.world.transitionTo(space, "building");
            });
        }));
    });
}