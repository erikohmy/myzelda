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
        if (typeof transition !== "string") {
            console.error("transition must be a string", transition);
        }
        if (this.transitioning) {
            return;
        }
        this.transitioning = true;
        this.transition = null; // reset transition

        if (this.currentSpace) { // if we have a newly started game, no previous space, then we cant snapshot
            // take a snapshot of the current space, without the player
            if (transition === "slideup" || transition === "slidedown" || transition === "slideleft" || transition === "slideright") {
                this.game.hideplayer = true;
                this.game.render();
            } else {
                // drop any items the player is holding, only allowed to carry items between spaces if we are walking between spaces
                this.game.player.forceDrop();
                this.game.noRender = true; // skip rendering
            }
            if (transition !== "none") {
                this.snapshot = await this.game.snapshot();
            }
        }
        this.game.hideplayer = false;
        this.transition = transition;
        this.transitionStart = this.game.gametick;
        this.transitionCallback = callback || (() => {});

        this.game.skipframe = true; // skip one frame of animation

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
        if (this.currentSpace && this.currentSpace.onleave) {
            this.currentSpace.onleave();
        }

        space.safeSpot = null;
        this.currentSpace = space;
        this.currentLayer = space.layer;
        this.player.space = space;
        this.player.previousTile = null;
        this.player.setPushingEntity(null);
        this.game.noRender = false; // re-enable rendering
    }

    async goTo(layername, sx=undefined, sy=undefined, px=undefined, py=undefined, dir=undefined, transition="none", callback) {
        let layer = this.layers[layername];
        if (!layer) {
            console.error("layer not found", layername);
            return;
        }
        if (!sx) {sx = 0;}
        if (!sy) {sy = 0;}
        let space = layer.getSpace(sx, sy);
        if (!space) {
            console.error("space not found", sx, sy);
            return;
        }
        if(px) {this.player.position[0] = px;}
        if(py) {this.player.position[1] = py;}
        if(dir) {this.player.direction = dir;}
        await this.transitionTo(space, transition, callback);
    }

    goToString(str) {
        let parts = str.split(":");
        let layer = parts[0];
        let coords = parts[1].split(",");
        let space = this.layers[layer].getSpace(coords[0], coords[1]);

        if(!space) {
            console.error("space not found", layer, coords);
            return false;
        }
        
        if (parts.length === 2) { // layer:space
            this.transitionTo(space, "none");
        } else if(parts.length === 3 || parts.length === 4 || parts.length === 5 || parts.length === 6 || parts.length === 7) {
            // layer:space:target
            // layer:space:target:animation
            // layer:space:target:animation:animationOut
            // layer:space:target:animation:animationOut:sound
            // layer:space:target:animation:animationOut:sound:transition
            let target = parts[2];
            let animation = parts.length >= 4 ? parts[3] : null;
            let animationOut = parts.length >= 5 ? parts[4] : null;
            let sound = parts.length >= 6 ? parts[5] : "stairs";
            let transition = parts.length >= 7 ? parts[6] : "building";
            if (sound !== "none") {
                this.game.sound.play(sound);
            }
            let fn = () => {
                this.transitionTo(space, transition).then(()=>{
                    
                    let targetEntity = space.entities.filter(e => e instanceof EntityTransitionTarget && e.targetName === target)[0];
                    if (targetEntity) {
                        this.player.setPosition(targetEntity.x, targetEntity.y);
                        this.player.direction = targetEntity.direction;
                        if (targetEntity.onenter) {
                            this.transitionCallback = targetEntity.onenter;
                        } else if(animationOut && this.game.animations[animationOut]) {
                            this.transitionCallback = () => this.game.animations[animationOut]();
                        }
                    } else if(animationOut && this.game.animations[animationOut]) {
                        this.game.animations[animationOut]();
                    }
                });
            };
            if (animation && this.game.animations[animation]) {
                this.game.animations[animation]().then(fn);
            } else {
                fn();
            }
        } else {
            console.warn("format not implemented yet", str);
        }
        return true;
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

    createSpace(x, y, w, h, build, init) {
        let space = new Space(this.game, w, h);
        this.addSpace(space, x, y);
        space.build = build;
        space.init = init;
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