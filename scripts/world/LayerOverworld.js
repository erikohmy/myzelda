function LayerOverworld(game) {
    let layer = game.world.addLayer("overworld", 14, 14);
    
    // 0,0
    let space = new Space(game, 10, 8);
    layer.addSpace(space, 0, 0);
    space.fill({name:"sand"});
    space.border({name:"obstacle", variant:"rock"});
    space.setTile(3,4,{name:"obstacle", variant:"coconut"});
    space.setTile(4,5,{name:"obstacle", variant:"coconut"});
    space.setTile(1,7,{name:"sand"});
    space.setTile(2,7,{name:"sand"});
    space.setTile(3,7,{name:"sand"});
    space.setTile(4,7,{name:"sand"});
    space.setTile(5,7,{name:"sand"});
    space.setTile(6,7,{name:"sand"});
    space.setTile(7,7,{name:"sand"});
    space.setTile(8,7,{name:"sand"});
    space.setTile(9,4,{name:"sand"});
    
    // 1,0
    space = new Space(game, 10, 8);
    layer.addSpace(space, 1, 0);
    space.fill({name:"sand"});
    space.border({name:"obstacle", variant:"rock"});
    space.setTile(0,4,{name:"sand"});
    
    // 0,1
    space = new Space(game, 10, 8);
    layer.addSpace(space, 0, 1);
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
}