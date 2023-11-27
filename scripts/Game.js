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
    map = null;
    animations = {};

    ticking = false;
    gametick = 0;
    logictick = 0;
    animationtick = 0;
    walkticks = 0;

    doGameLogic = true;
    doAnimation = true;
    cutscene = false;
    skipframe = false;
    noRender = false;
    hideplayer = false;
    paused = false; // game state paused entierly

    camFollowPlayer = true;

    tps = 0;
    debug = false;

    gameReady = false;
    started = false;

    loader = null;

    issues = [];

    // menu states
    menuOpen = false;
    mapOpen = false;

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

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                this.resume();
            } else {
                this.pause();
            }
        });

        this.events.on('input', (control) => {
            if (!this.started) {
                return;
            }
            if (this.paused) {
                if (control === "start") {this.resume();}
                return;
            } else {
                if (control === "start") {this.pause();return;}
            }
            if (control === "select") {
                this.toggleMap();
            }
        });

        // create interface
        this.interface = new Interface(this, document.getElementById("main"));

        this.world = new World(this);
        this.world.player = new EntityPlayer(this, 0, 0);
        this.player = this.world.player;

        this.sound = new SoundHandler(this);
        this.dialog = new Dialog(this);
        this.map = new GameMap(this);

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
            this.cutscene = true;
            return new Promise((resolve) => {
                let game = this;
                game.everyTick(120, (t, total) => {
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
                        game.cutscene = false;
                        resolve();
                    }
                });
            });
        };
        this.animations.enterUp = () => {
            this.cutscene = true;
            return new Promise((resolve) => {
                let game = this;
                game.everyTick(24, (t, total) => {
                    game.player.noCollide = true;
                    game.player.direction = 0;
                    game.player.walking = true;
                    game.player.move(0, -1);
                    if (t==total) {
                        game.player.walking = false;
                        game.player.noCollide = false;
                        game.cutscene = false;
                        resolve();
                    }
                });
            });
        };
        this.animations.exitDown = () => {
            this.cutscene = true;
            return new Promise((resolve) => {
                let game = this;
                game.everyTick(24, (t, total) => {
                    game.player.noCollide = true;
                    game.world.player.direction = 2;
                    game.world.player.walking = true;
                    game.world.player.move(0, 1);
                    if (t==total) {
                        game.world.player.walking = false;
                        game.player.noCollide = false;
                        game.cutscene = false;
                        resolve();
                    }
                });
            });
        };
        this.animations.appear = () => {
            return new Promise((resolve) => {
                let game = this;
                game.player.opacity = 0;
                game.waitTicks(1).then(()=>{
                    game.world.currentSpace.createEntity("poof", {x:game.player.x, y:game.player.y});
                    game.everyTick(16, (t, total) => {
                        game.player.opacity = t/total;
                        if(t==total) {
                            game.player.opacity = 1;
                            resolve();
                        }
                    });
                });
            });
        };
    }

    pause() {
        if (this.started) {
            this.paused = true;
            this.sound.pause();
        }
    }
    resume() {
        if (this.started) {
            this.paused = false;
            this.sound.resume();
        }
    }

    showDebug() {
        let debuginfo = document.querySelector('.debuginfo');
        debuginfo.classList.remove('hidden');
        this.debug = true;
    }
    hideDebug() {
        let debuginfo = document.querySelector('.debuginfo');
        debuginfo.classList.add('hidden');
        this.debug = false;
    }
    updateDebugInfo() {
        let debug_player = document.querySelector('.js-debuginfo-player');

        // pushingEntity summary
        let pushingEntity = null;
        if (this.player.pushingEntity) {
            if (typeof this.player.pushingEntity === "object") {
                if (this.player.pushingEntity.getDebugInfo) {
                    pushingEntity = this.player.pushingEntity.getDebugInfo();
                } else if(this.player.pushingEntity.constructor.name !== "Object") {
                    pushingEntity = {
                        class: this.player.pushingEntity.constructor.name
                    }
                } else {
                    pushingEntity = this.player.pushingEntity;
                }
            } else {
                pushingEntity = this.player.pushingEntity;
            }
        }

        let debug_player_data = {
            position: this.player.x+","+this.player.y,
            direction: this.player.direction,
            walking: this.player.walking,
            isGrabbing: this.player.isGrabbing,
            isPushing: this.player.isPushing,
            pushingEntity: pushingEntity ? pushingEntity : "none",
        }
        debug_player.innerHTML = JSON.stringify(debug_player_data, null, 2);
    }

    addIssue(issue) {
        let index = this.issues.findIndex(m => m.identifier === issue.identifier);
        if (index === -1) {
            this.issues.push(issue);
            console.error(issue.message);
        }
    }

    // editor
    edit() {
        if (!this.editor){
            let editor = new Editor(this);
            this.editor = editor;
        }
        this.editor.start();
    }
    cancelEdit() {
        this.editor.stop(false);
    }
    saveEdit() {
        this.editor.stop(true);
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
        await this.sound.addSound("block_fall", "./assets/sound/block_fall.wav");
        await this.sound.addSound("appear_vanish", "./assets/sound/AppearVanish.wav");
        await this.sound.addSound("shatter", "./assets/sound/shatter.wav");
        await this.sound.addSound("chest", "./assets/sound/Chest.wav");
        await this.sound.addSound("secret", "./assets/sound/Secret.wav");

        await this.sound.addSound("link_hurt", "./assets/sound/Link_Hurt.wav");
        await this.sound.addSound("link_fall", "./assets/sound/Link_Fall.wav");
        await this.sound.addSound("link_jump", "./assets/sound/Link_Jump.wav");
        await this.sound.addSound("link_land_run", "./assets/sound/Link_LandRun.wav");
        await this.sound.addSound("link_wade", "./assets/sound/Link_Wade.wav");
        await this.sound.addSound("link_pickup", "./assets/sound/Link_PickUp.wav");

        await this.sound.addSound("text_letter", "./assets/sound/Text_Letter.wav");
        await this.sound.addSound("text_done", "./assets/sound/Text_Done.wav");
        await this.sound.addSound("menu_open", "./assets/sound/menu_open.wav");
        await this.sound.addSound("menu_close", "./assets/sound/menu_close.wav");
        await this.sound.addSound("menu_cursor", "./assets/sound/menu_cursor.wav");
        await this.sound.addSound("menu_select", "./assets/sound/menu_select.wav");

        // music
        await this.sound.addMusic("overworld", "./assets/sound/music/overworld.mp3", 6.42);
        await this.sound.addMusic("house", "./assets/sound/music/house.mp3");
        await this.sound.addMusic("lynna-city-present", "./assets/sound/music/lynna-city-present.mp3");
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
        this.world.transitionTo(this.world.layers.overworld.getSpace(5, 5), "none");
        this.loop();
        // ensure stable tps
        setInterval(() => {
            if (!this.ticking) {
                this.tick();
            }
        }, 8);

        // testing, no inventory yet, equip grab to A, and rocs feather to B button
        this.player.equipItem("grab", 0);
        this.player.equipItem("rocs_feather", 1);
    }

    async loadSpritesheets() {
        this.events.trigger('sprites-adding');
        let ui = await this.loadImage("./assets/ui.png");
        this.spritesheets.ui = new SpriteSheet(ui, 8);

        let items = await this.loadImage("./assets/items.png");
        this.spritesheets.items = new SpriteSheet(items, 8);

        let player = await this.loadImage("./assets/player.png");
        this.spritesheets.player = new SpriteSheet(player, 16);

        let overworld = await this.loadImage("./assets/overworld8x8.png");
        this.spritesheets.overworld = new SpriteSheet(overworld, 8);

        let cliffs = await this.loadImage("./assets/cliffs.png");
        this.spritesheets.cliffs = new SpriteSheet(cliffs, 8, 1);

        let trees = await this.loadImage("./assets/trees.png");
        this.spritesheets.trees = new SpriteSheet(trees, 16);

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

        let mapOverworld = await this.loadImage("./assets/map-overworld.png");
        this.spritesheets.mapOverworld = new SpriteSheet(mapOverworld, 8);
    }

    async addTiles() {
        this.events.trigger('tiles-adding');

        await this.addTile("solid", "TileSolid");

        await this.addTile("grass", "TileGrass");
        await this.addTile("grass2", "TileGrassVariant");
        await this.addTile("flowers", "TileFlowers");
        await this.addTile("gravel", "TileGravel");
        await this.addTile("gravelRough", "TileGravelRough");
        await this.addTile("sand", "TileSand");
        await this.addTile("road", "TileRoad");
        await this.addTile("bridge", "TileBridge");
        await this.addTile("stairs", "TileStairs");
        await this.addTile("obstacle", "TileObstacle");
        await this.addTile("hole", "TileHole");
        await this.addTile("dug", "TileDug");
        await this.addTile("stone", "TileStone");
        await this.addTile("water", "TileWater");
        await this.addTile("puddle", "TilePuddle");
        await this.addTile("waterfall", "TileWaterfall");
        await this.addTile("waterfallBottom", "TileWaterfallBottom");

        await this.addTile("tree", "TileTree");
        await this.addTile("cliff", "TileCliff");
        await this.addTile("opening", "TileOpening");
        await this.addTile("openingBlocked", "TileOpeningBlocked");

        await this.addTile("roof", "TileRoof");
        await this.addTile("roofShack", "TileRoofShack");
        await this.addTile("window", "TileWindow");
        await this.addTile("doorway", "TileDoorway");
        await this.addTile("chimney", "TileChimney");
        await this.addTile("wallWood", "TileWallWood");
        await this.addTile("wallRoot", "TileWallRoot");
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
        await LayerBuildings(this);

        // loop through all layers and their spaces, and init them
        for (let name in this.world.layers) {
            let layer = this.world.layers[name];
            layer.spaces.forEach(col => {
                col.forEach(space => {
                    if (space.init) {
                        space.init(space);
                    }
                });
            });
        }
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
        if (this.paused) {return;}

        if (this.mapOpen) {
            this.ticking = true;
            this.map.tick();
            this.renderMap();
            this.ticking = false;
            return;
        }

        this.ticking = true;

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

        let playerWasBusy = player.isBusy; // in case state changes during tick, so controls are not cleared

        let overrideCam = false;

        if (this.gametick % 4 == 0) {
            this.dialog.tick();
        }

        if (this.doGameLogic && !this.dialog.show && !this.cutscene && !this.world.transitioning) {
            // update entities, player is updated later
            for (let i=0; i<space.entities.length; i++) {
                let entity = space.entities[i];
                if (!!entity.logic) {
                    entity.logic();
                }
                if (!!entity.tick) {
                    entity.tick();
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
        }

        if (this.doGameLogic && !player.isBusy) {
            // too tired to think
        } else if (this.world.transitioning && this.world.transition !== null) {
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
                overrideCam = true;
                if (transition=="slideleft") {
                    steps = this.canvas.width/stepsize;
                    if(player.x < 8) {
                        player.x+=0.25;
                        if(player.isCarrying) {
                            player.carriedEntity.x+=0.25;
                        }
                    }
                    this.offset[0] = this.canvas.width - tick*stepsize;
                } else if (transition=="slideright") {
                    steps = this.canvas.width/stepsize;
                    if(player.x > this.world.currentSpace.size[0]*this.tilesize-8) {
                        player.x-=0.25;
                        if(player.isCarrying) {
                            player.carriedEntity.x-=0.25;
                        }
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
                if (transition !== "none") {
                    console.error('unknown transition', transition);
                }
            }
            this.interface.clearPressed();
        }

        // if we are in dialog, then we want to interact with the dialog
        if (this.doGameLogic && this.dialog.show) {
            if (this.interface.inputsPressed.indexOf("a") !== -1 || this.interface.inputsPressed.indexOf("b") !== -1) {
                this.dialog.next();
                this.interface.clearPressed();
            } else if (this.dialog.anyNext && this.interface.inputsPressed.length > 0) {
                this.dialog.next();
                this.interface.clearPressed();
            }
        }

        
        if (this.doGameLogic && !player.isBusy) {
            if (this.interface.inputsPressed.indexOf("a") !== -1) {
                // pressed a this tick
                this.player.actionA();
            }
            if (this.interface.inputsPressed.indexOf("b") !== -1) {
                // pressed b this tick
                this.player.actionB();
            }

            if (this.interface.inputsReleased.indexOf("a") !== -1) {
                // released a this tick
                this.player.releasedA();
            }
            if (this.interface.inputsReleased.indexOf("b") !== -1) {
                // released b this tick
                this.player.releasedB();
            }
            
            // set space safeSpot if not set
            if (!space.safeSpot) {
                space.safeSpot = [player.x, player.y];
            }

            let c_up = this.interface.up;
            let c_right = this.interface.right
            let c_down = this.interface.down;
            let c_left = this.interface.left;
            let c_anydir = !!this.interface.dpad;
            let c_multidir = (c_up || c_down) && (c_left || c_right);

            // direction
            if (c_anydir && !player.isGrabbing) {
                player.direction = dirIndex(this.interface.dpad);
            }
            
            // walking
            player.walking = c_anydir && !player.isGrabbing;
            let mx = 0;
            let my = 0;

            if (c_up) {
                my = -player.moveSpeed;
            } else if (c_down) {
                my = player.moveSpeed;
            }
            if (c_left) {
                mx = -player.moveSpeed;  
            } else if (c_right) {
                mx = player.moveSpeed;  
            }
            if (!player.isGrabbing && (mx !== 0 || my !== 0)) {
                // overworld 6,5, player 80,64 still crashes
                player.move(mx, my, false, !c_multidir);
                this.walkticks++;
                if(player.isJumping) {
                    this.walkticks = 0;
                }
            } else {
                this.walkticks = 0;
            }

            // pushing
            if (c_anydir && !player.isGrabbing) {
                // find the entity or tile in front of the player
                let thing = player.inFrontoff();
                if (thing && typeof thing === "object") {
                    player.setPushingEntity(thing);
                } else if (player.pushingEntity) {
                    player.setPushingEntity(null);
                }
            } else {
                player.setPushingEntity(null);
            }

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
        }

        player.tick();

        if (this.doGameLogic && !this.world.transitioning) {
            this.logictick++;
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

        if (this.camFollowPlayer && !overrideCam) {
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
        // cleanup controls
        if (this.doGameLogic && !playerWasBusy) {
            this.interface.tick();
        }
        if (this.debug) {
            this.updateDebugInfo();
        }
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

    // actions
    toggleMap() {
        if (this.map.isBusy) return;

        if (this.mapOpen) {
            this.map.hide();
        } else {
            this.map.show();
        }
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

        // B item
        this.spritesheets.ui.drawSprite(this.ctx, 1, 3, 0, 0, 1, 2);
        this.spritesheets.ui.drawSprite(this.ctx, 2, 3, 32, 0, 1, 2); 
        let itemB = player.getItem(1);
        if (itemB) {
            itemB.renderIcon(this.ctx, 8, 0);
        }
        
        // A item
        this.spritesheets.ui.drawSprite(this.ctx, 0, 3, 40, 0, 1, 2);
        this.spritesheets.ui.drawSprite(this.ctx, 2, 3, 32+40, 0, 1, 2); 
        let itemA = player.getItem(0);
        if (itemA) {
            itemA.renderIcon(this.ctx, 48, 0);
        }
        

        // draw the hearts
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
        let entitiesToDraw = space.entities.filter(e => !!e.draw && e.isCarried !== true);
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
        if (this.world.transitioning && this.world.transition) {
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

    renderMap() {
        this.clear();
        this.map.draw();
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
    gutter;
    pallets = {};
    constructor(image, spritesize, gutter=0) {
        this.image = image;
        this.spritesize = spritesize;
        this.gutter = gutter;
    }
    async generatePallet(name, colors) { // not used, thinking of a way to do this better
        this.pallets[name] = await Graphics.palletChange(this.image, colors);
    }
    downloadPallet(name) {
        downloadURI(this.pallets[name].src, name+".png");
    }
    // context, sprite x, sprite y, position x, position y
    drawSprite(ctx, x, y, px, py, sw=1, sh=1, w=undefined, h=undefined) {
        h = h || this.spritesize*sh;
        w = w || this.spritesize*sw;
        ctx.drawImage(this.image, x*this.spritesize+(this.gutter*(x+1)), y*this.spritesize+(this.gutter*(y+1)), this.spritesize*sw, this.spritesize*sh, px, py, w, h);
    }
    drawRegion(ctx, x, y, px, py, w=undefined, h=undefined) {
        h = h || this.spritesize;
        w = w || this.spritesize;
        ctx.drawImage(this.image, x, y, w, h, px, py, w, h);
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

function dirIndex(dir) {
    if (dir=='up') {
        return 0;
    }
    if (dir=='right') {
        return 1;
    }
    if (dir=='down') {
        return 2;
    }
    if (dir=='left') {
        return 3;
    }
    return -1;
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
            this.wrap.classList.add('waiting');
            this.wrap.addEventListener('click', () => {
                this.wrap.classList.remove('waiting');
                game.start();
                let editbtn = document.createElement('button');
                editbtn.innerText = "Edit";
                editbtn.classList.add('btn-edit');
                editbtn.addEventListener('click', () => {
                    game.edit();
                });
                document.querySelector('.application').appendChild(editbtn);
            }, {once: true});
        });
    }
    get stage() {
        return this._stage;
    }
    set stage(stage) {
        this._stage = stage;
        this.updateLoadingText();
    }

    get currentItem() {
        return this._currentItem;
    }
    set currentItem(item) {
        this._currentItem = item;
        this.updateLoadingText();
    }

    updateLoadingText() {
        let text = this.stage + (this.currentItem ? ("\n" + this.currentItem) : "");
        this.wrap.setAttribute('data-loading', text);
    }
}