class TileRoofShack extends TileBase {
    spriteOffsetY = 10;
    solid = true;
    variants = 3;
    variantNames = [
        "red",
        "blue",
        "green"
    ]
    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}