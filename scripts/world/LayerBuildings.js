function LayerBuildings(game) {
    let layer = game.world.addLayer("buildings", 14, 14);
    
    layer.createSpace(0, 0, 10, 8, function(space) {
        space.onenter = function() {
            game.waitTicks(24).then(()=>{
                game.dialog.display("Level 1\nA dusty home", true, true);
            });
        }
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
                let space = game.world.layers.overworld.getSpace(1,0);
                e.setPosition(2*16+8, 2*16+8+5)
                game.world.transitionTo(space, "building");
            });
        }));
    });
}