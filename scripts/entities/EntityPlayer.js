class EntityPlayer extends EntityPhysical {
    zindex = 10;

    direction;
    walking = false;

    health;
    maxHealth;
    lastDamaged = 0;
    invincibilityTime = 30; // ticks, half a second
    timePushed = 0;
    pushingEntity = null;

    squishing = false;
    falling = false;
    drowning = false;
    actionStart = 0; // animation start tick, for squishing, falling, drowning, etc
    damageFlash = 0;

    canSwim = true;

    inAir = false;
    inPuddle = false;
    onRoughGround = false;
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
        this.moveNudge = true;
        this.direction = 2; // down

        this.maxHealth = 14*4;
        this.health = this.maxHealth;
    }

    get isBusy() {
        if (this.game.dialog.show || this.game.cutscene) {
            return true;
        }
        // if animating a move, or dying etc.
        return this.squishing || this.falling || this.drowning;
    }

    get isPushing() {
        // but also if we push a solid tile...
        return this.pushingEntity !== null || (this.isColliding() && this.walking);
    }

    get moveSpeed() {
        if (this.isSwimming||this.onRoughGround) {
            return 0.5;
        }
        return 1;
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

        // disable all triggers temporarily ( they get reenabled by not being triggered)
        for (let i=0; i<space.entities.length; i++) {
            let entity = space.entities[i];
            if (entity instanceof EntityTrigger) {
                entity.tempDisabled = true;
            }
        }

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
        this.actionStart = this.game.gametick;
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

    fall() {
        if (this.falling) {
            return;
        }
        this.falling = true;
        this.walking=false;
        this.actionStart = this.game.gametick;
        this.game.sound.play("link_fall");
        this.game.waitTicks(60).then(() => {
            this.damage(4);
            this.respawn();
            this.falling = false;
        });
    }

    drown() {
        if (this.drowning) {
            return;
        }
        this.drowning = true;
        this.walking=false;
        this.game.waitTicks(30).then(() => {
            this.damage(4);
            this.respawn();
            this.drowning = false;
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
        if (tile && !this.inAir) {
            if (tile.wet) {
                this.inPuddle = true;
            } else {
                this.inPuddle = false;
            }
            if (tile.rough) {
                this.onRoughGround = true;
            } else {
                this.onRoughGround = false;
            }

            if (tile.swim) {
                if (this.canSwim) {
                    if (this.isSwimming === false) {
                        this.isSwimming = true;
                        let splash = new EntityEffectSplash(this.game, this.x, this.y);
                        this.space.addEntity(splash);
                    }
                } else {
                    if (! this.drowning) {
                        let splash = new EntityEffectSplash(this.game, this.x, this.y);
                        this.space.addEntity(splash);
                        this.drown();
                    }
                }
            } else {
                this.isSwimming = false;
            }

            if (tile.hole) {
                // check if we should fall to lower layer?
                this.fall();
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
        let x = this.x;
        let y = this.y;
        let wo = 8; // width offset
        let ho = 11; // height offset
        let sox = 0; // sprite offset x
        let soy = 0; // sprite offset y

        if (this.falling) {
            let ticks = this.game.gametick - this.actionStart;
            let falltime = 60;
            let frames = 3;
            let frame = Math.floor(ticks/(falltime/frames));
            sox = 8 + frame;
            soy = 0;
            let tx, ty;
            [tx, ty] = tileSnap(this.x, this.y);
            sheet.drawSprite(this.game.ctx, sox, soy, tx+ox, ty+oy);
            return;
        } else if (this.drowning) {
            sox = 8 + (this.game.animationtick % 15 > 7 ? 1 : 0);
            soy = 1;
            sheet.drawSprite(this.game.ctx, sox, soy, x-8+ox, y-8+oy);
            return;
        }

        sox += this.direction;
        if(this.isSwimming) {
            soy += 2;
            ho = 8;
        } else if (this.isPushing) {
            // todo: do we need to check multiple directions?
            let collideDir = this.colliding.indexOf(1);
            if (this.direction !== collideDir && collideDir !== -1) {
                sox -= this.direction;
                sox += collideDir;
            }
            soy += 1;
        }

        // animate walking or swimming
        if (!this.isBusy && (this.walking || this.isSwimming) && this.game.animationtick % 15 > 7) {
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
            let reduction = Math.min(12, 12*(this.game.gametick - this.actionStart)/30);
            sheet.drawSprite(this.game.ctx, sox, soy, x-wo+ox + reduction/2, y-ho+oy, 16-reduction, 16);
        } else {
            sheet.drawSprite(this.game.ctx, sox, soy, x-wo+ox, y-ho+oy);
        }
        this.game.ctx.filter = filterBefore;

        // if we are standing in a puddle, draw wet effect, actually, handler on ALL entities that are physical instead
        if (this.inPuddle) {
            //let sheet = this.game.spritesheets.overworld;
            //sheet.drawRegion(this.game.ctx, 48, 48, this.x-8+ox, this.y-8+oy, 16,16);
        }

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