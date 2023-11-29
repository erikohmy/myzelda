class TileTowerWall extends TileSimple {
    spriteOffsetX = 22;
    spriteOffsetY = 0;
    solid=true;
    defineTiles() {
        let tiles = {};
        tiles[this.name+"-top-ctl"]   = [0,0];
        tiles[this.name+"-top-ctr"]   = [1,0];
        tiles[this.name+"-top-hm"]    = [2,0];
        tiles[this.name+"-top-vet"]   = [3,0];
        tiles[this.name+"-top-t-top"]   = [4,0];

        tiles[this.name+"-top-cbl"]     = [0,1];
        tiles[this.name+"-top-cbr"]     = [1,1];
        tiles[this.name+"-top-vm"]      = [2,1];
        tiles[this.name+"-top-veb"]     = [3,1];
        tiles[this.name+"-top-t-right"] = [4,1];

        tiles[this.name+"-sml"]  = [0,2];
        tiles[this.name+"-mid"]  = [1,2];
        tiles[this.name+"-smr"]  = [2,2];
        tiles[this.name+"-cm"]   = [3,2];
        tiles[this.name+"-top-t-bottom"] = [4,2];

        tiles[this.name+"-sbl"]  = [0,3];
        tiles[this.name+"-bot"]  = [1,3];
        tiles[this.name+"-sbr"]  = [2,3];
        tiles[this.name+"-cb"]   = [3,3];
        tiles[this.name+"-top-t-left"] = [4,3];

        return tiles;
    }
    getSheet() {
        return this.game.spritesheets.overworld;
    }
}