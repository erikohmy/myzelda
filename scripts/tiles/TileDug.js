class TileDug extends TileBase {
    spriteOffsetX = 2;
    spriteOffsetY = 14;

    getSheet() {
        return this.game.spritesheets.overworld;
    }
}