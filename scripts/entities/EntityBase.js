class EntityBase {
    game;
    physical = false;
    canBeCarried = false; // can be carried, at all (does not allow carrying on its own)
    _zindex = 0; // higher zindex means it is drawn on top

    constructor(game) {
        this.game = game;
    }

    get zindex() {
        if(this.isCarried) {
            return this.carriedBy.zindex + 1;
        }
        return this._zindex;
    }
    set zindex(z) {
        this._zindex = z;
    }

    get isCarriedByPlayer() {
        return this.canBeCarried === true && this.game.player.carriedEntity === this;
    }

    get isCarriedByEntity() {
        return this.canBeCarried === true && this.game.world.currentSpace &&
            this.game.world.currentSpace.entities.some(e => e.carriedEntity === this);
    }

    get isCarried() {
        return this.isCarriedByPlayer || this.isCarriedByEntity;
    }

    get carriedBy() {
        if (this.isCarriedByPlayer) return this.game.player;
        if (this.isCarriedByEntity) return this.game.world.currentSpace.entities.find(e => e.carriedEntity === this);
        return null;
    }

    tileBeneath(set=null) {
        let tile = this.space.tileAt(this.x, this.y);
        if (set) {
            if (typeof set === "string"){
                this.space.setTileAt(this.x, this.y, {name: set})
            } else {
                this.space.setTileAt(this.x, this.y, set)
            } 
        }
        return tile;
    }

    onLanded() { // called when the entity lands on a tile, usually used by carriable entities, and some pushable entities
        let beneath = this.tileBeneath();
        let tile = this.game.tile(beneath)
        if (tile) {
            if (tile.swim) {
                this.space.createEntity("splash", {x: this.x, y: this.y});
            } else if(tile.hole) {
                // should be block fall effect
                let x,y;
                [x,y] = tileSnap(this.x, this.y);
                this.space.createEntity("fall", {x: x+8, y: y+8});
            } else {
                this.space.createEntity("shatter", {x: this.x, y: this.y});
            }
        } else {
            this.space.createEntity("poof", {x: this.x, y: this.y});
        }
        this.remove();
    }

    remove() {
        if (this.isCarried) {
            this.carriedBy.forceDrop();
        }
        this.space.removeEntity(this);
    }

    getDebugInfo() {
        let info = {
            class: this.constructor.name,
            isCarried: this.isCarried,
            zindex: this.zindex,
        }
        return info;
    }

}