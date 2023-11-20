class TileAnimated4 extends TileBase {
    variants = 4;
    variantNames = [
        "frame1",
        "frane2",
        "frame3",
        "frame4",
    ]

    getSheet() {
        return this.game.spritesheets.animated;
    }

    drawTile(ctx, x, y, options={}) {
        let frame = Math.floor(this.game.animationtick % 60 / 15);
        let sprite = this.name+"-"+this.variantNames[frame];
        ctx.drawImage(this.sprites[sprite], x, y);
    }
}