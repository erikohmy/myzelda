class EntityThrown extends EntityPhysical {

    // game : reference to the game
    // entity : the entity that threw this
    // z : starting height
    constructor(game, entity, z=16, speedX=0, speedY=0) {
        super(game);
        this.carriedEntity = entity;
        this.x = entity.x;
        this.y = entity.y;
        this.z = z;
        this.thrownSpeedX = speedX;
        this.thrownSpeedY = speedY;
        this.size = entity.size ? entity.size : 8;
        this.pushesEntities = false;
        this.squishesEntities = false;
        this.canBePushed = false;
        this.canBeBlocked = true;

        this.velocityX = this.thrownSpeedX;
        this.velocityY = this.thrownSpeedY;
        this.velocityZ = 0;
    }

    forceDrop() {
        this.carriedEntity = null;
        this.remove();
    }

    tick() {
        if (this.z > 0) {
            this.z += this.velocityZ;
            /*
            this.x += this.thrownSpeedX;
            this.y += this.thrownSpeedY;
            */
        }
        this.velocityZ = this.velocityZ-0.1;
        let zo = -this.z;
        this.carriedEntity.x = this.x;
        this.carriedEntity.y = this.y + zo;

        if (this.z <= 0) {
            this.carriedEntity.onLanded();
            this.carriedEntity = null;
            this.remove();
        }
    }

    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];
        Graphics.drawShadow(this.game.ctx, this.x+ox, this.y+oy, 8, 8);
        this.carriedEntity.draw();
    }
}