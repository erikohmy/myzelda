class EntityPullHandle extends EntityPhysical {
    static make(game, options) {
        return new EntityPullHandle(game, options.x, options.y);
    }
    constructor(game, x, y) {
        super(game);
        
        // settings
        this.lineLength = 24;
        this.drawSpeed = 0.10;
        this.returnSpeed = 0.05;
        this.direction = 0; // currently only works for pulling downwards (handle on upper wall)

        this.handleSetup(x, y);
    }

    // Events
    onGrabbed() {} // fires when the player grabs the handle
    onReleased() {} // fires when the player releases the handle
    onLengthChanged(lengthPercent) {} // fires when the amount of line length pulled changes
    onStartedPulling() {} // fires when the player starts pulling the handle from a drawn length of 0
    onFullyPulled() {} // fires when the player fully pulls the handle (drawn length is lineLength)
    onFullyBack() {} // fires when the handle is fully back (drawn length is 0)


    //////////////////////////
    // Handle code itself
    //////////////////////////

    handleSetup(x, y) {
        this.canBeCarried = false;
        this.x = x*16+8;
        this.y = y*16+8;
        this.size = 16;
        this.speed = 1;
        this.pushesEntities = false;
        this.squishesEntities = false;
        this.canBePushed = false;
        this.canBeBlocked = false;

        this.baseX = this.x;
        this.baseY = this.y;
        this.isGrabbed = false;
        this.previousDrawnlength=0;
        this.grabDirections = [this.direction];
        this.soundCooldown = 0;
    }

    grab() { // fires when the player grabs the handle
        this.isGrabbed = true;
        this.onGrabbed();
    }

    release() { // fires when the player releases the handle
        this.isGrabbed = false;
        this.onReleased();
    }

    get drawnlength() {
        let drawnlength = 0;
        if (this.direction == 0) drawnlength = this.y-this.baseY;
        else if(this.direction == 2) drawnlength = this.baseY-this.y;
        else if(this.direction == 3) drawnlength = this.x-this.baseX;
        else if(this.direction == 1) drawnlength = this.baseX-this.x;
        if (drawnlength < 0) {
            // rounding errors in move function?
            // reset position to base
            this.x = this.baseX;
            this.y = this.baseY;
            return 0;
        } else if (drawnlength > this.lineLength) {
            return this.lineLength;
        }
        return drawnlength;
    }

    pull(direction) {
        if((direction+2)%4 !== this.direction) return "release"; // can only pull from the opposite direction
        let drawnlength = this.drawnlength;
        if(drawnlength >= this.lineLength) {
            // fully pulled
            //console.log("fully pulled");
        } else {
            if (drawnlength === 0) {
                this.onStartedPulling();
            }
            // smooth pull of the handle
            let xd = 0;
            let yd = 0;
            if (direction == 0) yd = -1;
            else if(direction == 2) yd = 1;
            else if(direction == 3) xd = -1;
            else if(direction == 1) xd = 1;
            let ms = this.drawSpeed;
            let could = this.game.player.move(xd*ms,yd*ms);
            if(could) {
                this.move(xd*ms,yd*ms);
            }
        }

        return true; // we did pull, or tried to
    }

    tick() {
        super.tick();
        if (this.soundCooldown > 0) this.soundCooldown--;
        if (!this.isGrabbed) {
            // if not grabbed, start reeling back in
            let drawnlength = this.drawnlength;
            if (drawnlength > 0) {
                let xd = 0;
                let yd = 0;
                if (this.direction == 0) yd = -1;
                else if(this.direction == 2) yd = 1;
                else if(this.direction == 3) xd = -1;
                else if(this.direction == 1) xd = 1;
                let ms = this.returnSpeed;
                this.move(xd*ms,yd*ms);
            } 
        }
        if (this.drawnlength !== this.previousDrawnlength) {
            this.onLengthChanged(this.drawnlength/this.lineLength);
            if (this.drawnlength === this.lineLength) {
                this.game.sound.play("chest");
                this.onFullyPulled();
            } else if (this.drawnlength === 0) {
                this.game.sound.play("chest");
                this.onFullyBack();
            } else {
                // play moving sound, with a cooldown
                if (this.soundCooldown === 0) {
                    if (this.isGrabbed) { // being pulled
                        this.game.sound.play("block_push");
                        this.soundCooldown = 45;
                    } else { // being reeled in
                        //this.game.sound.play("text_letter");
                        //this.soundCooldown = 8;
                    }
                }
            }
        }
        this.previousDrawnlength = this.drawnlength;
    }
    
    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];

        // temporary, get actual sprites

        // base
        this.game.ctx.fillStyle = "#666";
        this.game.ctx.fillRect(this.baseX-3+ox, this.baseY+oy, 6, 6);

        this.game.ctx.fillStyle = "#444";
        this.game.ctx.fillRect(this.baseX-2+ox, this.baseY+1+oy, 4, 4);

        // line
        let drawnlength = Math.round(this.drawnlength);
        let lineLength = drawnlength + 3;
        
        this.game.ctx.fillStyle = "#333";
        this.game.ctx.fillRect(this.baseX-1+ox, this.baseY+oy-1+3, 1, lineLength);
        this.game.ctx.fillStyle = "#222";
        this.game.ctx.fillRect(this.baseX+ox, this.baseY+oy-1+3, 1, lineLength);
        

        // handle
        let handleY = Math.round(this.y)
        this.game.ctx.fillStyle = "#000";
        this.game.ctx.fillRect(this.x-4+ox, handleY-2+oy+4+3, 8, 3);
        this.game.ctx.fillRect(this.x-7+ox, handleY-2+oy+5+3, 14, 2);
    
        /*
        let sheet = this.game.spritesheets.dungeonCommon;
        sheet.drawSprite(this.game.ctx, 1, 7, this.baseX-8+ox, this.baseY-8+oy, 1, 0.5);
        sheet.drawSprite(this.game.ctx, 1, 7.5, this.x-8+ox, this.y-8+oy+8, 1, 0.5);
        */
    }
}