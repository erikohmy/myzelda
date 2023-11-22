class TileRoad extends TileBase {
    spriteOffsetY = 16;
    variants = 2;
    variantNames = ["bright", "gray"];    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}