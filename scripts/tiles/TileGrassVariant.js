class TileGrassVariant extends TileEdged {
    spriteOffsetX = 5;
    dig = true;
    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}