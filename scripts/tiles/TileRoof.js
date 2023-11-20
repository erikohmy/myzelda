class TileRoof extends TileEdged {
    spriteOffsetY = 8;
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