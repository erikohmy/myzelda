class TileBridge extends TileBase {
    spriteOffsetX = 8;
    spriteOffsetY = 10;
    variants = 4;
    variantNames = [
        "top",
        "right",
        "bottom",
        "left"
    ];

    init() {
        this.collision = {};
        this.collision[this.name+"-top"] = "top-small";
        this.collision[this.name+"-right"] = "right-small";
        this.collision[this.name+"-bottom"] = "bottom-xsmall";
        this.collision[this.name+"-left"] = "left-small";
    }
    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}