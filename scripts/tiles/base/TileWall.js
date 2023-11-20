class TileWall extends TileSimple {
    solid=true;
    defineTiles() {
        let tiles = {};
        tiles[this.name+"-t"]    = [0,0]; 
        tiles[this.name+"-r"]    = [1,0]; 
        tiles[this.name+"-b"]    = [2,0]; 
        tiles[this.name+"-l"]    = [3,0];
        tiles[this.name+"-tl"]    = [0,1];
        tiles[this.name+"-tr"]    = [1,1]; 
        tiles[this.name+"-bl"]    = [2,1];
        tiles[this.name+"-rb"]    = [3,1];
        tiles[this.name+"-otl"]    = [0,2];
        tiles[this.name+"-otr"]    = [1,2]; 
        tiles[this.name+"-obl"]    = [2,2];
        tiles[this.name+"-orb"]    = [3,2];
        return tiles;
    }
}