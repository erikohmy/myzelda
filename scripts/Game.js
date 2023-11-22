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
    dialog = null;
    animations = {};

    ticking = false;
    gametick = 0;
    animationtick = 0;
    walkticks = 0;

    doGameLogic = true;
    doAnimation = true;
    cutscene = false;
    skipframe = false;
    noRender = false;
    hideplayer = false;

    camFollowPlayer = true;

    tps = 0;
    debug = false;

    gameReady = false;
    started = false;

    loader = null;

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { willReadFrequently: true });

        this.size = [this.tilesize * this.gridsize[0], this.tilesize * this.gridsize[1]];
        this.canvas.width = this.size[0];
        this.canvas.height = this.size[1];

        this.ctx.imageSmoothingEnabled = false;
        this.ctx.lineWidth = 1;

        this.loader = new NiceLoader(this);
        this.events.on('ready', () => {this.canvas.classList.add('ready')});

        // transition eventlisteners
        this.events.on('space-transition-mid', (space) => {
            this.sound.playMusic(space.music);
        });
        this.events.on('space-transitioned', (space) => {});

        this.events.on('pressed', (control) => {
            if (!this.started) {
                this.start();
                return;
            }
            if (control === "a") {
                if (this.dialog.show) {
                    this.dialog.next();
                    return;
                }
                if (!this.player.isBusy) {
                    this.player.actionMain();
                }
            }
            if (this.dialog.show && this.dialog.anyNext) {
                this.dialog.next();
                return;
            }
        });

        this.events.on('control-map', () => {
            console.log("toggle map");
        });

        // create interface
        this.interface = new Interface(this, document.getElementById("main"));

        this.world = new World(this);
        this.world.player = new EntityPlayer(this, 0, 0);
        this.player = this.world.player;

        this.sound = new SoundHandler(this);
        this.dialog = new Dialog(this);

        this._fpsInterval = 1000/60;
        this._lastFrame = 0;
        
        let lastframes = 0;
        let tpsInterval = 10;
        let tpsSet = new Array(tpsInterval).fill(0);
        setInterval(() => {
            tpsSet.push((this.gametick-lastframes));
            tpsSet.shift();
            const sum = tpsSet.reduce((a, b) => a + b, 0);
            this.tps = sum;
            lastframes = this.gametick;
        }, 1000/tpsInterval);
        
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
    tile(tileOrTileRef) {
        if (tileOrTileRef && tileOrTileRef.hasOwnProperty('name')) {
            return this.tiles[tileOrTileRef.name];
        }
        return null;
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
        this.events.trigger('sounds-adding');
        await this.sound.addSound("stairs", "./assets/sound/Stairs.wav");
        await this.sound.addSound("block_push", "./assets/sound/Block_Push.wav");

        await this.sound.addSound("link_hurt", "./assets/sound/Link_Hurt.wav");
        await this.sound.addSound("link_fall", "./assets/sound/Link_Fall.wav");
        await this.sound.addSound("link_wade", "./assets/sound/Link_Wade.wav");

        await this.sound.addSound("text_letter", "./assets/sound/Text_Letter.wav");
        await this.sound.addSound("text_done", "./assets/sound/Text_Done.wav");

        // music
        await this.sound.addMusic("overworld", "./assets/sound/music/overworld.mp3", 6.42);
        await this.sound.addMusic("house", "./assets/sound/music/house.mp3");
        this.events.trigger('sounds-added');
    }

    async load() {
        await this.loadSpritesheets();
        await this.addTiles();
        await this.generateTiles();
        await this.addSounds();
        await this.generateWorld();

        this.sound.volume = 0.2;
        this.gameReady = true;
        this.events.trigger('ready');
    }

    start() {
        this.started = true;
        this.world.player.setPosition(16*5, 16*4);
        this.world.transitionTo(this.world.layers.overworld.getSpace(0, 0), "none");
        this.loop();
        // ensure stable tps
        setInterval(() => {
            if (!this.ticking) {
                this.tick();
            }
        }, 8);
    }

    async loadSpritesheets() {
        this.events.trigger('sprites-adding');
        let ui = await this.loadImage("./assets/ui.png");
        this.spritesheets.ui = new SpriteSheet(ui, 8);

        let player = await this.loadImage("./assets/player.png");
        this.spritesheets.player = new SpriteSheet(player, 16);

        let overworld = await this.loadImage("./assets/overworld8x8.png");
        this.spritesheets.overworld = new SpriteSheet(overworld, 8);

        let dungeonCommon = await this.loadImage("./assets/dungeoncommon.png");
        this.spritesheets.dungeonCommon = new SpriteSheet(dungeonCommon, 16);
        await this.spritesheets.dungeonCommon.generatePallet('red', {
            "42,130,176": "197,75,44",
            "77,201,245": "240,180,187"
        })

        let buildings = await this.loadImage("./assets/buildings.png");
        this.spritesheets.buildings = new SpriteSheet(buildings, 8);

        let animated = await this.loadImage("./assets/animated.png");
        this.spritesheets.animated = new SpriteSheet(animated, 8);
        this.events.trigger('sprites-added');

        let effects = await this.loadImage("./assets/effects.png");
        this.spritesheets.effects = new SpriteSheet(effects, 8);
    }

    async addTiles() {
        this.events.trigger('tiles-adding');
        await this.addTile("grass", "TileGrass");
        await this.addTile("grass2", "TileGrassVariant");
        await this.addTile("gravel", "TileGravel");
        await this.addTile("gravelRough", "TileGravelRough");
        await this.addTile("sand", "TileSand");
        await this.addTile("obstacle", "TileObstacle");
        await this.addTile("hole", "TileHole");
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
        this.events.trigger('tiles-added');
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

    async generateWorld() {
        this.events.trigger('world-generating');
        await LayerOverworld(this);
        this.events.trigger('world-generated');
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
        if (this.gametick % 4 == 0) {
            this.dialog.tick();
        }

        if (this.doGameLogic && !this.cutscene && !this.world.transitioning && !this.dialog.show) {

            // set space safeSpot if not set
            if (!space.safeSpot) {
                space.safeSpot = [player.x, player.y];
            }

            let c_up = this.interface.isControlHeld("up");
            let c_right = this.interface.isControlHeld("right");
            let c_down = this.interface.isControlHeld("down");
            let c_left = this.interface.isControlHeld("left");
            let c_anydir = c_up || c_right || c_down || c_left;
            let c_multidir = (c_up || c_down) && (c_left || c_right);

            // update entities
            player.tick();
            for (let i=0; i<space.entities.length; i++) {
                let entity = space.entities[i];
                if (!!entity.logic) {
                    entity.logic();
                }
                if (!!entity.tick) {
                    entity.tick();
                }
            }

            if (!player.isBusy) {
                // pushing
                if (c_anydir && !c_multidir) {
                    if (player.collideEntity) {
                        player.setPushingEntity(player.collideEntity);
                    } else if (!player.collideEntity && player.pushingEntity) {
                        player.setPushingEntity(null);
                    }
                } else {
                    player.setPushingEntity(null);
                }
                
                // walking
                player.walking = c_anydir;
                let mx = 0;
                let my = 0;

                if (c_up) {
                    player.direction=0;
                    my = -player.moveSpeed;
                } else if (c_down) {
                    player.direction=2;
                    my = player.moveSpeed;
                }
                if (c_left) {
                    player.direction=3;
                    mx = -player.moveSpeed;  
                } else if (c_right) {
                    player.direction=1;
                    mx = player.moveSpeed;  
                }
                if (mx !== 0 || my !== 0) {
                    if (player.inPuddle && (this.walkticks+1)%20 === 0) {
                        this.sound.play("link_wade");
                    }
                    player.move(mx, my);
                    this.walkticks++;
                } else {
                    this.walkticks = 0;
                }
            }
            

            this.tickEvents.forEach(event => {
                if (event.type === "logic") {
                    event.left--;
                    if (event.left <= 0) {
                        event.resolve();
                    }
                    if(!!event.every) {
                        event.dead = false === event.every(event.ticks - event.left, event.ticks);
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
                        event.dead = false === event.every(event.ticks - event.left, event.ticks);
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
                    event.dead = false === event.every(event.ticks - event.left, event.ticks);
                }
            }
        });
        // cleanup events with 0 left, or dead set to true
        this.tickEvents.forEach(event => {
            if ((event.ticks > 0 && event.left <= 0) || event.dead === true) {
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
    // do something for every tick for a certain amount of ticks, or if ticks is 0 or null, forever until "every" callback returns false
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
    setColor(color, opacity=1) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.globalAlpha = opacity;
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
        this.setColor(Graphics.colors.ui);
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
        if (this.noRender) {
            return;
        }
        this.clear();
        let offsetY = this.offset[1];
        this.offset[1] = this.offset[1]+16; // offset for ui
        let space = this.world.currentSpace;

        let player = this.world.player;

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

        // draw entities
        let entitiesToDraw = space.entities.filter(e => !!e.draw);
        if (!this.hideplayer && !this.world.transitioning) {
            entitiesToDraw.push(player);
            entitiesToDraw.sort(entitySort);
        }

        entitiesToDraw.forEach(e => {
            e.draw();
        });

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

        this.dialog.render();

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
                
                if (tick > 30) {
                    this.setColor(Graphics.colors.ui, alpha);
                    let width = this.canvas.width/2;
                    let slide = tick > 30 ? (tick-30)*(width/15) : 0;
                    this.ctx.fillRect(0-slide, 16, width, this.canvas.height-16);
                    this.ctx.fillRect(width+slide, 16, width, this.canvas.height-16);
                    this.setColor(Graphics.colors.ui, 1);
                } else {
                    this.setColor(`rgba(255,255,255,${alpha})`);
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }
            }
        }
        if (this.debug) {
            // draw tps in top left
            let tps = this.tps;
            Graphics.drawText(this.ctx, `${tps}tps`, 0, this.canvas.height - 10, 'black');
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
    pallets = {};
    constructor(image, spritesize) {
        this.image = image;
        this.spritesize = spritesize;
    }
    async generatePallet(name, colors) {
        this.pallets[name] = await Graphics.palletChange(this.image, colors);
    }
    downloadPallet(name) {
        downloadURI(this.pallets[name].src, name+".png");
    }
    // context, sprite x, sprite y, position x, position y
    drawSprite(ctx, x, y, px, py, h=undefined, w=undefined, pallet=undefined) {
        h = h || this.spritesize;
        w = w || this.spritesize;
        let image = this.image;
        if (pallet) {
            image = this.pallets[pallet];
        }
        ctx.drawImage(image, x*this.spritesize, y*this.spritesize, this.spritesize, this.spritesize, px, py, h, w);
    }
    drawRegion(ctx, x, y, px, py, h=undefined, w=undefined) {
        h = h || this.spritesize;
        w = w || this.spritesize;
        ctx.drawImage(this.image, x, y, h, w, px, py, h, w);
    }
}

function tileSnap(x,y) {
    // snap to center of tiles
    return [Math.floor(x/game.tilesize)*game.tilesize, Math.floor(y/game.tilesize)*game.tilesize];
}

// sort entities by zindex, or if same, y position
function entitySort(a,b) {
    if (a.zindex == b.zindex && a.hasOwnProperty("y") && b.hasOwnProperty("y")) {
            return a.y - b.y;
    }
    return a.zindex - b.zindex;
}
    
function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}

class NiceLoader {
    wrap = null;
    tiles = 0;
    tilesGenerated = 0;
    _currentItem = "";
    _stage = null;
    constructor(game) {
        this.wrap = document.querySelector('.gamewrap');
        this.wrap.classList.add('loading');

        this.stage = "pre";
        // sprites, then tiles, then sound

        // sprites
        game.events.on('sprites-adding', () => {this.stage = "adding-sprites"});

        // tiles
        game.events.on('tiles-adding', () => {this.stage = "adding-tiles"});
        game.events.on('tile-adding', (name, tile, tag) => {this.tiles++;this.currentItem = "Tile: "+name;});
        game.events.on('tile-added', (name, tile, tag) => {});
        game.events.on('tiles-added', () => {this.currentItem = "";});

        game.events.on('tiles-generating', (tiles) => {this.stage = "generating-tiles"});
        game.events.on('tile-generating', (name, tileref) => {this.currentItem = "Tile: "+name;});
        game.events.on('tile-generated', (name, tileref) => {this.tilesGenerated++;});
        game.events.on('tiles-generated', (tiles) => {
            this.currentItem = "";
            //console.info('generated '+Object.keys(tiles).length+" tiles");
        });

        // sounds
        game.events.on('sounds-adding', () => {this.stage = "adding-sounds"});
        game.events.on('sound-adding', (name, sound) => {this.currentItem = "Sound: "+name;});
        game.events.on('sound-added', (name, sound) => {});
        game.events.on('sounds-added', () => {this.currentItem = "";});

        // world
        game.events.on('world-generating', () => {this.stage = "generating-world"});
        game.events.on('world-generated', () => {this.currentItem = "";});

        // done!
        game.events.on('ready', () => {
            this.stage = "ready"
            this.wrap.classList.remove('loading');
        });
    }
    get stage() {
        return this._stage;
    }
    set stage(stage) {
        //console.log("loader stage:", stage);
        this._stage = stage;
        this.updateLoadingText();
    }

    get currentItem() {
        return this._currentItem;
    }
    set currentItem(item) {
        this._currentItem = item;
        //console.log("    - ", item);
        this.updateLoadingText();
    }

    updateLoadingText() {
        let text = this.stage + (this.currentItem ? ("\n" + this.currentItem) : "");
        this.wrap.setAttribute('data-loading', text);
    }
}

class Editor {
    game;
    sprites;
    spriteImages = [];
    spriteImage;

    constructor(game) {
        this.game = game;
        this.buildSpritelist();
    }

    buildSpritelist() {
        let sprites = [];
        // for all the tiles
        let tileNames = Object.keys(this.game.tiles);
        tileNames.forEach(name => {
            let tile = this.game.tiles[name];
            let spriteNames = Object.keys(tile.sprites);
            sprites.push({
                name: name,
                type: "tile",
                class: tile.constructor.name,
                subtype: this.getTileSubtype(tile),
                sprites: spriteNames,
                variants: tile.variantNames,
                flags: this.getTileFlags(tile),
            });
            spriteNames.forEach(spritename => {
                this.spriteImages.push({
                    name: spritename,
                    image: tile.sprites[spritename]
                });
            });
        });
        this.sprites = sprites;
    }
    getTileFlags(tile) {
        return {
            solid: tile.solid,
            hole: tile.hole,
            swim: tile.swim,
            drown: tile.drown,
            wet: tile.wet,
            dig: tile.dig,
            collision: tile.hasCollision(),
        };
    }
    getTileSubtype(tile) {
        // tile, edged, wall, directional
        if (tile instanceof TileEdged) {
            return "edged";
        }
        if (tile instanceof TileWall) {
            return "wall";
        }
        /*if (tile instanceof TileDirectional) {
            return "directional";
        }*/
        return "tile";
    }
    async buildSpriteSheet() {
        // width and height of sheet
        let size = Math.ceil(Math.sqrt(this.spriteImages.length));
        let canvas = document.createElement("canvas");
        canvas.width = size*16;
        canvas.height = size*16;
        let ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        this.spriteImages.forEach((sprite, i) => {
            let x = i%size;
            let y = Math.floor(i/size);
            ctx.drawImage(sprite.image, x*16, y*16);
        });
        let img = new Image();
        img.src = canvas.toDataURL();
        await img.decode();
        this.spriteImage = img;
        return img;
    }
    downloadSpriteSheet() {
        this.buildSpriteSheet().then(() => {
            downloadURI(this.spriteImage.src, "spritesheet.png");
        });
    }
}