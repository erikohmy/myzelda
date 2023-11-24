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