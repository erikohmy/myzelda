class TileGravel extends TileEdged {
    spriteOffsetY = 2;
    dig = true;

    getSheet() {
        return this.game.spritesheets.overworld;
    }
}