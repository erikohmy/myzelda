class TileDoorway extends TileBase {
    spriteOffsetX = 2;
    spriteOffsetY = 12;

    init() {
        this.collision = {};
        this.collision[this.name] = "top-small";
    }
    
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}