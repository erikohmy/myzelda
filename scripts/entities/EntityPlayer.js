class EntityPlayer extends EntityPhysical {
    direction;
    walking = false;

    health;
    maxHealth;
    lastDamaged = 0;
    invincibilityTime = 30; // ticks, half a second
    timePushed = 0;
    pushingEntity = null;

    squishing = false;
    squishStart = 0;
    falling = false;
    damageFlash = 0;

    canSwim = true;

    inpuddle = false;
    isSwimming = false;

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
        if (this.game.dialog.show) {
            return true;
        }
        // if animating a move, or dying etc.
        return this.squishing;
    }

    setPushingEntity(entity) {
        if (!entity) {
            if (this.pushingEntity) {
                this.timePushed = 0;
                this.pushingEntity = null;
            }
        } else if(entity !== this.pushingEntity) {
            this.timePushed = 0;
            this.pushingEntity = entity;
        } else if(entity === this.pushingEntity) {
            this.timePushed++;
        }
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

        if (this.pushingEntity && this.timePushed >= 30) {
            if (this.pushingEntity.push){
                this.pushingEntity.push(this.direction);
            }
            this.timePushed = 0;
        }

        let beneath = this.tileBeneath();
        let tile = this.game.tile(beneath)
        if (tile) {
            if (tile.wet) {
                this.inpuddle = true;
            } else {
                this.inpuddle = false;
            }

            if (tile.swim) {
                if (this.canSwim) {
                    this.isSwimming = true;
                } else {
                    console.log('drowned')
                    this.respawn();// drown instead
                }
            } else {
                this.isSwimming = false;
            }

            if (tile.hole) {
                // check if we should fall to lower layer?
                console.log('fell')
                this.respawn();// fall instead
            }
        }
    }

    actionMain() {
        // interact with entity in front of us
        let bx = this.x-8+this.game.offset[0];
        let by = this.y-8+this.game.offset[1];
        if (this.direction == 0) {by-=8;}
        else if (this.direction == 1) {bx+=8;}
        else if (this.direction == 2) {by+=8;}
        else if (this.direction == 3) {bx-=8;}
        let entities = this.space.entitiesWithinRect(bx,by,16,16).filter(e => !!e.interact);
        if (entities.length > 0) {
            entities[0].interact();
            return true;
        }
        // if no entity, use main item
        console.log("using main item")
    }

    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];

        let sheet = this.game.spritesheets.player;

        let sox = 0; // sprite offset x
        let soy = 0; // sprite offset y

        sox += this.direction;
        if(this.isSwimming) {
            soy += 2;
        } else if (this.isColliding() && this.walking) {
            soy += 1;
        }

        if (!this.isBusy && this.walking && this.game.animationtick % 15 > 7) {
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

        // if we are standing in a puddle, draw wet effect
        if (this.inpuddle) {
            //let sheet = this.game.spritesheets.overworld;
            //sheet.drawRegion(this.game.ctx, 48, 48, this.x-8+ox, this.y-8+oy, 16,16);
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