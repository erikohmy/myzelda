class Space {
    game;
    layer;
    size;
    tiles;
    entities;
    safeSpot = null;
    built = false;

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

    get height() {
        return this.size[1]*this.game.tilesize;
    }

    get width() {
        return this.size[0]*this.game.tilesize;
    }

    get background() {
        // check if there is a background option on the space
        if (this.options.background) {
            return this.options.background;
        }
        // otherwise, check if there is a background option on the layer
        if (this.layer.options.background) {
            return this.layer.options.background;
        }
        // and if not, then return black
        return "#000";
    }
    set background(bg) {
        this.options.background = bg;
    }

    get music() {
        // check if there is a music option on the space
        if (this.options.music) {
            return this.options.music;
        }
        // otherwise, check if there is a music option on the layer
        if (this.layer.options.music) {
            return this.layer.options.music;
        }
        // and if not, then return null
        return null;
    }
    set music(music) {
        return this.options.music = music;
    }

    _build() {
        //console.log("building space", this.layer.name, this.position)
        if (this.build) {
            this.build(this);
        }
        this.built = true;
    }
    _destroy() {
        //console.log("destroying space", this.layer.name, this.position)
        this.entities.forEach(entity => {
            if (entity.destroy) {
                entity.destroy();
            }
        });
        this.entities = [];
        this.tiles = new Array(this.size[0] * this.size[1]);
        this.safeSpot = null;
        this.built = false;
        if (this.destroy) {
            this.destroy(this);
        }
    }

    getSafeLocation() {
        return this.safeSpot;
    }

    tile(x, y) { // tile coordinates
        return this.tiles[y*this.size[0]+x];
    }
    tileAt(x, y) { // world coordinates
        let tx = Math.floor(x/this.game.tilesize);
        let ty = Math.floor(y/this.game.tilesize);
        return this.tile(tx, ty);
    }
    setTile(x, y, tileinfo) {
        return this.tiles[y*this.size[0]+x] = tileinfo;
    }
    setTileAt(x, y, tileinfo) {
        let tx = Math.floor(x/this.game.tilesize);
        let ty = Math.floor(y/this.game.tilesize);
        return this.tiles[ty*this.size[0]+tx] = tileinfo;
    }
    fill(tileinfo, x=0,y=0,w=undefined,h=undefined) {
        if (h === undefined) {
            h = this.size[1];
        }
        if (w === undefined) {
            w = this.size[0];
        }
        h = Math.min(h, this.size[1]-y);
        w = Math.min(w, this.size[0]-x);
        for (let iy=y; iy<y+h; iy++) {
            for (let ix=x; ix<x+w; ix++) {
                this.setTile(ix, iy, tileinfo);
            }
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
        // get length of tilemap key
        let keys = Object.keys(tilemap);
        let keylen = keys[0].length;

        for (let y=0; y<tiledata.length; y++) {
            let row = tiledata[y];
            if (keylen > 1) {
                let regexstring = ".{1," + keylen + "}";
                let regex = new RegExp(regexstring, 'g');
                row = row.match(regex)
            }
            for (let x=0; x<row.length; x++) {
                let tile = tilemap[row[x]];
                if (tile !== undefined) {
                    this.setTile(x, y, tile);
                }
            }
        }
    }

    addEntity(entity) {
        entity.space = this;
        this.entities.push(entity);
        return entity;
    }
    removeEntity(entity) {
        let index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    getCollisionBoxes(condition = "solid", valiator = () => true) {
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
                    if (tile) {
                        if (tile[condition]) {
                            boxes.push({x:x*16, y:y*16, h:16, w:16});
                        }
                        if(condition == "solid" && !!tile.collision) {
                            // special collisions
                            let variant = this.tile(x, y)?.variant;
                            let cname = name + (variant ? "-" + variant : "");
                            let collision = tile.collision[cname];
                            if (collision == "left") {
                                boxes.push({x:x*16, y:y*16, h:16, w:8});
                            } else if (collision == "right") {
                                boxes.push({x:x*16+8, y:y*16, h:16, w:8});
                            } else if (collision == "top") {
                                boxes.push({x:x*16, y:y*16, h:8, w:16});
                            } else if (collision == "top-small") {
                                boxes.push({x:x*16, y:y*16, h:6, w:16});
                            } else if (collision == "bottom") {
                                boxes.push({x:x*16, y:y*16+8, h:8, w:16});
                            }
                        }
                    }
                }
            }
        }
        // todo: add entity collissions ( not enemies and such, only doors, tile entities, etc)
        this.entities.forEach(entity => {
            if (entity.getCollisionBox) {
                boxes.push(entity.getCollisionBox());
            }
        });
        return boxes.filter(valiator);
    }
}