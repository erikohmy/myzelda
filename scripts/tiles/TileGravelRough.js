class TileGravelRough extends TileBase {
    spriteOffsetX = 5;
    spriteOffsetY = 2;

    getSheet() {
        return this.game.spritesheets.overworld;
    }
}