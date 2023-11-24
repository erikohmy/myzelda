class TileOpening extends TileBase {
    spriteOffsetX = 0;
    spriteOffsetY = 18;
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
        this.collision[this.name+"-bottom"] = "bottom-outside";
        this.collision[this.name+"-left"] = "left-small";
    }
    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}