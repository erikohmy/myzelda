class World {
    game;
    
    layers = {};
    currentLayer;
    currentSpace;
    player;

    transitioning = false;
    transition = "none";
    transitionStart = 0;
    snapshot = null;

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

    async transitionTo(space, transition="none") {
        if (this.transitioning) {
            return;
        }
        this.transitioning = true;
        this.transition = transition;
        this.transitionStart = this.game.gametick;
        this.snapshot = await this.game.snapshot();
        this.currentSpace = space;
        this.currentLayer = space.layer;
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
        space.layer = this;
        return space;
    }

    getSpace(x, y) {
        if (x < 0 || y < 0 || x >= this.sizex || y >= this.sizey) {
            return null;
        }
        let col = this.spaces[x];
        if (col === undefined) {
            return null;
        }
        return this.spaces[x][y];
    }

    getSpacePosition(space) {
        let x=0;
        let y=0;
        for (let i = 0; i < this.spaces.length; i++) {
            let col = this.spaces[i];
            for (let j = 0; j < col.length; j++) {
                if (col[j] === space) {
                    x = i;
                    y = j;
                    break;
                }
            }
        }
        return [x, y];
    }
}