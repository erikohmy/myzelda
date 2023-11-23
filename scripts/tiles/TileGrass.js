class TileGrass extends TileEdged {
    dig = true;

    modifyTiles(tiles) {
        tiles[this.name+"-green"] = ["c", "c", "c", "c"]; // 0000 variant
        return tiles;
    }

    getSheet() {
        return this.game.spritesheets.overworld;
    }
}