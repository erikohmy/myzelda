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
}