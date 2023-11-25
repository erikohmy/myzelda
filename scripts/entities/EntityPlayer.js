class EntityPlayer extends EntityPhysical {
    opacity = 1;

    direction;
    walking = false;

    health;
    maxHealth;
    lastDamaged = 0;
    invincibilityTime = 30; // ticks, half a second
    pushingEntity = null;
    carriedEntity = null;

    squishing = false;
    falling = false;
    drowning = false;
    actionStart = 0; // animation start tick, for squishing, falling, drowning, etc
    jumpStart = 0; // animation start tick, for jumping, because we can do stuff while jumping
    jumpTime = 30;
    damageFlash = 0;

    canSwim = true;

    inPuddle = false;
    onRoughGround = false;
    isSwimming = false;
    isJumping = false;
    isGrabbing = false;
    isPulling = false;

    inventoryItems = {}; // all items that the player can have (including ones not available/found yet)
    hotbarItems = [null, null]; // items equipped in A and B slot

    constructor(game, x, y) {
        super(game);
        this.game = game;
        this.zindex = 10;
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

        this.registerItems();
    }

    get isBusy() { // player cannot take action, due to dying, dialog, cutscene, etc
        if (this.game.dialog.show || this.game.cutscene || this.game.world.transitioning) {
            return true;
        }
        // if animating a move, or dying etc.
        return this.squishing || this.falling || this.drowning;
    }

    get inAir() {
        return this.isJumping;
    }

    get isPushing() {
        // but also if we push a solid tile...
        return this.pushingEntity !== null || (this.isColliding() && this.walking && !this.isJumping);
    }

    get isCarrying() {
        return this.carriedEntity !== null;
    }

    get moveSpeed() {
        if (this.isSwimming||this.onRoughGround) {
            return 0.5;
        }
        return 1;
    }

    get oppositeDirection() {
        return (this.direction+2)%4;
    }

    registerItems() {
        this.inventoryItems.rocs_feather = new ItemJumpFeather(this.game);
        this.inventoryItems.grab = new ItemGrab(this.game);
    }

    setPushingEntity(entity) {
        if (!entity) {
            if (this.pushingEntity) {
                this.pushingEntity = null;
            }
        } else if(entity !== this.pushingEntity) {
            this.pushingEntity = entity;
        }
    }

    respawn() {
        this.game.interface.clearPressed();
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
            this.throw(false);// release any carried item
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
        this.throw(false);// release any carried item
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
        this.throw(false);// release any carried item
        this.drowning = true;
        this.walking=false;
        this.game.waitTicks(30).then(() => {
            this.damage(4);
            this.respawn();
            this.drowning = false;
        });
    }

    jump() {
        if (this.isJumping) {
            return;
        }
        this.isJumping = true;
        this.jumpStart = this.game.logictick;
        this.game.sound.play("link_jump");
        this.game.waitTicks(this.jumpTime, "logic").then(() => {
            this.isJumping = false;
            this.landed();
        });
    }

    tick() {
        super.tick();
        if (this.isCarrying) {
            // if we are carrying something, move it with us
            this.carriedEntity.x = this.x;
            this.carriedEntity.y = this.y-16;
        }
        for (let i=0; i<this.hotbarItems.length; i++) {
            let item = this.inventoryItems[this.hotbarItems[i]];
            if (item) {
                item.whileEquipped();
            }
        }

        if (this.damageFlash > 0) {
            this.damageFlash--;
        }

        if (this.pushingEntity) {
            if (this.pushingEntity.push){
                this.pushingEntity.push(this.direction);
            }
        }

        let beneath = this.tileBeneath();
        let tile = this.game.tile(beneath)
        if (beneath && beneath.goesTo) {
            if (this.previousTile !== null && !this.isBusy) {
                this.previousTile = beneath;
                this.game.world.goToString(beneath.goesTo);
            }
        } else if (tile && !this.inAir) {
            this.previousTile = beneath;
            if (tile.wet) {
                this.inPuddle = true;
                if ((this.game.walkticks+1)%20 === 0) {
                    this.game.sound.play("link_wade", 0.04);
                }
            } else {
                this.inPuddle = false;
            }
            if (tile.rough) {
                this.onRoughGround = true;
            } else {
                this.onRoughGround = false;
            }

            if (tile.swim) {
                if(this.isCarrying) {
                    this.throw(false);
                }
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
                // check how close to the center we are
                let tx, ty;
                [tx, ty] = tileSnap(this.x, this.y);
                tx += 8;
                ty += 8;
                let dx = Math.abs(this.x - tx);
                let dy = Math.abs(this.y - ty);
                
                if (dx < 4 && dy < 4) {
                    this.throw(false);
                    // check if we should fall to lower layer?
                    this.fall();
                } else {
                    // nudge towards center
                    let xnudge = 0;
                    let ynudge = 0;
                    if (this.x < tx) {
                        xnudge = 1;
                    } else if (this.x > tx) {
                        xnudge = -1;
                    }
                    if (this.y < ty) {
                        ynudge = 1;
                    } else if (this.y > ty) {
                        ynudge = -1;
                    }
                    let nudgestrength = 0.2;
                    this.move(xnudge*nudgestrength, ynudge*nudgestrength);
                }
                
            }
        }
    }

    landed() {
        // landed on a tile, from jumping or falling
        let beneath = this.tileBeneath();
        let tile = this.game.tile(beneath)
        if (tile) {
            if(!tile.hole && !tile.swim && !tile.wet) {
                this.game.sound.play("link_land_run");
            } else if(tile.wet) {
                this.game.sound.play("link_wade");
            }
        }
    }

    // Items and actions
    equipItem(itemName, slot) {
        if(this.hotbarItems[slot] === undefined) {
            console.error("Trying to equip", itemName, "into an invalid hotbar slot", slot);
            return;
        }
        if (itemName === null) {
            if (this.hotbarItems[slot]) {
                this.inventoryItems[this.hotbarItems[slot]].onUnequip();
            }
            this.hotbarItems[slot] = null;
            return;
        }
        let item = this.inventoryItems[itemName];
        if (item) {
            // if this item is already equipped in another slot, unequip it
            for (let i=0; i<this.hotbarItems.length; i++) {
                if (this.hotbarItems[i] === itemName) {
                    this.equipItem(null, i);
                }
            }
            this.hotbarItems[slot] = itemName;
            item.onEquip();
        } else {
            console.error("Trying to equip", itemName, "that does not exist");
        }
    }
    getItem(slot) {
        if(this.hotbarItems[slot] === undefined) {
            console.error("Trying to get item from invalid hotbar slot", slot);
            return null;
        }
        return this.inventoryItems[this.hotbarItems[slot]];
    }

    actionA() {
        if (this.isCarrying) {
            // throw carried item
            this.throw();
            return;
        }
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
        if (!this.isBusy && !this.isSwimming) {
            let equipped = this.inventoryItems[this.hotbarItems[0]];
            if (equipped) {
                equipped.actionPress();
            }
        } else if (!this.isBusy && this.isSwimming) {
            // play swim sound and nudge forward a little bit
            console.log("swimstroke", this.direction);
        }
    }
    releasedA() {
        let equipped = this.inventoryItems[this.hotbarItems[0]];
        if (equipped) {
            equipped.actionRelease();
        }
    }
    actionB() {
        if (this.isCarrying) {
            // throw carried item
            this.throw();
            return;
        }
        // use secondary item
        if (!this.isBusy && !this.isSwimming) {
            let equipped = this.inventoryItems[this.hotbarItems[1]];
            if (equipped) {
                equipped.actionPress();
            }
        } else if (!this.isBusy && this.isSwimming) {
            // play dive sound and put the player in diving state
            console.log("dive");
        }
    }
    releasedB() {
        let equipped = this.inventoryItems[this.hotbarItems[1]];
        if (equipped) {
            equipped.actionRelease();
        }
    }
    pickUp(entity) {
        // todo: do animation
        this.carriedEntity = entity;
    }
    throw() {
        if (!this.isCarrying) return false
        // todo: actually throw the entity
        // wrap entity in a "EntityThrown" entity, that will handle the throwing
        // inherits position and size from the carried entity, and draw simply passes through to the carried entity
        let thrown = new EntityThrown(this.game, this.carriedEntity);
        thrown.playerCollisions = false;
        thrown.x = this.x;
        thrown.y = this.y;
        this.space.addEntity(thrown);
        this.carriedEntity = null;
    }
    forceDrop() {
        // immediately stop carrying
        this.carriedEntity = null;
    }

    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];

        let sheet = this.game.spritesheets.player;
        let x = this.x;
        let y = this.y;
        let zo = 0; // y offset, for jumping/falling etc
        let wo = 8; // width offset
        let ho = 10; // height offset
        let sox = 0; // sprite offset x
        let soy = 0; // sprite offset y
        let nx = 0; // nudge x
        let ny = 0; // nudge y

        let opacityBefore = this.game.ctx.globalAlpha;
        if (this.opacity !== 1) {
            this.game.ctx.globalAlpha = this.opacity;
        }

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
        if ((!this.isBusy || this.game.cutscene) && (this.walking || this.isSwimming) && this.game.animationtick % 15 > 7) {
            if (!this.isJumping) {
                sox += 4;
            }
        }

        if (this.isGrabbing) {
            sox = this.direction;
            soy = 3;
            if(this.isPulling) {
                sox += 4;
                // nudge player backwards a bit
                if (this.direction == 0) {ny = 1;}
                else if (this.direction == 1) {nx = -2;}
                else if (this.direction == 2) {ny = -1;}
                else if (this.direction == 3) {nx = 2;}
            }
        }

        if (this.isJumping) {
            let ticks = this.game.logictick - this.jumpStart;
            // jump up and down, ease in and out
            let jumpHeight = 16;
            let p = ticks/(this.jumpTime/2);
            if (p>1) {p=2-p;}
            //let pe = 1-((1-p)*(1-p)*(1-p));
            let pe = 1-((1-p)*(1-p));
            let j = Math.ceil(jumpHeight * pe);
            j = Math.min(j, jumpHeight)+1;
            zo = -j;
            Graphics.drawShadow(this.game.ctx, x+ox, y+oy, 8, 8);
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
            sheet.drawSprite(this.game.ctx, sox, soy, x-wo+ox + reduction/2, y-ho+oy+zo, 1, 1, 16-reduction, 16);
        } else {
            sheet.drawSprite(this.game.ctx, sox, soy, x-wo+ox+nx, y-ho+oy+zo+ny);
        }
        this.game.ctx.filter = filterBefore;

        // if we are standing in a puddle, draw wet effect, actually, handler on ALL entities that are physical instead
        if (this.inPuddle) {
            //let sheet = this.game.spritesheets.overworld;
            //sheet.drawRegion(this.game.ctx, 48, 48, this.x-8+ox, this.y-8+oy, 16,16);
        }

        if (this.opacity !== 1) {
            this.game.ctx.globalAlpha = opacityBefore;
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