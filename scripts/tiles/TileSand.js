class TileSand extends TileEdgedExtended {
    spriteOffsetY = 4;

    dig = true;
    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}