class Game {
    events = new EasyEvents();
    tickEvents = [];

    tilesize = 16;
    gridsize = [10, 9];
    offset = [0, 0];
    size = [0, 0];

    canvas = null;
    ctx = null;

    spritesheets = {};
    tiles = {};

    interface = null;
    world = null;
    sound = null;
    animations = {};

    ticking = false;
    gametick = 0;
    animationtick = 0;

    doGameLogic = true;
    doAnimation = true;
    cutscene = false;
    skipframe = false;
    hideplayer = false;

    camFollowPlayer = true;

    debug = false;

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { willReadFrequently: true });

        this.size = [this.tilesize * this.gridsize[0], this.tilesize * this.gridsize[1]];
        this.canvas.width = this.size[0];
        this.canvas.height = this.size[1];

        this.ctx.imageSmoothingEnabled = false;
        this.ctx.lineWidth = 1;

        // loading eventlisteners
        this.events.on('tile-adding', (name, tile, tag) => {console.info('adding tile:', name);});
        this.events.on('tile-added', (name, tile, tag, tileref) => {});
        this.events.on('tiles-generating', (tiles) => {console.info('generating tiles...');});
        this.events.on('tile-generating', (name, tileref) => {console.info('generating tile', name);});
        this.events.on('tile-generated', (name, tileref) => {});
        this.events.on('tiles-generated', (tiles) => {console.info('generated '+Object.keys(tiles).length+" tiles");});

        // transition eventlisteners
        this.events.on('space-transition-mid', (space) => {
            this.sound.playMusic(space.music);
        });
        this.events.on('space-transitioned', (space) => {});

        // create interface
        this.interface = new Interface(this, document.getElementById("main"));

        this.world = new World(this);
        this.world.player = new EntityPlayer(this, 16*5, 16*4);

        this.sound = new SoundHandler(this);

        this._fpsInterval = 1000/60;
        this._lastFrame = 0;
        /*
        let lastframes = 0;
        setInterval(() => {
            let fps = this.gametick-lastframes
            lastframes = this.gametick;
            console.log("fps:", fps);
        }, 1000);
        */
        this.animations.test1 = () => {
            return new Promise((resolve) => {
                let game = this;
                game.everyTick(120, (t, total) => {
                    if (t == 1) {
                        game.cutscene = true;
                        console.log('started cutscene of', total, "ticks");
                    }
                    if (t <= 30) { // walk down
                        game.world.player.walking = true;
                        game.world.player.move(0, 1);
                    }
                    if(t==31) { // wait
                        game.world.player.walking = false;
                    }
                    
                    if(t==60) { // look left
                        game.world.player.direction = 3; // left
                    }
                    if(t==90) { // look right
                        game.world.player.direction = 1; // right
                    }

                    if (t==total) {
                        game.world.player.direction = 2; // down
                        console.log('cutscene done');
                        game.cutscene = false;
                        resolve();
                    }
                });
            });
        };
        this.animations.enterUp = () => {
            return new Promise((resolve) => {
                let game = this;
                game.everyTick(24, (t, total) => {
                    game.cutscene = true;
                    game.world.player.direction = 0;
                    game.world.player.walking = true;
                    game.world.player.move(0, -1);
                    if (t==total) {
                        game.world.player.walking = false;
                        game.cutscene = false;
                        resolve();
                    }
                });
            });
        };
        this.animations.exitDown = () => {
            return new Promise((resolve) => {
                let game = this;
                game.everyTick(24, (t, total) => {
                    game.cutscene = true;
                    game.world.player.direction = 2;
                    game.world.player.walking = true;
                    game.world.player.move(0, 1);
                    if (t==total) {
                        game.world.player.walking = false;
                        game.cutscene = false;
                        resolve();
                    }
                });
            });
        };
    }

    // helpers
    async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    // loading
    async addTile(name, tile) {
        let tag = document.createElement("script");
        this.events.trigger('tile-adding', name, tile, tag);
        tag.type = "text/javascript";
        tag.src = "scripts/tiles/" + tile + ".js";
        let promise = new Promise((resolve, reject) => {
            tag.onload = resolve;
            tag.onerror = reject;
        });
        document.head.appendChild(tag);
        await promise;
        eval(`new ${tile}(this, name)`); // this is a bit of a hack
        this.events.trigger('tile-added', name, tile, tag, this.tiles[name]);
    }

    async addSounds() {
        await this.sound.addSound("stairs", "./assets/sound/Stairs.wav");

        await this.sound.addSound("link_hurt", "./assets/sound/Link_Hurt.wav");

        // music
        await this.sound.addMusic("overworld", "./assets/sound/music/overworld.mp3", 6.42);
        await this.sound.addMusic("house", "./assets/sound/music/house.mp3");
    }

    async start() {
        await this.loadSpritesheets();
        await this.addTiles();
        await this.generateTiles();
        await this.addSounds();
        console.clear();
        console.pretty("[label-success:success] All assets loaded.")
        this.generateWorld();
        this.loop();
    }

    async loadSpritesheets() {
        let ui = await this.loadImage("./assets/ui.png");
        this.spritesheets.ui = new SpriteSheet(ui, 8);

        let player = await this.loadImage("./assets/player.png");
        this.spritesheets.player = new SpriteSheet(player, 16);

        let overworld = await this.loadImage("./assets/overworld8x8.png");
        this.spritesheets.overworld = new SpriteSheet(overworld, 8);

        let buildings = await this.loadImage("./assets/buildings.png");
        this.spritesheets.buildings = new SpriteSheet(buildings, 8);

        let animated = await this.loadImage("./assets/animated.png");
        this.spritesheets.animated = new SpriteSheet(animated, 8);
    }

    async addTiles() {
        await this.addTile("grass", "TileGrass");
        await this.addTile("grass2", "TileGrassVariant");
        await this.addTile("gravel", "TileGravel");
        await this.addTile("gravelRough", "TileGravelRough");
        await this.addTile("sand", "TileSand");
        await this.addTile("obstacle", "TileObstacle");
        await this.addTile("water", "TileWater");
        await this.addTile("puddle", "TilePuddle");

        await this.addTile("roof", "TileRoof");
        await this.addTile("roofShack", "TileRoofShack");
        await this.addTile("window", "TileWindow");
        await this.addTile("doorway", "TileDoorway");
        await this.addTile("chimney", "TileChimney");
        await this.addTile("wallWood", "TileWallWood");
        await this.addTile("floorWood", "TileFloorWood");
        await this.addTile("innerDoorway", "TileInnerDoorway");
    }

    async generateTiles() {
        // generate all tiles
        this.events.trigger('tiles-generating', this.tiles);
        for (let name in this.tiles) {
            let tile = this.tiles[name];
            this.events.trigger('tile-generating', name, tile);
            await tile.generate();
            this.events.trigger('tile-generated', name, tile);
        }
        this.events.trigger('tiles-generated', this.tiles);
    }

    generateWorld() {
        // create layers ( maybe find a better way?)
        LayerOverworld(this);

        this.world.currentLayer = this.world.layers.overworld;
        this.world.currentSpace = this.world.currentLayer.getSpace(0, 0);
    }

    // logic
    loop() {
        if (!this.ticking) {
            this.tick();
        }
        window.requestAnimationFrame(() => this.loop());
    }

    async tick() {
        this.ticking = true;
        // for testing
        //this.offset[0] += 1;
        //this.offset[1] -= 1;

        let now = Date.now();
        let elapsed = now - this._lastFrame;
        if (this._lastFrame !== undefined) {
            if (elapsed < this._fpsInterval) {
                this.ticking = false;
                return;
            }
        }

        this._lastFrame = now - (elapsed % this._fpsInterval);

        let player = this.world.player;
        let space = this.world.currentSpace;

        if (this.camFollowPlayer) {
            let worldOffset = [0, 0];

            // follow player
            worldOffset[0] = -Math.round(player.x - this.canvas.width/2);
            worldOffset[1] = -Math.round(player.y - this.canvas.height/2);

            // clamp world offset to space size
            let spaceSize = [space.size[0]*this.tilesize, space.size[1]*this.tilesize];
            worldOffset[0] = Math.max(worldOffset[0], -spaceSize[0]+this.canvas.width);
            worldOffset[0] = Math.min(worldOffset[0], 0);
            worldOffset[1] = Math.max(worldOffset[1], -spaceSize[1]+(this.canvas.height-16));
            worldOffset[1] = Math.min(worldOffset[1], 0);

            this.offset[0] = worldOffset[0];
            this.offset[1] = worldOffset[1];
        }

        if (this.doGameLogic && !this.cutscene && !this.world.transitioning) {
            let c_up = this.interface.isControlHeld("up");
            let c_right = this.interface.isControlHeld("right");
            let c_down = this.interface.isControlHeld("down");
            let c_left = this.interface.isControlHeld("left");

            // move player
            if (!player.isColliding() || player.isColliding() && this.gametick % 2 == 0) {
                player.walking = false;
                if (c_up) {
                    player.direction=0;
                    player.walking=true;
                    player.move(0, -1);
                } else if (c_down) {
                    player.direction=2;
                    player.walking=true;
                    player.move(0, 1);
                }

                if (c_left) {
                    player.direction=3;
                    player.walking=true;
                    player.move(-1, 0);
                } else if (c_right) {
                    player.direction=1;
                    player.walking=true;
                    player.move(1, 0);
                }
            }
            this.tickEvents.forEach(event => {
                if (event.type === "logic") {
                    event.left--;
                    if (event.left <= 0) {
                        event.resolve();
                    }
                    if(!!event.every) {
                        event.every(event.ticks - event.left, event.ticks);
                    }
                }
            });

            // if player is outside the space to the rigt, transition to the next space
            if (player.x > space.size[0]*this.tilesize) {
                let nextspace = this.world.currentLayer.getSpace(space.x+1, space.y);
                
                if (nextspace) {
                    player.x = 0;
                    await this.world.transitionTo(nextspace, "slideleft");
                }
            }
            // if player is outside the space to the left, transition to the previous space
            else if (player.x < 0) {
                let prevspace = this.world.currentLayer.getSpace(space.x-1, space.y);
                if (prevspace) {
                    player.x = (prevspace.size[0]*this.tilesize);
                    await this.world.transitionTo(prevspace, "slideright");
                }
            }
            // if player is outside the space to the bottom, transition to the next space
            if (player.y > space.size[1]*this.tilesize) {
                let nextspace = this.world.currentLayer.getSpace(space.x, space.y+1);
                if (nextspace) {
                    player.y = 0;
                    await this.world.transitionTo(nextspace, "slideup");
                }
            }
            // if player is outside the space to the top, transition to the previous space
            else if (player.y < 0) {
                let prevspace = this.world.currentLayer.getSpace(space.x, space.y-1);
                if (prevspace) {
                    player.y = (prevspace.size[1]*this.tilesize);
                    await this.world.transitionTo(prevspace, "slidedown");
                }
            }

            // update entities
            for (let i=0; i<space.entities.length; i++) {
                let entity = space.entities[i];
                if (!!entity.logic) {
                    entity.logic();
                }
            }
        } else if(this.world.transitioning) {
            // disable all triggers we are inside ( they get reenabled by not being triggered)
            for (let i=0; i<space.entities.length; i++) {
                let entity = space.entities[i];
                if (entity instanceof EntityTrigger) {
                    entity.tempDisabled = true;
                }
            }
            let transition = this.world.transition;
            if (transition == "slideleft" || transition == "slideright" || transition == "slideup" || transition == "slidedown") {
                let tick = this.gametick - this.world.transitionStart;
                let stepsize = 4;
                let steps = 0;
                if (transition=="slideleft") {
                    steps = this.canvas.width/stepsize;
                    if(player.x < 8) {
                        player.x+=0.25;
                    }
                    this.offset[0] = this.canvas.width - tick*stepsize;
                } else if (transition=="slideright") {
                    steps = this.canvas.width/stepsize;
                    if(player.x > this.world.currentSpace.size[0]*this.tilesize-8) {
                        player.x-=0.25;
                    }
                    this.offset[0] = -this.canvas.width + tick*stepsize;
                } else if (transition=="slideup") {
                    steps = (this.canvas.height-16)/stepsize;
                    if(player.y < 8) {
                        player.y+=0.25;
                    }
                    this.offset[1] = (this.canvas.height-16) - tick*stepsize;
                } else if (transition=="slidedown") {
                    steps = (this.canvas.height-16)/stepsize;
                    if(player.y > this.world.currentSpace.size[1]*this.tilesize-8) {
                        player.y-=0.25;
                    }
                    this.offset[1] = -(this.canvas.height-16) + tick*stepsize;
                }
                if(tick == Math.floor(steps/2)) {
                    this.events.trigger('space-transition-mid', this.world.currentSpace);
                }
                if (tick >= steps) {
                    this.world.transitioning = false;
                    this.world.transitionCallback();
                    this.events.trigger('space-transitioned', this.world.currentSpace);
                }
            } else if(transition == "building") { // fade out, then "open" white screen
                let tick = this.gametick - this.world.transitionStart;
                // half second fade, and quarter second "open"
                if(tick == 30) {
                    this.events.trigger('space-transition-mid', this.world.currentSpace);
                }
                if (tick > 45) {
                    this.world.transitioning = false;
                    this.world.transitionCallback();
                    this.events.trigger('space-transitioned', this.world.currentSpace);
                }
            } else {
                this.events.trigger('space-transition-mid', this.world.currentSpace);
                this.world.transitioning = false;
                this.world.transitionCallback();
                this.events.trigger('space-transitioned', this.world.currentSpace);
                console.log('no transition')
            }
        }

        if (this.doAnimation && !this.world.transitioning) {
            this.animationtick++;
            this.tickEvents.forEach(event => {
                if (event.type === "animation") {
                    event.left--;
                    if (event.left <= 0) {
                        event.resolve();
                    }
                    if(!!event.every) {
                        event.every(event.ticks - event.left, event.ticks);
                    }
                }
            });
        }
        if (this.skipframe) {
            this.skipframe = false;
        } else {
            this.render();
        }
        this.gametick++;
        this.tickEvents.forEach(event => {
            if (event.type === "game") {
                event.left--;
                if (event.left <= 0) {
                    event.resolve();
                }
                if(!!event.every) {
                    event.every(event.ticks - event.left, event.ticks);
                }
            }
        });
        // cleanup events with 0 left
        this.tickEvents.forEach(event => {
            if (event.left <= 0) {
                this.tickEvents.splice(this.tickEvents.indexOf(event), 1);
            }
        });
        this.ticking = false;
    }

    waitTicks(ticks, type="game") {
        return new Promise((resolve, reject) => {
            this.tickEvents.push({
                'ticks': ticks,
                'left': ticks,
                'type': type,
                'resolve': resolve
            });
        });
    }
    // do something for every tick for a certain amount of ticks
    everyTick(ticks, callback, type="game") {
        this.tickEvents.push({
            'ticks': ticks,
            'left': ticks,
            'type': type,
            'resolve': () => {},
            'every': callback
        });
    }

    // graphics
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    setColor(color) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
    }
    drawGrid() {
        // draw grid, making sure its infinite if offset
        const x = this.offset[0] % this.tilesize;
        const y = this.offset[1] % this.tilesize;
        const w = this.size[0];
        const h = this.size[1];
        const sw = this.tilesize;
        const sh = this.tilesize;
        const ox = x;
        const oy = y;
        const ow = w + x;
        const oh = h + y;
        for (let i = ox; i <= ow; i += sw) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, oy);
            this.ctx.lineTo(i, oh);
            this.ctx.stroke();
        }
        for (let i = oy; i <= oh; i += sh) {
            this.ctx.beginPath();
            this.ctx.moveTo(ox, i);
            this.ctx.lineTo(ow, i);
            this.ctx.stroke();
        }
    }

    renderUi() {
        // draw the white bar
        this.setColor("#FFF");
        this.ctx.fillRect(0, 0, this.canvas.width, 16);

        let player = this.world.player;
        let maxHealth = player.maxHealth;
        let health = player.health;
        
        // for every two health, draw a heart
        for (let i=0; i<maxHealth; i+=4) {
            let heart_num = Math.floor(i/4); // which heart, starting from 0
            let x = (heart_num%7)*8 + this.canvas.width-56;
            let y = heart_num >= 7 ? 8 : 0;
            if (health >= i+4) { // full heart
                this.spritesheets.ui.drawSprite(this.ctx, 4, 0, x, y);
            } else if (health == i+3) { // 3/4 heart
                this.spritesheets.ui.drawSprite(this.ctx, 3, 0, x, y);
            } else if (health == i+2) { // half heart
                this.spritesheets.ui.drawSprite(this.ctx, 2, 0, x, y);
            } else if (health == i+1) { // quarter heart
                this.spritesheets.ui.drawSprite(this.ctx, 1, 0, x, y);
            } else {
                this.spritesheets.ui.drawSprite(this.ctx, 0, 0, x, y);
            }
        }
    }

    drawHitBox(x, y, w, h) {
        // draw a hitbox, rectangle with a cross in it
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x+w, y+h);
        this.ctx.moveTo(x+w, y);
        this.ctx.lineTo(x, y+h);
        this.ctx.stroke();
    }

    render() {
        this.clear();
        //this.drawGrid();
        let offsetY = this.offset[1];
        this.offset[1] = this.offset[1]+16; // offset for ui
        let space = this.world.currentSpace;

        this.setColor(space.background);
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // draw tiles
        for (let y=0; y<space.size[1]; y++) {
            for (let x=0; x<space.size[0]; x++) {
                let tile = space.tiles[y*space.size[0]+x];
                if (tile) {
                    let xpos = x*this.tilesize+this.offset[0];
                    let ypos = y*this.tilesize+this.offset[1];
                    let tileClass = this.tiles[tile.name];
                    if (tileClass) {
                        tileClass.draw(this.ctx, xpos, ypos, tile);
                    } else {
                        console.error("tile not found:", tile.name);
                    }
                }
            }
        }

        // debug, draw collision boxes
        if (this.debug) {
            space.getCollisionBoxes().forEach(box => {
                this.setColor("#FF0000DD");
                this.drawHitBox(box.x+this.offset[0], box.y+this.offset[1], box.w, box.h);
                //this.ctx.fillRect(box.x+this.offset[0], box.y+this.offset[1], box.w, box.h);
                //this.setColor("#FF0000"); // red
                //this.ctx.strokeRect(box.x+this.offset[0], box.y+this.offset[1], box.w, box.h);
            });

            space.entities.forEach(e => {
                if(e instanceof EntityTrigger) {
                    this.setColor("#0000FFDD");
                    if(e.tempDisabled) {
                        this.setColor("#FF0000DD");
                    }
                    
                    this.drawHitBox(e.x+this.offset[0], e.y+this.offset[1], e.w, e.h);
                } else if(e.hasOwnProperty("x")) {
                    this.setColor("#0000FFDD");
                    this.ctx.fillRect(e.x+this.offset[0]-1, e.y+this.offset[1]-1, 2, 2);
                }
            });

            /*
            space.getCollisionBoxes("dig").forEach(box => {
                this.setColor("#00FF0044"); // transparent green
                this.ctx.fillRect(box.x+this.offset[0], box.y+this.offset[1], box.w, box.h);
                this.setColor("#00FF00"); // green
                this.ctx.strokeRect(box.x+this.offset[0], box.y+this.offset[1], box.w, box.h);
            });
            */

            space.getCollisionBoxes("wet").forEach(box => {
                this.setColor("#0099ff66"); // transparent light blue
                this.ctx.fillRect(box.x+this.offset[0], box.y+this.offset[1], box.w, box.h);
                this.setColor("#0099FF"); // light blue
                this.ctx.strokeRect(box.x+this.offset[0], box.y+this.offset[1], box.w, box.h);
            });

            space.getCollisionBoxes("swim").forEach(box => {
                this.setColor("#0000ff77"); // transparent blue
                this.ctx.fillRect(box.x+this.offset[0], box.y+this.offset[1], box.w, box.h);
                this.setColor("#0000FF"); // blue
                this.ctx.strokeRect(box.x+this.offset[0], box.y+this.offset[1], box.w, box.h);
            });
        }

        let player = this.world.player;
        if (!this.hideplayer && !this.world.transitioning) {
            player.draw();
        }

        this.renderUi(); 
        // if we are transitioning, draw that!
        if (this.world.transitioning) {
            let transition = this.world.transition;
            if (transition == "slideleft" || transition == "slideright" || transition == "slideup" || transition == "slidedown") {
                let snapshot = this.world.snapshot;
                let tick = this.gametick - this.world.transitionStart;
                if (transition=="slideleft") {
                    this.ctx.drawImage(snapshot, -tick*4, 16);
                } else if (transition=="slideright") {
                    this.ctx.drawImage(snapshot, tick*4, 16);
                } else if (transition=="slideup") {
                    this.ctx.drawImage(snapshot, 0, -tick*4+16);
                } else if (transition=="slidedown") {
                    this.ctx.drawImage(snapshot, 0, tick*4+16);
                }
                player.draw();
                this.renderUi(); // render ui again to make sure it is on top
            } else if(transition == "building") { // fade out for a second, then "open" white screen for half
                let snapshot = this.world.snapshot;
                let tick = this.gametick - this.world.transitionStart;
                player.draw();
                this.renderUi(); // render ui again to make sure it is on top
                if (tick < 30) {
                    this.ctx.drawImage(snapshot, 0, 16);
                }
                let alpha = Math.min((tick/30) * 1, 1);
                this.setColor(`rgba(255,255,255,${alpha})`);
                if (tick > 30) {
                    let width = this.canvas.width/2;
                    let slide = tick > 30 ? (tick-30)*(width/15) : 0;
                    this.ctx.fillRect(0-slide, 16, width, this.canvas.height-16);
                    this.ctx.fillRect(width+slide, 16, width, this.canvas.height-16);
                } else {
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }
            }
        }
        // reset offset to what it was
        this.offset[1] = offsetY;
    }
    async snapshot() {
        // get imagedata of the canvas, excluding the ui
        let data = this.ctx.getImageData(0, 16, this.canvas.width, this.canvas.height-16);
        // turn this into a b64 image
        let canvas = document.createElement("canvas");
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height-16;
        let ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.putImageData(data, 0, 0);
        let img = new Image();
        img.src = canvas.toDataURL();
        await img.decode();
        return img;
    }

}

class SpriteSheet {
    image;
    spritesize;
    constructor(image, spritesize) {
        this.image = image;
        this.spritesize = spritesize;
    }
    // context, sprite x, sprite y, position x, position y
    drawSprite(ctx, x, y, px, py) {
        ctx.drawImage(this.image, x*this.spritesize, y*this.spritesize, this.spritesize, this.spritesize, px, py, this.spritesize, this.spritesize);
    }
}