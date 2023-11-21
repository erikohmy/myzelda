class EntityTestPhysical extends EntityPhysical {
    constructor(game, x, y) {
        super(game);
        this.x = x*16+8;
        this.y = y*16+8;
        this.size = 16;
        this.pushesEntities = true;
        this.squishesEntities = true;
        this.canBePushed = false;
        this.canBeBlocked = true;
        this.blockFilter = (e) => {
            return !(e instanceof EntityPlayer);
        }
    }
    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];
        let sheet = this.game.spritesheets.overworld;
        sheet.drawRegion(this.game.ctx, 48, 48, this.x-8+ox, this.y-8+oy, 16,16);
    }
}