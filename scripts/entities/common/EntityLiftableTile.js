class LiftableTile extends EntityBase {
    constructor(game, x, y, tile) {
        super(game);
        this.canBeCarried = true;
        this.x = x*16+8;
        this.y = y*16+8;
        this.size = 16;
        this.tile = {...tile};
        this.tile.background = "transparent";
    }
    
    getCollisionBox() {
        let x = this.x-8;
        let y = this.y-8;
        let w = 16;
        let h = 16;
        return {entity: this, x:x, y:y, w: w, h: h}
    }
    lift() {
        return true;
    }
    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];
        let name = this.tile?.name ? this.tile.name : "grass2";
        this.game.tiles[name].draw(this.game.ctx, this.x-8+ox, this.y-8+oy, this.tile);
    }
}