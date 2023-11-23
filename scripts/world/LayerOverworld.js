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
        space.border({name:"obstacle", variant:"rock",  background:"sand"});
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
        space.background = "#f8e010";
        space.setTiles({
            ' ': null,
            's': {name:"sand"},
            'r': {name:"obstacle", variant:"rock", background:"sand"},
            'g': {name:"grass2"},
            '2': {name:"grass2", edges:"b"},
            '3': {name:"grass2", edges:"l"},
            '5': {name:"grass2", edges:"bl"},
            'h': {name: "hole"}
        },[
            'rrrrrrrrrr',
            'rssss3hggr',
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
        space.setTile(0,5, {name:"obstacle", variant:"poles2", background:"sand"});

        space.setTile(7,7,{name:"road"});
        space.setTile(2,7,{name:"road"});

        //space.setTile(2,1,{name:"floorWood", variant:"carpet2"});
        space.addEntity(new EntityTransitioner(space.game, 16*2, 16*2, 16, 16, (e,t) => {
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
            'gg': {name:"grass", variant:"c"},
            'g2': {name:"grass", edges:"rb"},
            'fl': {name:"flowers"},
            'ro': {name:"road"},
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
            '06': {name:'road'},
            '07': {name:'roof', edges: 'tl'},
            '08': {name:'chimney'},
            '09': {name:'roof', edges: 'tr'},
            '0a': {name:'obstacle', variant: 'poles2'},
            '0b': {name:'roof', edges: 'bl'},
            '0c': {name:'roof', edges: 'b'},
            '0d': {name:'roof', edges: 'rb'},
            '0e': {name:'window'},
            '0f': {name:'doorway'},
            '10': {name:'obstacle'},
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
}