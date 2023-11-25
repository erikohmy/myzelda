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
        this.pulling = false;
        this.grabbedInfo = null; // the entity we have grabbed
    }

    actionPress() {
        if(this.holding) return;
        this.holding = true;
    }
    actionRelease() {
        if(!this.holding) return;
        this.holding = false;
        if (this.grabbed) {
            this.grabbed = false;
            this.pulling = false;
            this.game.player.isGrabbing = false;
            this.game.player.isPulling = false;
            this.grabRelease();
            this.grabbedInfo = null;
        }
    }
    grabStart() {
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
                if (res===null) {
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
            }
        }
    }
    whileEquipped() {
        if (this.grabbed) {
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
                if(player.isPulling != true) {
                    player.isPulling = true;
                }
                this.whilePulling();
            } else {
                this.pulling = false;
                if(player.isPulling != false) {
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
}