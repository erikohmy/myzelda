class Game {
    events = new EasyEvents();

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

    gametick = 0;

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

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

        let testspace = new Space(this, 10, 8); // one full screen (minus one row for the ui)
        this.world.currentLayer = this.world.layers.overworld
        this.world.currentSpace = testspace;
        this.world.player = new Player(this, 32, 32);

        this.world.currentLayer.addSpace(testspace, 0, 0);
        // fill the testspace with sand
        for (let y=0; y<testspace.size[1]; y++) {
            for (let x=0; x<testspace.size[0]; x++) {
                testspace.tiles[y*testspace.size[0]+x] = {name:"sand"};
            }
        }
        testspace.setTile(0,0,{name:"obstacle", variant:"rock"});
        testspace.setTile(0,1,{name:"obstacle", variant:"rock"});
        testspace.setTile(0,2,{name:"obstacle", variant:"rock"});
        testspace.setTile(0,3,{name:"obstacle", variant:"rock"});
        testspace.setTile(0,4,{name:"obstacle", variant:"rock"});
        testspace.setTile(0,6,{name:"obstacle", variant:"rock"});
        testspace.setTile(0,7,{name:"obstacle", variant:"rock"});

        testspace.setTile(3,4,{name:"obstacle", variant:"coconut"});

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
    }

    async addTiles() {
        await this.addTile("grass", "TileGrass");
        await this.addTile("grass2", "TileGrassVariant");
        await this.addTile("gravel", "TileGravel");
        await this.addTile("gravelRough", "TileGravelRough");
        await this.addTile("sand", "TileSand");
        await this.addTile("obstacle", "TileObstacle");
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
        this.tick();
        this.render();
        window.requestAnimationFrame(() => this.loop());
    }

    tick() {
        // for testing
        //this.offset[0] += 1;
        //this.offset[1] -= 1;

        let now = Date.now();
        let elapsed = now - this._lastFrame;
        if (this._lastFrame !== undefined) {
            if (elapsed < this._fpsInterval) {
                return;
            }
        }

        this._lastFrame = now - (elapsed % this._fpsInterval);

        let uipush = true ? 16 : 0;
        let worldOffset = [0, 0];
        this.offset[0] = worldOffset[0];
        this.offset[1] = worldOffset[1] + uipush;

        let c_up = this.interface.isControlHeld("up");
        let c_right = this.interface.isControlHeld("right");
        let c_down = this.interface.isControlHeld("down");
        let c_left = this.interface.isControlHeld("left");

        // move player
        let space = this.world.currentSpace;
        let collisionBoxes = space.getCollisionBoxes();

        let player = this.world.player;
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

        this.gametick++;
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
        let space = this.world.currentSpace;

        // draw tiles
        for (let y=0; y<space.size[1]; y++) {
            for (let x=0; x<space.size[0]; x++) {
                let tile = space.tiles[y*space.size[0]+x];
                if (tile) {
                    let xpos = x*this.tilesize+this.offset[0];
                    let ypos = y*this.tilesize+this.offset[1]
                    this.tiles[tile.name].draw(this.ctx, xpos, ypos, tile);
                }
            }
        }

        // debug, draw collision boxes
        if (false) {
            space.getCollisionBoxes().forEach(box => {
                this.setColor("#FF000077"); // transparent red
                this.setColor("#000");
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
            */
        }

        // draw a box representing the player
        let player = this.world.player;
        player.draw();

        this.renderUi();  
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

    tile(x, y) {
        return this.tiles[y*this.size[0]+x];
    }
    setTile(x, y, tileinfo) {
        return this.tiles[y*this.size[0]+x] = tileinfo;
    }

    getCollisionBoxes(condition = "solid") {
        let boxes = [];
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