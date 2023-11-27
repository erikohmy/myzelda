class EntityPlayer extends EntityPhysical {
    opacity = 1;

    direction;
    walking = false;

    feetOffset = 4;
    previousTile = null; // the tile we last entered

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
    onHole = false;
    skirtingHoles = false;
    willFall = false; // indicates the player WILL fall
    onRoughGround = false;
    isSwimming = false;
    isJumping = false;
    isGrabbing = false;
    isPulling = false;
    tiredTime = 0;

    willTransition = false; // entered a tile that goes somewhere

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
        if (this.willTransition || this.game.dialog.show || this.game.cutscene || this.game.world.transitioning) {
            return true;
        }
        // if animating a move, or dying etc.
        return this.squishing || this.falling || this.drowning || this.isTired;
    }

    get inAir() {
        return this.isJumping;
    }

    get isPushing() {
        return this.pushingEntity !== null;
    }

    get isCarrying() {
        return this.carriedEntity !== null;
    }

    get isTired() {
        return this.tiredTime > 0;
    }

    get moveSpeed() {
        if (this.isSwimming||this.onRoughGround) {
            return 0.5;
        }
        if (this.onHole) {
            if (this.willFall) {
                return 0.025;// barely move!
            }
            if (this.skirtingHoles) {
                return 0.1;
            }
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

    tileBeneath(set=null) { // override the method from entityBase, to use feet offset
        let tile = this.space.tileAt(this.x, this.y+this.feetOffset);
        if (set) {
            if (typeof set === "string"){
                this.space.setTileAt(this.x, this.y+this.feetOffset, {name: set})
            } else {
                this.space.setTileAt(this.x, this.y+this.feetOffset, set)
            } 
        }
        return tile;
    }

    inFrontoff() { // get entity or tile in front of player (only if whatever it is is blocking player)
        let player = this;
        let xd = 0;
        let yd = 0;
        if(player.direction == 0) yd = -1;
        if(player.direction == 2) yd = 1;
        if(player.direction == 3) xd = -1;
        if(player.direction == 1) xd = 1;
        if(player.move(xd, yd, true) === false) {
            let thing = player._lastCollidedWith;
            // TODO: try to check from the front and out, to make sure we get the MOST CENTRAL thing, not just the first
            if (thing) { // collision box with entity or tile
                if (thing.entity) {
                    return thing.entity;
                } else if (thing.tile) {
                    // clone the tileinfo, so we can modify it
                    let tileinfo = {...thing.tile};
                    tileinfo.x = thing.x / this.game.tilesize;
                    tileinfo.y = thing.y / this.game.tilesize;
                    return tileinfo;
                }
            }
        }
        return false; // not in front of anything
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
    
    tire(ticks) {
        if (this.tiredTime < ticks) {
            this.tiredTime = ticks;
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

    jump() { // TODO: lock player movement while jumping, at least for a few ticks like in the real game
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
        if (this.isCarrying) {
            // if we are carrying something, move it with us
            this.carriedEntity.x = this.x;
            if (this.walking && this.direction%2 && this.game.animationtick % 15 > 7) { // walking left or right
                this.carriedEntity.y = this.y-15;
            } else {
                this.carriedEntity.y = this.y-16;
            }
        }

        // if game is "paused", dont proceed!
        if (!(this.game.doGameLogic && !this.game.dialog.show && !this.game.cutscene && !this.game.world.transitioning)) {
            return;
        }
        super.tick();
        for (let i=0; i<this.hotbarItems.length; i++) {
            let item = this.inventoryItems[this.hotbarItems[i]];
            if (item) {
                item.whileEquipped();
            }
        }

        if (this.damageFlash > 0) {
            this.damageFlash--;
        }
        if (this.tiredTime > 0) {
            this.tiredTime--;
        }

        if (this.pushingEntity) {
            if (this.pushingEntity.push){
                this.pushingEntity.push(this.direction);
            }
        }

        // check tiles beneath us THIS CONTAINS RETURN STATEMENTS, DONT PUT ANYTHING AFTER IT
        let beneath = this.tileBeneath();// TODO: override this with feet offset
        let tile = this.game.tile(beneath)

        let feetoffset = this.feetOffset;
        let x = this.x;
        let y = this.y+feetoffset;
        let tileX = Math.floor(x/16);
        let tileY = Math.floor(y/16);

        if (beneath && beneath.goesTo) { // are we standing DIRECTLY on a tile that goes somewhere?
            if (this.previousTile !== null && !this.isBusy) {
                this.previousTile = {x:tileX, y:tileY, tile:beneath};
                this.setPushingEntity(null);
                this.willTransition = true;
                this.game.waitTicks(1).then(() => { // wait a single tick to make sure we arent rendered pushing the door
                    this.willTransition = false;
                    this.game.world.goToString(beneath.goesTo);
                });
            }
        } else if (!this.inAir) { // dont care about ground if we are in the are
            // are we standing on a new tile?
            if (this.previousTile===null || (this.previousTile.x !== tileX || this.previousTile.y !== tileY)) {
                this.previousTile = {x:tileX, y:tileY, tile:beneath};
                this.game.world.currentSpace.events.trigger("steppedOn", this.game.world.currentSpace, tileX, tileY, beneath)
            }
            // are we really close other tiles?
            let tx = tileX * 16;
            let ty = tileY * 16;
            tx += 8;
            ty += 8;
            let ox = this.x - tx;
            let oy = this.y - ty;
            let dx = Math.abs(ox);
            let dy = Math.abs(oy);
            let adjacentX = dx > 6; // are we practically standing on both this and the next tile? (horizontally)
            let adjacentY = dy > 2; // are we practically standing on both this and the next tile? (vertically)

            let closeToUp = adjacentY && oy <= -7;
            let closeToDown = adjacentY && oy >= 5;
            let closeToLeft = adjacentX && ox < 0;
            let closeToRight = adjacentX && !closeToLeft;

            let points = [
                [tx, ty], // center
                [tx, ty-16], // up
                [tx+16, ty], // right
                [tx, ty+16], // down
                [tx-16, ty], // left
                [tx+16, ty-16], // top right
                [tx+16, ty+16], // bottom right
                [tx-16, ty+16], // bottom left
                [tx-16, ty-16], // top left
            ];

            // all 9 tiles we are "touching", center, up down right left, top right, bottom right, bottom left, top left
            let tiles = (new Array(5)).fill(null)
            tiles[0] = tile;
            tiles[1] = this.game.tile(this.space.tileAt(points[1][0], points[1][1]));
            tiles[2] = this.game.tile(this.space.tileAt(points[2][0], points[2][1]));
            tiles[3] = this.game.tile(this.space.tileAt(points[3][0], points[3][1]));
            tiles[4] = this.game.tile(this.space.tileAt(points[4][0], points[4][1]));
            tiles[5] = this.game.tile(this.space.tileAt(points[5][0], points[5][1]));
            tiles[6] = this.game.tile(this.space.tileAt(points[6][0], points[6][1]));
            tiles[7] = this.game.tile(this.space.tileAt(points[7][0], points[7][1]));
            tiles[8] = this.game.tile(this.space.tileAt(points[8][0], points[8][1]));

            let holes = [];
            tiles.forEach((tile, i) => {
                if (tile && tile.hole) {
                    let dx = Math.abs(x - points[i][0]);
                    let dy = Math.abs(y - points[i][1]);
                    holes.push({position: points[i], direction: i, distance: Math.sqrt(dx*dx + dy*dy)});
                }
            });
            holes.sort((a,b) => a.distance - b.distance);

            // if we are only close to 1 hole, use normal nudging and falling logic
            let holeAvgDistance = null;
            if (holes.length > 1) {
                // check diagonally? dont think its needed
                holeAvgDistance = (holes[0].distance + holes[1].distance) / 2;
            }

            if (tile) { // if we are standing on a tile
                // puddle
                if (tile.wet) {
                    this.inPuddle = true;
                    if ((this.game.walkticks+1)%20 === 0) {
                        this.game.sound.play("link_wade", 0.04);
                    }
                } else {
                    this.inPuddle = false;
                }

                // stairs
                if (tile.rough) {
                    this.onRoughGround = true;
                } else {
                    this.onRoughGround = false;
                }

                // water
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

                // Hole HAS to be last, we have a continue in it, gotta change that if we want to check stuff after holes
                if (tile.hole) { // all holes we are really close to
                    this.onHole = true;
                    // check how close to the center we are
                    let hx,hy;
                    [hx,hy] = tileSnap(points[0][0], points[0][1]);
                    hx += 8;
                    hy += 8;
                    let dx = Math.abs(x - hx);
                    let dy = Math.abs(y - hy);
                    let lowest = Math.min(dx, dy);

                    let skirtingHoles = false;
                    if(holeAvgDistance!==null && holeAvgDistance < 8.3 && lowest <= 2 ) {
                        // player is trying to walk between two holes, nudge towards closest hole!
                        skirtingHoles = true;
                        this.skirtingHoles = true;
                    } else {
                        this.skirtingHoles = false;
                    }
        
                    if (!this.willFall && dx < 5 && dy < 5) { // fall immediately if we are this close to the center,
                        this.willFall = true; // cripple player movement, and allow player to be nudged to center
                    } else {
                        if (this.willFall && dx < 2.5 && dy < 2.5) {
                            // basically in center, fall
                            this.fall();
                        }
                        // nudge towards center
                        let xnudge = 0;
                        let ynudge = 0;
                        if (x < tx) {
                            xnudge = 1;
                        } else if (x > tx) {
                            xnudge = -1;
                        }
                        if (y < ty) {
                            ynudge = 1;
                        } else if (y > ty) {
                            ynudge = -1;
                        }
                        let nudgestrength = skirtingHoles ? 0.25 : 0.1;
                        this.move(xnudge*nudgestrength, ynudge*nudgestrength);
                    }
                } else {
                    this.onHole = false;
                    this.skirtingHoles = false;
                    this.willFall = false; // if player somehow gets out? good for you!
                }
            }
        } else {
            // in air, care about something?
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
            } else if(tile.hole) {
                // be a bit evil, and try to prevent the player from jumping two tiles
                this.onHole = true;
                this.skirtingHoles = true;
                this.willFall = true;
            }
        }
        if (this.inventoryItems.rocs_feather && this.inventoryItems.rocs_feather.jumped) {
            this.inventoryItems.rocs_feather.landed();
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
    throw() {
        if (!this.isCarrying) return false
        // todo: actually throw the entity
        // wrap entity in a "EntityThrown" entity, that will handle the throwing
        // inherits position and size from the carried entity, and draw simply passes through to the carried entity
        let thrown = new EntityThrown(this.game, this.carriedEntity);
        thrown.playerCollisions = false;
        thrown.x = this.x;
        thrown.y = this.y+this.feetOffset;
        thrown.z = 16 + this.feetOffset;
        this.space.addEntity(thrown);
        this.carriedEntity = null;
    }
    forceDrop() {
        // immediately stop carrying
        this.carriedEntity = null;
    }

    draw() {
        // check if any of the currently equipped items overrides our animation
        for (let i=0; i<this.hotbarItems.length; i++) {
            let itemName = this.hotbarItems[i];
            if (itemName) {
                let item = this.inventoryItems[itemName];
                if (item && item.animation) {
                    let override = item.animation();
                    if (override === true) {
                        return;
                    }
                } else {
                    console.error("item is missing animation method", item);
                }
            } else {
                console.log("no item in slot", i)
            }
        }

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
        if (this.isSwimming) {
            soy += 2;
            ho = 8;
        } else if (this.isCarrying) {
            soy += 4;
        } else if (this.tiredTime > 8) {
            soy = 0
            sox = 11;
        } else if (this.isPushing) {
            soy += 1;
        }

        // animate walking or swimming
        if ((!this.isBusy || this.game.cutscene) && (this.walking || this.isSwimming) && this.game.animationtick % 15 > 7) {
            if (!this.isJumping) {
                sox += 4;
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
            Graphics.drawShadow(this.game.ctx, x+ox, y+oy+this.feetOffset/2, 8, 8);
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

        if (this.isCarrying) {
            this.carriedEntity.draw();
        }

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
            [tx, ty] = tileSnap(this.x, this.y+this.feetOffset);
            this.game.setColor("#FF0000"); // red
            this.game.ctx.strokeRect(tx+ox, ty+oy, 16, 16);
            this.game.setColor("#000"); // black
            this.game.ctx.fillRect(this.x+ox-1, this.y+this.feetOffset+oy-1, 2, 2);
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