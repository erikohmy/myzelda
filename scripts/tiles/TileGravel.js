class TileGravel extends TileEdged {
    spriteOffsetY = 2;
    dig = true;

    spriteMap = [
        ["tl", "tr", "t", "r", "c","r1","r2"], // topleft, topright, top, right, center
        ["bl", "rb", "b", "l", "v","r3","r4"], // bottomleft, bottomright, bottom, left, variant
    ];

    modifyTiles(tiles) {
        tiles[this.name+"-rough"] = ["r1", "r2", "r3", "r4"]; 
        return tiles;
    }

    getSheet() {
        return this.game.spritesheets.overworld;
    }
}