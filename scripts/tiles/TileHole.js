class TileHole extends TileBase {
    spriteOffsetX = 0;
    spriteOffsetY = 14;

    hole = true;

    getSheet() {
        return this.game.spritesheets.overworld;
    }
}