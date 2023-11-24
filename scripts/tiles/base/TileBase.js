class TileBase { // TODO: add Palette to options? generates pre-recolored tiles
    game;

    name;

    sprites;

    solid = false;
    hole = false;
    swim = false;
    drown = false;
    wet = false;
    dig = false;
    rough = false; // slows speed (on those who care)

    collision = undefined;

    spriteMap = [
        ["tl", "tr" ], // top left, top right
        ["bl", "rb"], // bottom left, bottom right
    ];

    // where the tile starts in the spritesheet
    spriteOffsetX = 0;
    spriteOffsetY = 0;
    variants = 1;
    variantNames = [];

    constructor(game, name) {
        this.game = game;
        this.name = name;
        this.init();
        game.tiles[name] = this;
    }

    init() {}

    hasCollision() {
        if (this.solid) {
            return true
        }
        return !!this.collision;
    }

    defineTiles() {
        let tiles = {};
        // each tile is a 2x2 grid of sprites
        tiles[this.name] = ["tl", "tr", "bl", "rb"];
        return tiles;
    }

    modifyTiles(tiles) {
        return tiles;
    }
    
    async generate() {
        // if we have variants, assume they are next to each other in the spritesheet
        let spriteMap = this.spriteMap;
        if (this.variants > 1) {
            spriteMap = [];
            for(let i=0; i<this.spriteMap.length; i++) {
                let newRow = [];
                for (let v=0; v<this.variants; v++) {
                    let segment = [...this.spriteMap[i]];
                    for (let j=0; j<segment.length; j++) {
                        segment[j] += "-"+v;
                    }
                    newRow = newRow.concat(segment);
                }
                spriteMap[i] = newRow;
            }
        }
        let sprites = {};
        for (let y=0; y<spriteMap.length; y++) {
            for (let x=0; x<spriteMap[y].length; x++) {
                let sprite = spriteMap[y][x];
                sprites[sprite] = [this.spriteOffsetX+x, this.spriteOffsetY+y];
            }
        }
        
        let tiles = this.defineTiles();
        tiles = this.modifyTiles(tiles);
        
        if (this.variants > 1) {
            let variants = {};
            // add variants
            for (let tileName in tiles) {
                let tile = tiles[tileName];
                for (let v=0;v<this.variants;v++) {
                    let vname = this.variantNames[v];
                    variants[tileName+"-"+vname] = tile.map((sprite) => sprite+"-"+v);
                }
            }
            tiles = variants;
        }

        // pre-generate each version of the tile
        let tileImages = {};
        let canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        let ctx = canvas.getContext("2d");

        let sheet = this.getSheet();
        
        for (let tileName in tiles) {
            ctx.clearRect(0, 0, 16, 16);
            let tile = tiles[tileName];
            for (let i=0; i<tile.length; i++) {
                let sprite = tile[i];
                let [x,y] = sprites[sprite];
                sheet.drawSprite(ctx, x, y, (i%2)*8, Math.floor(i/2)*8);
            }
            let image = new Image();
            image.src = canvas.toDataURL();
            await image.decode();
            tileImages[tileName] = image; 
        }

        this.sprites = tileImages;
    }

    applyFilter(ctx, filter, x, y, stage) {
        if (stage == 'pre') {
            this._beforefilter = ctx.filter;
        }
        if (filter == "night") {
            if (stage == 'pre') {
                ctx.filter = "brightness(0.6) grayscale(0.2)";
            } else if(stage == 'post') {
                let colorbefore = ctx.fillStyle;
                ctx.fillStyle = "rgba(0,0,255,0.4)";
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = colorbefore;
            }
        } else if (filter == "cold") {
            if(stage == 'post') {
                let colorbefore = ctx.fillStyle;
                ctx.fillStyle = "rgba(0,0,255,0.4)";
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = colorbefore;
            }
        }

    }
    resetFilter(ctx) {
        ctx.filter = this._beforefilter ? this._beforefilter : "none";
    }

    draw(ctx, x, y, options={}) {
        if (options?.filter){
            this.applyFilter(ctx, options.filter, x, y, 'pre');
            this.drawTile(ctx, x, y, options);
            this.applyFilter(ctx, options.filter, x, y, 'post');
            this.resetFilter(ctx);
        } else {
            this.drawTile(ctx, x, y, options);
        }
    }

    drawTile(ctx, x, y, options={}) {
        let name = this.name;
        if (options?.edges) name += "-" + options.edges;
        if (options?.part) name += "-" + options.part;
        if (options?.variant) name += "-" + options.variant;
        if (! this.sprites.hasOwnProperty(name)) {
            let issue = {
                identifier: 'error.tiles.sprite'+this.name+"."+(name?name:typeof name),
                severity: "error",
                type: 'error.tiles.sprite',
                message: "Sprite '"+(name?name:typeof name)+"' for tile "+this.name+" does not exist",
            };
            if(this.variants > 1) {
                issue.message += ", should be variant? (variants: "+this.variantNames.join(", ")+")";
            }
            this.game.addIssue(issue);
            name = this.sprites.hasOwnProperty(this.name) ? this.name : this.name + "-" + this.variantNames[0];
        }
        if (options?.background && options.background != "none" && options.background != "transparent") {
            let bg = options.background;
            if (bg[0] == "#") {
                ctx.fillStyle = bg;
                ctx.fillRect(x, y, 16, 16);
            } else {// assume tile
                let parts = bg.split("-");
                let tile = this.game.tiles[parts[0]];
                if (tile) {
                    tile.draw(ctx, x, y, {variant: parts.length > 1 ? parts[1]: ""});
                }
            }
        }
        ctx.drawImage(this.sprites[name], x, y);
    }

    drawTest(ctx, x, y) {
        this.draw(ctx, x, y);
        // if we have variants, draw those as well
        if (this.variants > 1) {
            for (let v=1; v<this.variants; v++) {
                this.draw(ctx, x+v*16, y, {variant: this.variantNames[v]});
            }
        }
    }
}

// takes a bit string, like 0110, and a mask, like "trbl", and gives you the masked string, like "rb"
maskString = function(str, mask) {
    let out = "";
    for (let i=0; i<str.length; i++) {
        let bit = str[i];
        if (bit == "1") {
            out += mask[i];
        }
    }
    return out;
}