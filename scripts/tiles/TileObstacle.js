class TileObstacle extends TileBase {
    spriteOffsetX = 0;
    spriteOffsetY = 6;
    variants = 10;
    variantNames = [
        "fence",
        "poles1",
        "poles2",
        "block",
        "coconut",
        "rock",
        "block2",
        "block2double",
        "towerplinth",
        "towerbricks"
    ]

    solid = true;

    getSheet() {
        return this.game.spritesheets.overworld;
    }
}