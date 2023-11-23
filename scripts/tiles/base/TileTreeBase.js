class TileTreeBase extends TileBase{
    solid=true;
    hasCovered = true;

    getSheet() {
        return this.game.spritesheets.trees;
    }

    async generate() {
        let tiles = this.defineTiles();
        tiles = this.modifyTiles(tiles);

        if (this.variants > 1) {
            let variants = {};
            let highestX = 0;
            
            Object.entries(tiles).forEach(([name, tile]) => {
                let x = tile[0];
                if (x > highestX) {
                    highestX = x;
                }
            });
            highestX++;
            // add variants
            /*
            for (let tileName in tiles) {
                let tile = tiles[tileName];
                for (let v=0;v<this.variants;v++) {
                    let vname = this.variantNames[v];
                    variants[tileName+"-"+vname] = [tile[0]+v*highestX, tile[1]];
                }
            }
            */
            for (let v=0;v<this.variants;v++) {
                for (let tileName in tiles) {
                    let tile = tiles[tileName];
                    let vname = this.variantNames[v];
                    variants[tileName+"-"+vname] = [tile[0]+v*highestX, tile[1]];
                }
            }
            tiles = variants;
        }

        let tileImages = {};
        let canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        let ctx = canvas.getContext("2d");

        let sheet = this.getSheet();
        
        for (let tileName in tiles) {
            ctx.clearRect(0, 0, 16, 16);
            let tile = tiles[tileName];
            let x = tile[0] + this.spriteOffsetX;
            let y = tile[1] + this.spriteOffsetY;
            sheet.drawSprite(ctx, x, y, 0, 0);
            
            let image = new Image();
            image.src = canvas.toDataURL();
            await image.decode();
            tileImages[tileName] = image; 
        }

        this.sprites = tileImages;
    }

    defineTiles() {
        let tiles = {};
        tiles[this.name+"-tl"]    = [0,0]; 
        tiles[this.name+"-tr"]    = [1,0];
        tiles[this.name+"-bl"]    = [0,1]; 
        tiles[this.name+"-rb"]    = [1,1];
        if (this.hasCovered) { 
            tiles[this.name+"-clr"]    = [2,0];
            tiles[this.name+"-crl"]    = [3,0]; 
            tiles[this.name+"-cll"]    = [2,1];
            tiles[this.name+"-rrr"]    = [3,1];
        }
        return tiles;
    }

    drawTile(ctx, x, y, options={}) {
        if (!options.background) {options.background = "#f8e010";}
        super.drawTile(ctx, x, y, options);
    }
}