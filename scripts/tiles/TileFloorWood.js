class TileFloorWood extends TileSimple {
    spriteOffsetY = 6;
    getSheet() {
        return this.game.spritesheets.buildings;
    }
    defineTiles() {
        let tiles = {};
        tiles[this.name]            = [0,0]; 
        tiles[this.name+"-alt"]     = [1,0]; 
        tiles[this.name+"-carpet1"] = [2,0]; 
        tiles[this.name+"-carpet2"] = [3,0];
        return tiles;
    }
}