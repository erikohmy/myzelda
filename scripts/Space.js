class Space {
    game;
    layer;
    size;
    tiles;
    entities;

    options; // filter, music, etc

    constructor(game, sizex, sizey) {
        this.game = game;
        this.size = [sizex, sizey];
        this.tiles = new Array(sizex * sizey);
        this.entities = [];
        this.options = {};
    }
    get position() {
        return this.layer.getSpacePosition(this);
    }
    get x() {
        let x,y;
        [x, y] = this.position;
        return x;
    }

    get y() {
        let x,y;
        [x, y] = this.position;
        return y;
    }

    get background() {
        let bg = this.options.background;
        if (bg) {
            return bg;
        }
        return "#000";
    }
    set background(bg) {
        this.options.background = bg;
    }

    tile(x, y) {
        return this.tiles[y*this.size[0]+x];
    }
    setTile(x, y, tileinfo) {
        return this.tiles[y*this.size[0]+x] = tileinfo;
    }
    fill(tileinfo) {
        for (let i=0; i<this.tiles.length; i++) {
            this.tiles[i] = tileinfo;
        }
    }
    border(tileinfo) {
        for (let x=0; x<this.size[0]; x++) {
            this.setTile(x, 0, tileinfo);
            this.setTile(x, this.size[1]-1, tileinfo);
        }
        for (let y=0; y<this.size[1]; y++) {
            this.setTile(0, y, tileinfo);
            this.setTile(this.size[0]-1, y, tileinfo);
        }
    }
    setTiles(tilemap, tiledata) {
        for (let y=0; y<tiledata.length; y++) {
            let row = tiledata[y];
            for (let x=0; x<row.length; x++) {
                let tile = tilemap[row[x]];
                if (tile !== undefined) {
                    this.setTile(x, y, tile);
                }
            }
        }
    }

    getCollisionBoxes(condition = "solid") {
        let boxes = [];
        // add itself as a collision box, if contition is solid
        if (condition == "solid") {
            let bw = (this.size[0]+2)*16;
            let bh = (this.size[1]+2)*16;
            boxes.push({x:-32, y:-16, w: 16, h: bh}); // left wall
            boxes.push({x:bw-16, y:-16, w: 16, h: bh}); // right wall
            boxes.push({x:-16, y:-32, w: bw, h: 16}); // top wall
            boxes.push({x:-16, y:bh-16, w: bw, h: 16}); // bottom wall
        }

        // add tile collissions
        for (let y=0; y<this.size[1]; y++) {
            for (let x=0; x<this.size[0]; x++) {
                let name = this.tile(x, y)?.name;
                if (name) {
                    let tile = this.game.tiles[name];
                    if (tile[condition]) {
                        boxes.push({x:x*16, y:y*16, h:16, w:16});
                    }
                }
            }
        }
        // todo: add entity collissions ( not enemies and such, only doors, tile entities, etc)
        return boxes;
    }
}