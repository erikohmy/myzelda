class TileOpeningBlocked extends TileBase {
    spriteOffsetX = 8;
    spriteOffsetY = 18;
    variants = 4;
    variantNames = [
        "top",
        "right",
        "bottom",
        "left"
    ];
    solid = true;
    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}