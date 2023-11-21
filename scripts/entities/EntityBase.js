class EntityBase {
    game;

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