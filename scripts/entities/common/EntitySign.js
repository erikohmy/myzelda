class EntitySign extends EntityBase {
    constructor(game, x, y, text) {
        super(game);
        this.x = x*16+8;
        this.y = y*16+8;
        this.size = 16;
        this.signText = text;
    }
    getCollisionBox() {
        let x = this.x-8;
        let y = this.y-8;
        let w = 16;
        let h = 16;
        return {x:x, y:y, w: w, h: h}
    }
    interact() {
        if (this.game.player.direction !== 0) {
            this.game.dialog.display("You can't read\nit from here!")
        } else {
            this.game.dialog.display(this.signText)
        }
    }
    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];
        let sheet = this.game.spritesheets.overworld;
        sheet.drawRegion(this.game.ctx, 6*8, 14*8, this.x-8+ox, this.y-8+oy, 16, 16);
    }
}