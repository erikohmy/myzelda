class EntityEffectSplash extends EntityBase {
    zindex = 9;// right before player
    effectFrames = 3;
    effectTicksPerFranme = 4;
    constructor(game, x, y, sound=true, zindex=9) {
        super(game);
        this.x = x;
        this.y = y;
        this._ticks = 0;
        this.zindex = zindex;
        if (sound) {
            this.game.sound.play("link_wade");
        }
    }
    get effectFrame() {
        return Math.floor(this._ticks/this.effectTicksPerFranme)%this.effectFrames;
    }
    tick() {
        this._ticks++;
        if (this._ticks >= this.effectFrames*this.effectTicksPerFranme) {
            this.remove();
        }
    }
    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];
        let co = 8; // centering offset
        let sheet = this.game.spritesheets.effects;

        let frame = this.effectFrame;
        if (frame == 0) {
            sheet.drawRegion(this.game.ctx, 0, 0, this.x-8+ox, this.y-6+oy-co, 16, 14);
        } else if (frame == 1) {
            sheet.drawRegion(this.game.ctx, 0, 0, this.x-8+ox-2, this.y-8+oy-co, 8, 16);
            sheet.drawRegion(this.game.ctx, 8, 0, this.x+ox+2, this.y-8+oy-co, 8, 16);
        } else if (frame == 2) {
            sheet.drawRegion(this.game.ctx, 0, 0, this.x-8+ox-4, this.y-8+oy-co, 8, 16);
            sheet.drawRegion(this.game.ctx, 8, 0, this.x+ox+4, this.y-8+oy-co, 8, 16);
        }
        if (this.game.debug) {
            this.game.setColor("red");
            this.game.ctx.fillRect(this.x-1+ox, this.y-1+oy, 2, 2);
        }
    }
}