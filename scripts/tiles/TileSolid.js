class TileSolid extends TileBase {
    solid = true;
    async generate() {
        let tileImages = {};
        let canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        let ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 16, 16);
        let image = new Image();
        image.src = canvas.toDataURL();
        await image.decode();
        tileImages[this.name] = image; 
        this.sprites = tileImages;
    }

    drawTile(ctx, x, y, options={}) {
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
    }
}