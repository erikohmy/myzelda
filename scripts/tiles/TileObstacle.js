class TileObstacle extends TileBase {
    spriteOffsetX = 0;
    spriteOffsetY = 6;
    variants = 8;
    variantNames = [
        "fence",
        "poles1",
        "poles2",
        "block",
        "coconut",
        "rock",
        "block2",
        "block2double"
    ]

    solid = true;

    getSheet() {
        return this.game.spritesheets.overworld;
    }
}