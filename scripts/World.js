class World {
    game;
    
    layers = {};
    currentLayer;
    currentSpace;
    player;

    constructor(game) {
        this.game = game;
        this.currentLayer = null;
        this.currentSpace = null;
        this.player = null;
    }

    addLayer(name, sizex, sizey) {
        let layer = new WorldLayer(name, sizex, sizey);
        this.layers[name] = layer;
        return layer;
    }
}

class WorldLayer {
    name;
    sizex; 
    sizey;
    dungeon; 
    spaces;

    options; // filter, music, map, etc

    constructor(name, sizex, sizey) {
        this.name = name;
        this.sizex = sizex;
        this.sizey = sizey;
        this.dungeon = null;
        this.options = {};
        // spaces is a 2d array of spaces. spaces[x][y] = space
        this.spaces = new Array(sizex);
        for (let x = 0; x < sizex; x++) {
            this.spaces[x] = new Array(sizey);
        }
    }

    addSpace(space, x, y) {
        this.spaces[x][y] = space;
        return space;
    }
}