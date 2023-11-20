class TileChimney extends TileBase {
    spriteOffsetX = 4;
    spriteOffsetY = 12;
    solid = true;
    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}