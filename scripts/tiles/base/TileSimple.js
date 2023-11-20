class TileSimple extends TileBase {
    async generate() {
        let tiles = this.defineTiles();
        tiles = this.modifyTiles(tiles);

        let tileImages = {};
        let canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        let ctx = canvas.getContext("2d");

        let sheet = this.getSheet();
        
        for (let tileName in tiles) {
            ctx.clearRect(0, 0, 16, 16);
            let tile = tiles[tileName];
            let x = tile[0]*2 + this.spriteOffsetX;
            let y = tile[1]*2 + this.spriteOffsetY;
            sheet.drawSprite(ctx, x, y, 0, 0);
            sheet.drawSprite(ctx, x+1, y, 8, 0);
            sheet.drawSprite(ctx, x, y+1, 0, 8);
            sheet.drawSprite(ctx, x+1, y+1, 8, 8);
            
            let image = new Image();
            image.src = canvas.toDataURL();
            await image.decode();
            tileImages[tileName] = image; 
        }

        this.sprites = tileImages;
    }
}