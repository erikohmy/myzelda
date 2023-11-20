class TileInnerDoorway extends TileSimple {
    spriteOffsetY = 8;

    init() {
        // setup collision for variants, door-left only collides on the left half of the tile, etc.
        this.collision = {};
        this.collision[this.name+"-left"] = "left";
        this.collision[this.name+"-right"] = "right";
    }
    getSheet() {
        return this.game.spritesheets.buildings;
    }
    defineTiles() {
        let tiles = {};
        tiles[this.name]          = [0,0]; 
        tiles[this.name+"-left"]  = [1,0]; 
        tiles[this.name+"-right"] = [2,0]; 
        return tiles;
    }
}