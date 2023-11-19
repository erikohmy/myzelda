class TileEdgedExtended extends TileEdged {
    spriteMap = [
        ["tl", "tr", "t", "r", "c00", "c01", "c02", "c03", "c20", "c21", "c22", "c23"], 
        ["bl", "rb", "b", "l", "c10", "c11", "c12", "c13", "c30", "c31", "c32", "c33"],
    ];

    defineTiles() {
        let tiles = {};
        tiles[this.name]         = ["c11", "c12", "c21", "c22"]; // 0000
        tiles[this.name+"-t"]    = ["t", "t", "c01", "c02"]; // 1000
        tiles[this.name+"-r"]    = ["c13", "r", "c23", "r"]; // 0100
        tiles[this.name+"-b"]    = ["c31", "c32", "b", "b"]; // 0010 
        tiles[this.name+"-l"]    = ["l", "c10", "l", "c20"]; // 0001
        tiles[this.name+"-tr"]   = ["t", "tr", "c03", "r"]; // 1100
        tiles[this.name+"-rb"]   = ["c33", "r", "b", "rb"]; // 0110
        tiles[this.name+"-bl"]   = ["l", "c30", "bl", "b"]; // 0011
        tiles[this.name+"-tl"]   = ["tl", "t", "l", "c00"]; // 1001
        tiles[this.name+"-tb"]   = ["t", "t", "b", "b"]; // 1010
        tiles[this.name+"-rl"]   = ["l", "r", "l", "r"]; // 0101

        tiles[this.name+"-trb"]  = ["t", "tr", "b", "rb"]; // 1110
        tiles[this.name+"-tbl"]  = ["tl", "t", "bl", "b"]; // 1011
        tiles[this.name+"-trl"]  = ["tl", "tr", "l", "r"]; // 1101
        tiles[this.name+"-rbl"]  = ["l", "r", "bl", "rb"]; // 0111

        tiles[this.name+"-trbl"] = ["tl", "tr", "bl", "rb"]; // 1111
        return tiles;
    }
}