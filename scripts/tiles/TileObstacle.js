class TileObstacle extends TileBase {
    spriteOffsetX = 0;
    spriteOffsetY = 6;
    variants = 6;
    variantNames = [
        "fence",
        "poles1",
        "poles2",
        "block",
        "coconut",
        "rock"
    ]

    solid = true;

    getSheet() {
        return this.game.spritesheets.overworld;
    }

    drawTile(ctx, x, y, options={}) {
        if (!options.background) {options.background = "#f8e010";}
        super.drawTile(ctx, x, y, options);
    }
}