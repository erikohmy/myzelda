class Player {
    game;

    x; // position x
    y; // position y
    sx; // speed x
    sy; // speed y
    size; // size of player
    direction;
    walking = false;

    colliding = [0,0,0,0]; // top, right, bottom, left

    constructor(game, x, y) {
        this.game = game;

        this.x = x;
        this.y = y;
        this.sx = 0;
        this.sy = 0;
        this.size = 10; // 10x10 collision box
        this.direction = 2; // down
    }
    move(collisionBoxes) {
        // move player
        let hsize = this.size/2;

        this.colliding=[0,0,0,0];

        this.x += this.sx;
        let collidingX = false;
        let collidingXbox = null;
        for (let i = 0; i < collisionBoxes.length; i++) {
            let box = collisionBoxes[i];
            if (this.x + hsize > box.x && this.x - hsize < box.x + box.w &&
                this.y + hsize > box.y && this.y - hsize < box.y + box.h) {
                let top = this.y - hsize <= box.y+box.h && this.y - hsize > box.y;
                let bottom = this.y + hsize > box.y && this.y + hsize <= box.y+box.h;
                let right = this.x + hsize > box.x && this.x + hsize <= box.x + box.w;
                let left = this.x - hsize < box.x + box.w && this.x - hsize > box.x;
                // do nudging?
                if (top || bottom || left || right) {
                    collidingX=true;
                    collidingXbox = box;
                }
            }
        }
        if (collidingX) {
            this.x -= this.sx;
            if (this.sx > 0) {
                this.colliding[1] = true;
            } else if (this.sx < 0) {
                this.colliding[3] = true;
            }
        }

        this.y += this.sy;
        let collidingY = false;
        let collidingYbox = null;
        for (let i = 0; i < collisionBoxes.length; i++) {
            let box = collisionBoxes[i];
            if (this.x + hsize > box.x && this.x - hsize < box.x + box.w &&
                this.y + hsize > box.y && this.y - hsize < box.y + box.h) {
                let top = this.y - hsize <= box.y+box.h && this.y - hsize > box.y;
                let bottom = this.y + hsize > box.y && this.y + hsize <= box.y+box.h;
                let right = this.x + hsize > box.x && this.x + hsize <= box.x + box.w;
                let left = this.x - hsize < box.x + box.w && this.x - hsize >= box.x;
                // do nudging?
                if (top || bottom || left || right) {
                    collidingY=true;
                    collidingYbox = box;
                }
            }
        }
        if (collidingY) {
            this.y -= this.sy;
            if (this.sy > 0) {
                this.colliding[2] = true;
            } else if (this.sy < 0) {
                this.colliding[0] = true;
            }
        }
    }

    isColliding() {
        return this.colliding[0] || this.colliding[1] || this.colliding[2] || this.colliding[3];
    }

    draw() {
        let ox = this.game.offset[0];
        let oy = this.game.offset[1];

        let sheet = this.game.spritesheets.player;

        let sox = 0; // sprite offset x
        let soy = 0; // sprite offset y

        sox += this.direction;
        if (this.isColliding()) {
            soy += 1;
        }

        sheet.drawSprite(this.game.ctx, sox, soy, this.x-8+ox, this.y-11+oy);

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