class EntityBase {
    game;
    physical = false;
    zindex = 0; // higher zindex means it is drawn on top

    constructor(game) {
        this.game = game;
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

    remove() {
        this.space.removeEntity(this);
    }
}