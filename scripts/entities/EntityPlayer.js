class EntityPlayer extends EntityPhysical {
    direction;
    walking = false;

    health;
    maxHealth;
    lastDamaged = 0;
    invincibilityTime = 30; // ticks, half a second

    squishing = false;
    squishStart = 0;
    falling = false;
    damageFlash = 0;

    constructor(game, x, y) {
        super(game);
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = 10; // 10x10 collision box
        this.speed = 1;
        this.pushesEntities = true;
        this.canBeBlocked = true;
        this.canBePushed = true;
        this.canGoOutside = true;
        this.direction = 2; // down

        this.maxHealth = 14*4;
        this.health = this.maxHealth;
    }

    get isBusy() {
        // if animating a move, or dying etc.
        return this.squishing;
    }

    respawn() {
        // respawn in space safe location
        let space = this.game.world.currentSpace;
        let x, y;
        [x, y] = space.getSafeLocation();
        this.setPosition(x,y);
    }

    damage(amount, ignoreInvincibility=false, makeSound=true) {
        let ticksSinceDamaged = this.game.gametick - this.lastDamaged;
        if (ticksSinceDamaged > this.invincibilityTime || ignoreInvincibility) {
            this.lastDamaged = this.game.gametick;
            if (this.health <= 0) {
                // already dead
                this.health = 0;
            } else {
                this.health -= amount;
                this.damageFlash = 40;
                if (makeSound) {
                    this.game.sound.play("link_hurt");
                }
                if (this.health <= 0) {
                    this.health = 0;
                    // died!
                }
            }
        }
    }

    squish() {
        if (this.squishing) {
            return;
        }
        this.squishing = true;
        this.walking=false;
        this.squishStart = this.game.gametick;
        this.size = 2;
        this.game.waitTicks(30).then(() => {
            this.damage(4);
            this.game.waitTicks(30).then(() => {
                this.respawn();
                this.size = 10;
                this.squishing = false;
            });
        });
    }

    tick() {
        super.tick();
        if (this.damageFlash > 0) {
            this.damageFlash--;
        }
    }

    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];

        let sheet = this.game.spritesheets.player;

        let sox = 0; // sprite offset x
        let soy = 0; // sprite offset y

        sox += this.direction;
        if (this.isColliding() && this.walking) {
            soy += 1;
        }

        if (this.walking && this.game.animationtick % 15 > 7) {
            sox += 4;
        }

        let filterBefore = this.game.ctx.filter;

        // flash red if damaged
        if (this.damageFlash > 0) {
            let flashInterval = 6;
            if (this.game.animationtick%flashInterval >= flashInterval/2) {
                this.game.ctx.filter = "grayscale(100%) sepia(100%) saturate(100) hue-rotate(0deg)"
            } else {
                this.game.ctx.filter = "grayscale(100%) contrast(0.5) brightness(160%)";
            }
        }

        // draw player
        if (this.squishing) {
            // squish the sprite!
            // squish is 60 ticks (1 second), shrink for 30, remain thin for 30
            // player sprite is 16 wide, so shrink to 4 over 30 ticks, 12 px reduction, both sides, so 6px at 30
            let reduction = 12*(this.game.gametick - this.squishStart)/30;
            reduction = Math.min(12, reduction);
            sheet.drawSprite(this.game.ctx, sox, soy, this.x-8+ox + reduction/2, this.y-11+oy, 16-reduction, 16);
        } else {
            sheet.drawSprite(this.game.ctx, sox, soy, this.x-8+ox, this.y-11+oy);
        }
        this.game.ctx.filter = filterBefore;

        // draw tile we are inside
        if (this.game.debug) {
            let tx, ty;
            [tx, ty] = tileSnap(this.x, this.y);
            this.game.setColor("#FF0000"); // red
            this.game.ctx.strokeRect(tx+ox, ty+oy, 16, 16);
        }

        /*
        this.game.setColor("#00FF00"); // green
        this.game.ctx.fillRect(this.x-(this.size/2)+ox, this.y-(this.size/2)+oy, this.size, this.size);

        this.game.setColor("#FF0000"); // red
        if(this.colliding[0]) { // colliding top
            this.game.ctx.fillRect(this.x-(this.size/2)+ox, this.y-(this.size/2)+oy, this.size, 2);
        }
        if(this.colliding[1]) { // colliding right
            this.game.ctx.fillRect(this.x+(this.size/2)+ox-2, this.y-(this.size/2)+oy, 2, this.size);
        }
        if(this.colliding[2]) { // colliding bottom
            this.game.ctx.fillRect(this.x-(this.size/2)+ox, this.y+(this.size/2)+oy-2, this.size, 2);
        }
        if(this.colliding[3]) { // colliding left
            this.game.ctx.fillRect(this.x-(this.size/2)+ox, this.y-(this.size/2)+oy, 2, this.size);
        }
        */
    }
}