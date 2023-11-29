class TileRoad extends TileBase {
    spriteOffsetY = 16;
    variants = 3;
    variantNames = ["bright", "gray", "tower"];    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}