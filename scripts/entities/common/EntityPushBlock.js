class EntityPushBlock extends EntityPhysical {
    isBeingPushed = false;
    pushTime = 60; // time to move to new position
    pushCooldown = 30; // time to wait before being pushed again
    pushedTime = 0;
    constructor(game, x, y) {
        super(game);
        this.x = x*16+8;
        this.y = y*16+8;
        this.size = 16;
        this.speed = 1;
        this.pushesEntities = true;
        this.squishesEntities = true;
        this.canBePushed = false;
        this.canBeBlocked = false;
    }
    get isBusy() {
        return this.isBeingPushed || this.pushedTime > 0;
    }
    interact() {
        if (this.isBusy) return;
        this.game.dialog.display("This block looks\npushable.")
    }
    push(direction) {
        if (this.isBusy) return;
        this.doPush(direction)
    }
    tick() {
        super.tick();
        if (this.pushedTime>0) {
            this.pushedTime--;
        }
    }
    doPush(direction) {
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
            this.pushedTime = this.pushCooldown;
            this.isBeingPushed = false;
        });
        this.game.sound.play("block_push");
    }
    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];
        //let sheet = this.game.spritesheets.dungeonCommon;
        let sheet = this.game.spritesheets.dungeonCommon;
        sheet.drawSprite(this.game.ctx, 1, 7, this.x-8+ox, this.y-8+oy);
    }
}