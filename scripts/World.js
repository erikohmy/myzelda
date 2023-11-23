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
        let layer = new WorldLayer(this.game, name, sizex, sizey);
        this.layers[name] = layer;
        return layer;
    }

    async transitionTo(space, transition="none", callback) {
        if (this.transitioning) {
            return;
        }

        // take a snapshot of the current space, without the player
        if (transition === "slideup" || transition === "slidedown" || transition === "slideleft" || transition === "slideright") {
            this.game.hideplayer = true;
            this.game.render();
        } else {
            this.game.noRender = true; // skip rendering
        }
        if (transition !== "none") {
            this.snapshot = await this.game.snapshot();
        }
        this.game.hideplayer = false;

        this.transitioning = true;
        this.game.skipframe = true; // skip one frame of animation
        this.transition = transition;
        this.transitionStart = this.game.gametick;
        this.transitionCallback = callback || (() => {});

        if (this.currentSpace) { // todo: sometimes we dont want to destroy the current space, like in dungeons
            this.currentSpace._destroy();
        }
        if (!space.built) {
            space._build(space);
        } else {
            console.log("space already built", space.tiles);
        }
        if (space.onenter) {
            this.game.everyTick(0, () => {
                if (!game.world.transitioning) {
                    space.onenter();
                    return false;
                }
            });
        }
        if (space.onleave) {
            space.onleave();
        }

        space.safeSpot = null;
        this.currentSpace = space;
        this.currentLayer = space.layer;
        this.player.space = space;
        this.game.noRender = false; // re-enable rendering
    }
}

class WorldLayer {
    game;

    name;
    sizex; 
    sizey;
    dungeon; 
    spaces;

    options; // filter, music, map, etc

    constructor(game, name, sizex, sizey) {
        this.game = game;
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

    get background() {
        let bg = this.options.background;
        if (bg) {
            return bg;
        }
        return Graphics.colors.zyellow;
    }
    set background(bg) {
        this.options.background = bg;
    }

    get music() {
        // check if there is a music option on the layer
        if (this.options.music) {
            return this.options.music;
        }
        // and if not, then return null
        return null;
    }
    set music(music) {
        return this.options.music = music;
    }

    addSpace(space, x, y) {
        this.spaces[x][y] = space;
        space.layer = this;
        return space;
    }

    createSpace(x, y, w, h, build) {
        let space = new Space(this.game, w, h);
        this.addSpace(space, x, y);
        space.build = build;
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