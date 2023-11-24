class Space {
    game;
    layer;
    size;
    tiles;
    entities;
    safeSpot = null;
    built = false;
    init = null; // init function

    options; // filter, music, etc

    _hasSpaceAbove = null;
    _hasSpaceBelow = null;
    _hasSpaceLeft = null;
    _hasSpaceRight = null;

    constructor(game, sizex, sizey) {
        this.game = game;
        this.size = [sizex, sizey];
        this.tiles = new Array(sizex * sizey);
        this.entities = [];
        this.options = {};
    }

    get hasSpaceBelow() {
        if (this._hasSpaceBelow === null) {
            let space = this.layer.getSpace(this.x, this.y+1);
            if (this.built !== false) {this._hasSpaceBelow = !!space;}
            return !!space; 
        }
        return this._hasSpaceBelow;
    }
    get hasSpaceAbove() {
        if (this._hasSpaceAbove === null) {
            let space = this.layer.getSpace(this.x, this.y-1);
            if (this.built !== false) {this._hasSpaceAbove = !!space;}
            return !!space; 
        }
        return this._hasSpaceAbove;
    }
    get hasSpaceLeft() {
        if (this._hasSpaceLeft === null) {
            let space = this.layer.getSpace(this.x-1, this.y);
            if (this.built !== false) {this._hasSpaceLeft = !!space;}
            return !!space; 
        }
        return this._hasSpaceLeft;
    }
    get hasSpaceRight() {
        if (this._hasSpaceRight === null) {
            let space = this.layer.getSpace(this.x+1, this.y);
            if (this.built !== false) {this._hasSpaceRight = !!space;}
            return !!space; 
        }
        return this._hasSpaceRight;
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
        return Graphics.colors.zyellow;
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
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return null;
        }
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
    setTilesB64(data) {
        Function("space", atob(data))(this);
    }

    addEntity(entity) {
        entity.space = this;
        this.entities.push(entity);
        this.entities.sort(entitySort);
        return entity;
    }
    createEntity(entity, args) {
        // todo, automate this?
        let entities = ["pushblock", "sign", "splash", "interval", "timer", "tick", "transitioner", "trigger"];
        if (entities.includes(entity)) {
            if (entity === "pushblock") {
                return this.addEntity(new EntityPushBlock(this.game, args.x, args.y));
            } else if (entity === "sign") {
                return this.addEntity(new EntitySign(this.game, args.x, args.y, args.text));
            } else if (entity === "splash") {
                return this.addEntity(new EntityEffectSplash(this.game, args.x, args.y));
            } else if (entity === "transitioner") {
                return this.addEntity(new EntityTransitioner(this.game, args.x, args.y, args.w, args.h, args.target));
            }
            console.error("Not implemented yet", entity);
        } else {
            console.error("Unknown entity type", entity);
        }
    }
    removeEntity(entity) {
        let index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }
    entitiesWithinRect(x, y, w, h) {// return all entities with an ORIGIN within the rect
        let entities = [];
        this.entities.forEach(entity => {
            if (entity.hasOwnProperty("x") ) {
                if (entity.hasOwnProperty("size") || entity.hasOwnProperty("width")) {
                    let ew = entity.size ? entity.size[0] : entity.width;
                    let eh = entity.size ? entity.size[1] : entity.height;
                    if (entity.x-ew/2 >= x && entity.x+ew/2 < x+w && entity.y-eh/2 >= y && entity.y+eh/2 < y+h) {
                        entities.push(entity);
                    } else if (entity.x >= x && entity.x < x+w && entity.y >= y && entity.y < y+h) {
                        entities.push(entity);
                    }
                } else if (entity.x >= x && entity.x < x+w && entity.y >= y && entity.y < y+h) {
                    entities.push(entity);
                }
            }
            
        });
        return entities;
    }

    getCollisionBoxes(condition = "solid", valiator = () => true) {
        let boxes = [];
        // add itself as a collision box, if contition is solid
        if (condition == "solid") {
            let bw = (this.size[0]+2)*16;
            let bh = (this.size[1]+2)*16;

            if (this.hasSpaceRight) {
                boxes.push({x:bw-16, y:-16, w: 16, h: bh}); // right wall
            } else {
                boxes.push({x:bw-32, y:-16, w: 16, h: bh}); // right wall
            }

            if (this.hasSpaceLeft) {
                boxes.push({x:-32, y:-16, w: 16, h: bh}); // left wall
            } else {
                boxes.push({x:-16, y:-16, w: 16, h: bh}); // left wall
            }
            
            if (this.hasSpaceAbove) {
                boxes.push({x:-16, y:-32, w: bw, h: 16}); // top wall
            } else {
                boxes.push({x:-16, y:-16, w: bw, h: 16}); // top wall
            }

            if (this.hasSpaceBelow) {
                boxes.push({x:-16, y:bh-16, w: bw, h: 16}); // bottom wall
            } else {
                boxes.push({x:-16, y:bh-32, w: bw, h: 16}); // bottom wall
            }
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
                            } else if (collision == "left-small") {
                                boxes.push({x:x*16, y:y*16, h:16, w:6});
                            } else if (collision == "right") {
                                boxes.push({x:x*16+8, y:y*16, h:16, w:8});
                            } else if (collision == "right-small") {
                                boxes.push({x:x*16+10, y:y*16, h:16, w:6});
                            } else if (collision == "top") {
                                boxes.push({x:x*16, y:y*16, h:8, w:16});
                            } else if (collision == "top-small") {
                                boxes.push({x:x*16, y:y*16, h:6, w:16});
                            } else if (collision == "bottom") {
                                boxes.push({x:x*16, y:y*16+8, h:8, w:16});
                            } else if (collision == "bottom-small") {
                                boxes.push({x:x*16, y:y*16+10, h:6, w:16});
                            } else if (collision == "bottom-xsmall") {
                                boxes.push({x:x*16, y:y*16+13, h:3, w:16});
                            }  else if (collision == "bottom-outside") {
                                boxes.push({x:x*16, y:y*16+16, h:8, w:16});
                            }
                        }
                    }
                }
            }
        }
        // todo: add entity collissions ( not enemies and such, only doors, tile entities, etc)
        this.entities.forEach(entity => {
            if (entity.noCollide !== true && entity.getCollisionBox) {
                boxes.push(entity.getCollisionBox());
            }
        });
        return boxes.filter(valiator);
    }
}