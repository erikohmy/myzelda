class TileEdged extends TileBase {
    spriteMap = [
        ["tl", "tr", "t", "r", "c"], // topleft, topright, top, right, center
        ["bl", "rb", "b", "l", "v"], // bottomleft, bottomright, bottom, left, variant
    ];

    defineTiles() {
        let tiles = {};
        tiles[this.name]         = ["c", "v", "v", "c"]; // 0000
        tiles[this.name+"-t"]    = ["t", "t", "v", "c"]; // 1000
        tiles[this.name+"-r"]    = ["c", "r", "v", "r"]; // 0100
        tiles[this.name+"-b"]    = ["c", "v", "b", "b"]; // 0010 
        tiles[this.name+"-l"]    = ["l", "v", "l", "c"]; // 0001
        tiles[this.name+"-tr"]   = ["t", "tr", "v", "r"]; // 1100
        tiles[this.name+"-rb"]   = ["c", "r", "b", "rb"]; // 0110
        tiles[this.name+"-bl"]   = ["l", "v", "bl", "b"]; // 0011
        tiles[this.name+"-tl"]   = ["tl", "t", "l", "c"]; // 1001
        tiles[this.name+"-tb"]   = ["t", "t", "b", "b"]; // 1010
        tiles[this.name+"-rl"]   = ["l", "r", "l", "r"]; // 0101

        tiles[this.name+"-trb"]  = ["t", "tr", "b", "rb"]; // 1110
        tiles[this.name+"-tbl"]  = ["tl", "t", "bl", "b"]; // 1011
        tiles[this.name+"-trl"]  = ["tl", "tr", "l", "r"]; // 1101
        tiles[this.name+"-rbl"]  = ["l", "r", "bl", "rb"]; // 0111

        tiles[this.name+"-trbl"] = ["tl", "tr", "bl", "rb"]; // 1111
        return tiles;
    }

    drawTile(ctx, x, y, options={}) {
        let sprite = this.name;
        if (options?.edges) sprite += "-" + options?.edges;
        if (! this.sprites.hasOwnProperty(sprite)) {
            sprite = this.name;
        }
        ctx.drawImage(this.sprites[sprite], x, y);
    }

    drawTest(ctx, x, y) {
        this.draw(ctx, x+0, y+0, {edges: "tl"})
        this.draw(ctx, x+16, y+0, {edges: "t"})
        this.draw(ctx, x+32, y+0, {edges: "tr"})
        this.draw(ctx, x+0, y+16, {edges: "l"})
        this.draw(ctx, x+16, y+16)
        this.draw(ctx, x+32, y+16, {edges: "r"})
        this.draw(ctx, x+0, y+32, {edges: "bl"})
        this.draw(ctx, x+16, y+32, {edges: "b"})
        this.draw(ctx, x+32, y+32, {edges: "rb"})
        this.draw(ctx, x+48, y+0, {edges: "tb"})
        this.draw(ctx, x+48, y+16, {edges: "rl"})
        this.draw(ctx, x+0, y+48, {edges: "trb"})
        this.draw(ctx, x+16, y+48, {edges: "tbl"})
        this.draw(ctx, x+32, y+48, {edges: "trl"})
        this.draw(ctx, x+48, y+48, {edges: "rbl"})
        this.draw(ctx, x+48, y+32, {edges: "trbl"})
    }
}

edgesFromString = function(str) {
    let out = "";
    let order = "trbl";
    for (let i=0; i<order.length; i++) {
        let letter = order[i];
        if (str.includes(letter)) {
            out += letter;
        }
    }
    return out;
}