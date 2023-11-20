class TileWindow extends TileBase {
    spriteOffsetY = 12;
    solid = true;
    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}