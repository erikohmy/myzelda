class EntityEffectShatter extends EntityBase {
    effectFrames = 2;
    effectTicksPerFranme = 6;
    
    constructor(game, x, y, sound=true, zindex=20) {
        super(game);
        this.x = x;
        this.y = y;
        this._ticks = 0;
        this.zindex = zindex;
        if (sound) {
            this.game.sound.play("shatter");
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
        let sheet = this.game.spritesheets.effects;

        let frame = this.effectFrame;
        if (frame == 0) {
            sheet.drawRegion(this.game.ctx, 2*16, 16, this.x-8+ox, this.y-8+oy, 16, 16);
        } else if (frame == 1) {
            sheet.drawRegion(this.game.ctx, 3*16, 16, this.x-8+ox, this.y-8+oy, 16, 16);
        }
        if (this.game.debug) {
            this.game.setColor("red");
            this.game.ctx.fillRect(this.x-1+ox, this.y-1+oy, 2, 2);
        }
    }
}