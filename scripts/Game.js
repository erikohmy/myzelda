class Game {
    events = new EasyEvents();

    tilesize = 16;
    gridsize = [10, 9];
    offset = [0, 0];
    screenOffset = [0, 0];
    size = [0, 0];

    canvas = null;
    ctx = null;

    spritesheets = {};
    tiles = {};

    interface = null;
    world = null;

    ticking = false;
    gametick = 0;
    animationtick = 0;

    doGameLogic = true;
    doAnimation = true;

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

        // create interface
        this.interface = new Interface(this, document.getElementById("main"));

        this.world = new World(this);
        this.world.addLayer("overworld", 14, 14);
        this.world.currentLayer = this.world.layers.overworld;
        this.world.player = new Player(this, 32, 32);

        let testspace1 = new Space(this, 10, 8);
        this.world.currentLayer.addSpace(testspace1, 0, 0);
        testspace1.fill({name:"sand"});
        testspace1.border({name:"obstacle", variant:"rock"});
        testspace1.setTile(3,4,{name:"obstacle", variant:"coconut"});
        testspace1.setTile(4,5,{name:"obstacle", variant:"coconut"});
        testspace1.setTile(1,7,{name:"sand"});
        testspace1.setTile(2,7,{name:"sand"});
        testspace1.setTile(3,7,{name:"sand"});
        testspace1.setTile(4,7,{name:"sand"});
        testspace1.setTile(5,7,{name:"sand"});
        testspace1.setTile(6,7,{name:"sand"});
        testspace1.setTile(7,7,{name:"sand"});
        testspace1.setTile(8,7,{name:"sand"});
        testspace1.setTile(9,4,{name:"sand"});

        let testspace2 = new Space(this, 10, 8);
        testspace2.fill({name:"sand"});
        testspace2.border({name:"obstacle", variant:"rock"});
        testspace2.setTile(0,4,{name:"sand"});
        this.world.currentLayer.addSpace(testspace2, 1, 0);
        
        let testspace3 = new Space(this, 10, 8);
        testspace3.fill({name:"water"});
        testspace3.border({name:"obstacle", variant:"rock"});
        testspace3.setTile(1,0,{name:"sand"});
        testspace3.setTile(2,0,{name:"sand"});
        testspace3.setTile(3,0,{name:"sand"});
        testspace3.setTile(4,0,{name:"sand"});
        testspace3.setTile(5,0,{name:"sand"});
        testspace3.setTile(6,0,{name:"sand"});
        testspace3.setTile(7,0,{name:"sand"});
        testspace3.setTile(8,0,{name:"sand"});
        testspace3.setTile(1,1,{name:"sand", edges:"b"});
        testspace3.setTile(2,1,{name:"sand", edges:"b"});
        testspace3.setTile(3,1,{name:"sand", edges:"b"});
        testspace3.setTile(4,1,{name:"sand"});
        testspace3.setTile(5,1,{name:"sand"});
        testspace3.setTile(6,1,{name:"sand", edges:"b"});
        testspace3.setTile(7,1,{name:"sand", edges:"b"});
        testspace3.setTile(8,1,{name:"sand", edges:"b"});
        testspace3.setTile(1,2,{name:"puddle"});
        testspace3.setTile(2,2,{name:"puddle"});
        testspace3.setTile(3,2,{name:"puddle"});
        testspace3.setTile(4,2,{name:"sand", edges:"bl"});
        testspace3.setTile(5,2,{name:"sand", edges:"rb"});
        testspace3.setTile(6,2,{name:"puddle"});
        testspace3.setTile(7,2,{name:"puddle"});
        testspace3.setTile(8,2,{name:"puddle"});
        testspace3.setTile(1,3,{name:"puddle"});
        testspace3.setTile(2,3,{name:"puddle"});
        testspace3.setTile(3,3,{name:"puddle"});
        testspace3.setTile(4,3,{name:"puddle"});
        testspace3.setTile(5,3,{name:"puddle"});
        testspace3.setTile(6,3,{name:"puddle"});
        testspace3.setTile(7,3,{name:"puddle"});
        testspace3.setTile(8,3,{name:"puddle"});

        this.world.currentLayer.addSpace(testspace3, 0, 1);

        let testspace4 = new Space(this, 10, 8);
        testspace4.fill({name:"gravel"});
        this.world.currentLayer.addSpace(testspace4, 1, 1);

        this.world.currentSpace = testspace1;

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

    async start() {
        await this.loadSpritesheets();
        await this.addTiles();
        await this.generateTiles();
        console.pretty("[label-success:success] All assets loaded.")
        this.loop();
    }

    async loadSpritesheets() {
        let ui = await this.loadImage("./assets/ui.png");
        this.spritesheets.ui = new SpriteSheet(ui, 8);

        let player = await this.loadImage("./assets/player.png");
        this.spritesheets.player = new SpriteSheet(player, 16);

        let overworld = await this.loadImage("./assets/overworld8x8.png");
        this.spritesheets.overworld = new SpriteSheet(overworld, 8);

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

        if (this.doGameLogic && !this.world.transitioning) {
            let worldOffset = [0, 0];

            // follow player
            worldOffset[0] = -Math.round(player.x - this.canvas.width/2);
            worldOffset[1] = -Math.round(player.y - this.canvas.height/2);

            // clamp world offset to space size
            let spaceSize = [space.size[0]*this.tilesize, space.size[1]*this.tilesize];
            worldOffset[0] = Math.max(worldOffset[0], -spaceSize[0]+this.canvas.width);
            worldOffset[0] = Math.min(worldOffset[0], 0);
            worldOffset[1] = Math.max(worldOffset[1], -spaceSize[1]+this.canvas.height);
            worldOffset[1] = Math.min(worldOffset[1], 0);

            this.offset[0] = worldOffset[0] + this.screenOffset[0];
            this.offset[1] = worldOffset[1] + this.screenOffset[1];

            let c_up = this.interface.isControlHeld("up");
            let c_right = this.interface.isControlHeld("right");
            let c_down = this.interface.isControlHeld("down");
            let c_left = this.interface.isControlHeld("left");

            // move player
            let collisionBoxes = space.getCollisionBoxes();

            
            if (!player.isColliding() || player.isColliding() && this.gametick % 2 == 0) {
                player.walking = false;
                if (c_up) {
                    player.direction=0;
                    player.walking=true;
                    player.move(0, -1, collisionBoxes);
                } else if (c_down) {
                    player.direction=2;
                    player.walking=true;
                    player.move(0, 1, collisionBoxes);
                }

                if (c_left) {
                    player.direction=3;
                    player.walking=true;
                    player.move(-1, 0, collisionBoxes);
                } else if (c_right) {
                    player.direction=1;
                    player.walking=true;
                    player.move(1, 0, collisionBoxes);
                }
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
        } else if(this.world.transitioning) {
            // stupid copy
            let worldOffset = [0, 0];

            // follow player
            worldOffset[0] = -Math.round(player.x - this.canvas.width/2);
            worldOffset[1] = -Math.round(player.y - this.canvas.height/2);

            // clamp world offset to space size
            let spaceSize = [space.size[0]*this.tilesize, space.size[1]*this.tilesize];
            worldOffset[0] = Math.max(worldOffset[0], -spaceSize[0]+this.canvas.width);
            worldOffset[0] = Math.min(worldOffset[0], 0);
            worldOffset[1] = Math.max(worldOffset[1], -spaceSize[1]+this.canvas.height);
            worldOffset[1] = Math.min(worldOffset[1], 0);

            this.offset[0] = worldOffset[0] + this.screenOffset[0];
            this.offset[1] = worldOffset[1] + this.screenOffset[1];
            //
            let transition = this.world.transition;
            if (transition == "slideleft" || transition == "slideright" || transition == "slideup" || transition == "slidedown") {
                let tick = this.gametick - this.world.transitionStart;
                let stepsize = 8;
                let steps = 0;
                if (transition=="slideleft") {
                    steps = this.canvas.width/stepsize;
                    this.offset[0] = this.canvas.width - tick*stepsize;
                } else if (transition=="slideright") {
                    steps = this.canvas.width/stepsize;
                    this.offset[0] = -this.canvas.width + tick*stepsize;
                } else if (transition=="slideup") {
                    steps = (this.canvas.height-16)/stepsize;
                    this.offset[1] = (this.canvas.height-16) - tick*stepsize;
                } else if (transition=="slidedown") {
                    steps = (this.canvas.height-16)/stepsize;
                    this.offset[1] = -(this.canvas.height-16) + tick*stepsize;
                }
                if (tick >= steps) {
                    this.world.transitioning = false;
                    console.log('done transitioning')
                    this._fpsInterval = 1000/60;
                }
            } else {
                this.world.transitioning = false;
                console.log('done transitioning')
            }
        }

        if (this.doAnimation && !this.world.transitioning) {
            this.animationtick++;
        }
        this.render();
        this.gametick++;
        this.ticking = false;
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

    render() {
        this.clear();
        this.setColor("#FFF");
        //this.drawGrid();

        /*

        this.tiles.grass.drawTest(this.ctx, 0, 0);
        this.tiles.grass2.drawTest(this.ctx, 64, 0);
        this.tiles.gravel.drawTest(this.ctx, 0, 64);
        this.tiles.sand.drawTest(this.ctx, 64, 64);

        this.tiles.gravelRough.drawTest(this.ctx, 0, 128);

        this.tiles.sand.draw(this.ctx, 128, 64, {edges: "t"});
        this.tiles.sand.draw(this.ctx, 128+16, 64, {edges: "t"});
        this.tiles.sand.draw(this.ctx, 128, 64+16);
        this.tiles.sand.draw(this.ctx, 128, 64+32);
        this.tiles.sand.draw(this.ctx, 128+16, 64+16);
        this.tiles.sand.draw(this.ctx, 128+16, 64+32);
        this.tiles.sand.draw(this.ctx, 128, 64+48, {edges: "b"});
        this.tiles.sand.draw(this.ctx, 128+16, 64+48, {edges: "b"});

        //this.tiles.obstacle.draw(this.ctx, 16, 128);
        //this.tiles.obstacle.draw(this.ctx, 32, 128, {variant: "rock"});
        //this.tiles.obstacle.draw(this.ctx, 48, 128, {variant: "poles1"});
        //this.tiles.obstacle.draw(this.ctx, 64, 128, {variant: "poles2"});
        //this.tiles.obstacle.draw(this.ctx, 80, 128, {variant: "block"});
        //this.tiles.obstacle.draw(this.ctx, 96, 128, {variant: "coconut"});
        this.tiles.obstacle.drawTest(this.ctx, 16, 128);
        */

        // draw the testspace
        this.offset[1] = this.offset[1]+16; // offset for ui
        let space = this.world.currentSpace;

        // draw tiles
        for (let y=0; y<space.size[1]; y++) {
            for (let x=0; x<space.size[0]; x++) {
                let tile = space.tiles[y*space.size[0]+x];
                if (tile) {
                    let xpos = x*this.tilesize+this.offset[0];
                    let ypos = y*this.tilesize+this.offset[1];
                    this.tiles[tile.name].draw(this.ctx, xpos, ypos, tile);
                }
            }
        }

        // debug, draw collision boxes
        if (false) {
            space.getCollisionBoxes().forEach(box => {
                this.setColor("#FF000077"); // transparent red
                this.ctx.fillRect(box.x+this.offset[0], box.y+this.offset[1], box.w, box.h);
                //this.setColor("#FF0000"); // red
                //this.ctx.strokeRect(box.x+this.offset[0], box.y+this.offset[1], box.w, box.h);
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

        // draw a box representing the player
        let player = this.world.player;
        player.draw();

        // if we are transitioning, draw that!
        if (this.world.transitioning) {
            let transition = this.world.transition;
            if (transition == "slideleft" || transition == "slideright" || transition == "slideup" || transition == "slidedown") {
                let snapshot = this.world.snapshot;
                let tick = this.gametick - this.world.transitionStart;
                if (transition=="slideleft") {
                    this.ctx.drawImage(snapshot, -tick*8, 16);
                } else if (transition=="slideright") {
                    this.ctx.drawImage(snapshot, tick*8, 16);
                } else if (transition=="slideup") {
                    this.ctx.drawImage(snapshot, 0, -tick*8+16);
                } else if (transition=="slidedown") {
                    this.ctx.drawImage(snapshot, 0, tick*8+16);
                }
            }
        }

        this.renderUi();  
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

// a space, contains a grid of tiles and all entities in it
class Space {
    game;
    layer;
    size;
    tiles;
    entities;

    options; // filter, music, etc

    constructor(game, sizex, sizey) {
        this.game = game;
        this.size = [sizex, sizey];
        this.tiles = new Array(sizex * sizey);
        this.entities = [];
        this.options = {};
    }
    get position() {
        return this.layer.getSpacePosition(this);
    }
    get x() {
        let x,y;
        [x, y] = this.position;
        return x;
    }

    get y() {
        let x,y;
        [x, y] = this.position;
        return y;
    }

    tile(x, y) {
        return this.tiles[y*this.size[0]+x];
    }
    setTile(x, y, tileinfo) {
        return this.tiles[y*this.size[0]+x] = tileinfo;
    }
    fill(tileinfo) {
        for (let i=0; i<this.tiles.length; i++) {
            this.tiles[i] = tileinfo;
        }
    }
    border(tileinfo) {
        for (let x=0; x<this.size[0]; x++) {
            this.setTile(x, 0, tileinfo);
            this.setTile(x, this.size[1]-1, tileinfo);
        }
        for (let y=0; y<this.size[1]; y++) {
            this.setTile(0, y, tileinfo);
            this.setTile(this.size[0]-1, y, tileinfo);
        }
    }

    getCollisionBoxes(condition = "solid") {
        let boxes = [];
        // add itself as a collision box, if contition is solid
        if (condition == "solid") {
            let bw = (this.size[0]+2)*16;
            let bh = (this.size[1]+2)*16;
            boxes.push({x:-32, y:-16, w: 16, h: bh}); // left wall
            boxes.push({x:bw-16, y:-16, w: 16, h: bh}); // right wall
            boxes.push({x:-16, y:-32, w: bw, h: 16}); // top wall
            boxes.push({x:-16, y:bh-16, w: bw, h: 16}); // bottom wall
        }

        // add tile collissions
        for (let y=0; y<this.size[1]; y++) {
            for (let x=0; x<this.size[0]; x++) {
                let name = this.tile(x, y).name;
                let tile = this.game.tiles[name];
                if (tile[condition]) {
                    boxes.push({x:x*16, y:y*16, h:16, w:16});
                }
            }
        }
        // todo: add entity collissions ( not enemies and such, only doors, tile entities, etc)
        return boxes;
    }
}