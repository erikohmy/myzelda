class ItemGrab extends ItemBase {
    levels = 2;

    constructor(game) {
        super(game);
        // get level, from save data
        this.level = 2; // todo: save data
        this.name = this.level == 1 ? "Power Bracelet" : "Titan's Mitt";
        this.description = "Power Bracelet\nA strength booster.";

        this.holding = false; // holding button

        this.grabbed = false; // if we have grabbed something
        this.pulling = false; // if we are pulling something
        this.lifting = false; // if we are lifting something up (not true WHILE we are carying something, thats handled by player)
        this.liftingFrame = 0; // frame of lifting animation
        this.pullStart = null; // gametick we started pulling

        this.grabbedInfo = null; // the collision box we have grabbed currently
    }

    get pullTicks() {
        return this.game.gametick - this.pullStart;
    }

    actionPress() {
        if(this.holding) return;
        this.holding = true;
    }
    actionRelease() {
        if(this.lifting) return; // cannot abort lifting on our own
        if(!this.holding) return;
        this.holding = false;
        if (this.grabbed) {
            this.grabbed = false;
            this.pulling = false;
            this.lifting = false;
            this.game.player.isGrabbing = false;
            this.game.player.isPulling = false;
            this.grabRelease();
            this.grabbedInfo = null;
        }
    }
    grabStart() {
        if(this.lifting) return; // if we are playing lifting animation, we cant change what we are grabbing 
        // player started grabbing something
        //console.log("grab start");
        // if we are grabbing an entity, call its grab method
        if (this.grabbedInfo && this.grabbedInfo.entity) {
            let e = this.grabbedInfo.entity;
            if (e.grab) {
                e.grab(this.game.player.oppositeDirection);
            }
        }
    }
    grabRelease() {
        if(this.lifting) return; // cannot release while playing lifting animation
        // player released something
        //console.log("grab release");
        // if we are grabbing an entity, call its release method
        if (this.grabbedInfo && this.grabbedInfo.entity) {
            let e = this.grabbedInfo.entity;
            if (e.release) {
                e.release(this.game.player.oppositeDirection);
            }
        }
    }
    whilePulling() {
        //console.log("pulling", this.grabbedInfo);
        if (this.grabbedInfo && this.grabbedInfo.entity) {
            let e = this.grabbedInfo.entity;
            
            if (e.pull) {
                // entity can be pulled!
                let res = e.pull(this.game.player.oppositeDirection)
                if (res===null||res===undefined) {
                    // ignore pull method, and try lifting instead
                } else if (res==="release") {
                    // pull ordered us to release
                    this.actionRelease();
                    return;
                } else {
                    return;
                }
            }

            if (e.lift) {
                // entity can be lifted!
                let res = e.lift(this.game.player.oppositeDirection)
                if (res===null||res===undefined) {
                    // ignore lift method
                } else if (res==="heavy") {
                    // check what level the grab is
                    console.log("heavy", this.level);
                    return;
                } else if (res===true) {
                    // pick up the thing!
                    // wait our lift time, then pick up
                    if (this.pullTicks >= 20) {
                        this.lift(e)
                    }
                    return;
                }
            }
        }
    }
    lift(entity) {
        if (this.lifting) return;
        let player = this.game.player;
        this.game.sound.play('link_pickup');
        this.lifting = true;
        player.carriedEntity = entity;
        this.liftingFrame = 0;
        this.game.everyTick(0, (t) => {
            this.liftingFrame = t;
            if (!this.lifting) {
                console.log("aborting lift");
                return false;
            }
            if (t>=20) {
                this.lifting = false;
                this.actionRelease();
                return false;
            }
        })
    }
    abort() {// abort grabbing, pulling, trying to lift, etc
        
        // if we are trying to lift, abort animation and release
        if (this.lifting) {
            this.lifting = false;
        }

        // if we are just grabbing or pulling, just release
        this.actionRelease();
    }
    whileEquipped() {
        if (this.grabbed && !this.lifting) {
            // sanity check, if we are still in from of the same thing, in case we are pushed
            let infront = this.checkInFront();
            if (infront) {
                let thing = typeof infront === "object" ? infront : null;
                if (typeof thing !== typeof this.grabbedInfo) {
                    // we are no longer in front of the same thing, release
                    console.log("not in front of the same type of thing, release", thing, this.grabbedInfo);
                    this.actionRelease();
                } else if (!this.compareInfo(thing, this.grabbedInfo)) {
                    // we are no longer in front of the same thing, release
                    console.log("not in front of the same thing, release", thing, this.grabbedInfo);
                    this.actionRelease();
                }
            } else {
                // no longer in front of anything, release
                console.log("not in front of anything, release");
                this.actionRelease();
            }
        }
        if (!this.holding) return;
        let player = this.game.player;
        if(player.isSwimming || player.isCarrying) {
            if (this.grabbed) {
                this.actionRelease();
            }
            return false;
        }
        if (this.grabbed) {
            // we have grabbed something, player cannot move, and shows special sprite
            if(player.isGrabbing != true) {
                player.isGrabbing = true;
            }
            // check direction, and if we are holding the opposite direction, pull
            let direction = player.direction;
            if (
                direction == 0 && this.game.interface.inputs.includes('down') ||
                direction == 1 && this.game.interface.inputs.includes('left') ||
                direction == 2 && this.game.interface.inputs.includes('up') ||
                direction == 3 && this.game.interface.inputs.includes('right')    
            ) {
                this.pulling = true;
                if (player.isPulling != true) {
                    player.isPulling = true;
                    this.pullStart = this.game.gametick;
                }
                this.whilePulling();
            } else {
                this.pulling = false;
                this.pullStart = null;
                if (player.isPulling != false) {
                    player.isPulling = false;
                }
            }
        } else {
            let infront = this.checkInFront();
            if (infront) {
                this.grabbed = true;
                this.grabbedInfo = typeof infront === "object" ? infront : null;
                this.grabStart();
            }
        }
    }
    checkInFront() {
        let player = this.game.player;
        let xd = 0;
        let yd = 0;
        if(player.direction == 0) yd = -1;
        if(player.direction == 2) yd = 1;
        if(player.direction == 3) xd = -1;
        if(player.direction == 1) xd = 1;
        if(player.move(xd, yd, true) === false) {
            if (player._lastCollidedWith) {
                let grabbedInfo = player._lastCollidedWith;
                
                if(grabbedInfo && grabbedInfo.entity) {
                    if(grabbedInfo.entity.disallowGrab) {
                        return false;
                    }
                    if (grabbedInfo.entity.grabDirections) {
                        if (!grabbedInfo.entity.grabDirections.includes(player.direction)) {
                            return false;
                        }
                    }
                }
                if(grabbedInfo && grabbedInfo.entity && grabbedInfo.entity.disallowGrab) {
                    return false;
                } else if (grabbedInfo) {
                    return grabbedInfo;
                }
            }
            return true;
        }
        return false;
    }
    compareInfo(a,b) {
        if(a.entity && b.entity) {
            if (a.entity === b.entity) {
                return true;
            }
        }
        if (a.x == b.x && a.y == b.y && a.entity == b.entity && a.tile == b.tile) {
            return true
        }
        return false;
    }
    renderIcon(ctx, x, y) { // icon for the inventory, and hotbar
        let sheet = this.game.spritesheets.items;
        if (this.level == 1) {
            sheet.drawSprite(ctx, 4, 2, x, y, 1, 2); // bracelet
            sheet.drawSprite(ctx, 9, 2, x+8, y+8, 1, 1); // l-
            sheet.drawSprite(ctx, 9, 3, x+16, y+8, 1, 1); // 1
        } else {
            sheet.drawSprite(ctx, 5, 2, x, y, 1, 2); // glove
            sheet.drawSprite(ctx, 9, 2, x+8, y+8, 1, 1); // l-
            sheet.drawSprite(ctx, 9, 4, x+16, y+8, 1, 1); // 1
        }
        
    }
    animation() { // override player animation!
        if (this.grabbed) {
            let ox = this.game.offset[0];
            let oy = this.game.offset[1];

            let sheet = this.game.spritesheets.player;
            let player = this.game.player;
            let x = player.x;
            let y = player.y;
            let zo = 0; // y offset, for jumping/falling etc
            let wo = 8; // width offset
            let ho = 10; // height offset
            let sox = 0; // sprite offset x
            let soy = 0; // sprite offset y
            let nx = 0; // nudge x
            let ny = 0; // nudge y

            sox = player.direction;
            soy = 3;

            if (player.isPulling || this.lifting) {
                sox += 4;
                // nudge player backwards a bit
                if (player.direction == 0) {ny = 1;}
                else if (player.direction == 1) {nx = -2;}
                else if (player.direction == 2) {ny = -1;}
                else if (player.direction == 3) {nx = 2;}
            }

            if (this.lifting) { // do lifting animation
                // update carried entity position
                let lox = 0; // lift offset x
                let loy = 0; // lift offset y

                if (player.direction===3) { // left
                    lox = -13;
                    if (this.liftingFrame < 10) {
                        loy -= 4;
                        lox += 4; 
                    } else {
                        loy -= 12;
                        lox += 8; 
                    }
                }
                else if (player.direction===1) { // right
                    lox = 13;
                    if (this.liftingFrame < 10) {
                        loy -= 4;
                        lox -= 4; 
                    } else {
                        loy -= 12;
                        lox -= 8; 
                    }
                } else if (player.direction===2) { // down
                    if (this.liftingFrame < 10) {
                        loy += 4;
                    } else {
                        loy -= 4;
                    }
                } else if (player.direction===0) { // up
                    loy = -13;
                    if (this.liftingFrame < 10) {
                        loy += 2;
                    } else {
                        loy += 4;
                    }
                }
                
                //loy -= (this.liftingFrame/2)
                // frame 1: p.y-8 + 4px up, 4px left if right or right if left
                // frame 2: 12px up, 8px left if right or right if left

                player.carriedEntity.x =  player.x+lox;
                player.carriedEntity.y =  player.y+loy;
            }

            sheet.drawSprite(this.game.ctx, sox, soy, x-wo+ox+nx, y-ho+oy+zo+ny);
            if (this.lifting) {
                player.carriedEntity.draw();
            }
            return true; // override animation
        }
        return undefined; // dont override animation
    }
}