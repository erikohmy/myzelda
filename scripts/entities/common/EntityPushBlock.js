class EntityPushBlock extends EntityPhysical {
    /*
        TODO: whitelist/blacklist of tiles, like stairs, road etc
        Better collision detection, as now we can slide over the edge of other entities, and ignores signs...
    */
    isBeingPushed = false;
    pushTime = 60; // time to move to new position
    pushCooldown = 30; // time to wait before being pushed again
    pushedTimeout = 0;

    constructor(game, x, y) {
        super(game);
        this.canBeCarried = true;
        this.x = x*16+8;
        this.y = y*16+8;
        this.size = 16;
        this.speed = 1;
        this.pushesEntities = true;
        this.squishesEntities = true;
        this.canBePushed = false;
        this.canBeBlocked = false;

        this.interactionTicks = 0;
        this.lastIntercationTicks = 0;
        this.interactionType = null;
        this.interactionDirection = null;


        // settings
        this.allowPull = false;
        this.allowPush = true;
        this.timeToPush = 30;
        this.timeToPull = 30;
        this.gradualReset = false;
    }
    
    get isBusy() {
        return this.isBeingPushed || this.pushedTimeout > 0;
    }

    push(direction) {
        if (!this.allowPush) return null;
        if (!this.allowPush || this.isBusy) return;
        if(this.interactionDirection !== null && this.interactionDirection !== direction) return;
        this.interactionType = "push";
        this.interactionTicks++;
        this.interactionDirection = direction;
        if (this.interactionTicks < this.timeToPush) return;
        this.doPush(direction)
        return true; // we did push, or tried to
    }
    pull(direction) {
        if (!this.allowPull) return null;
        if (this.isBusy) return;
        if(this.interactionDirection !== null && this.interactionDirection !== direction) return;
        this.interactionType = "pull";
        this.interactionTicks++;
        this.interactionDirection = direction;
        if (this.interactionTicks < this.timeToPull) return;
        this.doPush(direction)
        return true; // we did pull, or tried to
    }
    lift() {
        return null;
        this.game.player.pickUp(this);
        return true; // we did lift, or tried to
    }
    resetInteraction() {
        this.interactionTicks = 0;
        this.interactionType = null;
        this.interactionDirection = null;
    }
    tick() {
        super.tick();
        if (this.interactionTicks > 0 && this.lastIntercationTicks === this.interactionTicks) { // if we havent interacted in a tick, reset
            if(this.gradualReset) {
                this.lastIntercationTicks--;
                this.interactionTicks--;
                if (this.interactionTicks <= 0) {
                    this.resetInteraction();
                }
            } else {
                this.resetInteraction();
            }
        } 
        this.lastIntercationTicks = this.interactionTicks;
        if (this.pushedTimeout>0) {
            this.pushedTimeout--;
        }
    }
    doPush(direction) {
        // make sure interaction can never exceed the time to push/pull
        this.lastIntercationTicks--;
        this.interactionTicks--;

        // first check IF the tile next is free, if not, return false
        let tx, ty;
        [tx, ty] = this.tilePosition;
        if (direction === 0) ty--;
        else if (direction === 1) tx++;
        else if (direction === 2) ty++;
        else if (direction === 3) tx--;

        // get the tile at the new position
        let tile = this.game.tile(this.space.tile(tx,ty));
        if (tile && tile.hasCollision() || !tile) {
            return false;
        }

        // next, check if we have any entities in the way, that cannot be pushed
        let bx, by;
        bx = this.x-8;
        by = this.y-8;

        if (direction == 0) {by-=16;}
        else if (direction == 1) {bx+=16;}
        else if (direction == 2) {by+=16;}
        else if (direction == 3) {bx-=16;}

        let intheway = this.space.entitiesWithinRect(bx,by,16,16).some((e) => {
            if (!e.physical) return false;
            if (e.canBePushed === false) {
                return true;
            }
            return !e.squish;
        });
        if (intheway) {
            return false;
        }

        // finally, we can push!
        this.isBeingPushed = true;
        this.moveToTile(tx,ty, undefined, () => {
            this.pushedTimeout = this.pushCooldown;
            this.isBeingPushed = false;
            this.movedToTile(tx,ty);
        });
        this.game.sound.play("block_push");
        this.resetInteraction();
    }
    movedToTile(tx,ty) {
        let beneath = this.tileBeneath();
        let tile = this.game.tile(beneath)
        if (tile) {
            if(tile.hole || tile.swim) {
                this.onLanded();
            }
        }
    }
    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];
        //let sheet = this.game.spritesheets.dungeonCommon;
        let sheet = this.game.spritesheets.dungeonCommon;
        sheet.drawSprite(this.game.ctx, 1, 7, this.x-8+ox, this.y-8+oy);
    }
}