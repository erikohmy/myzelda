class TileStairs extends TileBase {
    spriteOffsetX = 6;
    spriteOffsetY = 10;
    rough = true;
    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}