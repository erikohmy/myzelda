class EntityPhysical {
    game;
    x = 0;
    y = 0;
    speedX = 0;
    speedY = 0;
    speed = 0.5;
    targetX = null;
    targetY = null;
    targetSpeed=1;
    size = 8;
    playerCollisions = true;
    pushesEntities = false;

    colliding = [0,0,0,0]; // top, right, bottom, left

    constructor(game) {
        this.game = game;
    }

    getCollisionBox() {
        return {
            entity: this,
            x: this.x-(this.size/2),
            y: this.y-(this.size/2),
            w: this.size,
            h: this.size,
        };
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    tick() {
        if (this.x == this.targetX && this.y == this.targetY) {
            this.targetX = null;
            this.targetY = null;
            this.speedX = 0;
            this.speedY = 0;
        } else if (this.targetX !== null && this.targetY !== null) {
            let dx = this.targetX - this.x;
            let dy = this.targetY - this.y;
            let sx = 0;
            if (Math.abs(dx) > 0) {
                sx = Math.sign(dx) * this.targetSpeed;
            }
            let sy = 0;
            if (Math.abs(dy) > 0) {
                sy = Math.sign(dy) * this.targetSpeed;
            }
            this.speedX = sx;
            this.speedY = sy;
        }

        let tickinterval = 1;

        if (this.speed == 0.10) {tickinterval = 10;}
        else if (this.speed == 0.20) {tickinterval = 6;}
        else if (this.speed == 0.25) {tickinterval = 4;}
        else if (this.speed == 0.5) {tickinterval = 2;}
        else if (this.speed == 1) {tickinterval = 1;}

        if (tickinterval === 1 || this.game.gametick % tickinterval == 0) {
            let tomovex = Math.abs(this.speedX);
            let tomovey = Math.abs(this.speedY);
            while (tomovex+tomovey > 0) {
                if(tomovex) {
                    let sx = Math.sign(this.speedX);
                    this.move(sx, 0);
                    tomovex--;
                }
                if(tomovey) {
                    let sy = Math.sign(this.speedY);
                    this.move(0, sy);
                    tomovey--;
                }
            }
        }

        if (this.game.gametick % 4 == 0) {
            // halve speeds, round down
            if (Math.abs(this.speedX) > 0) {
                let sign = Math.sign(this.speedX);
                let val = Math.abs(this.speedX);
                this.speedX = Math.floor(val/2) * sign;
            }
            if (Math.abs(this.speedY) > 0) {
                let sign = Math.sign(this.speedY);
                let val = Math.abs(this.speedY);
                this.speedY = Math.floor(val/2) * sign;
            }
        }
    }

    push(sx, sy) {
        this.speedX += sx;
        this.speedY += sy;
    }

    moveTo(x, y, speed=1) {
        this.targetX = x;
        this.targetY = y;
        this.targetSpeed = speed;
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
    }

    move(sx, sy, squish = false) {
        let collisionBoxes = this.game.world.currentSpace.getCollisionBoxes("solid", (box) => {
            return box.entity !== this;
        });
        if (this.playerCollisions) {
            if (this instanceof EntityPlayer) {
                // ???
            } else {
                collisionBoxes.push(this.game.world.player.getCollisionBox());
            }
        }
        let hsize = this.size/2;

        this.colliding=[0,0,0,0];
        if (Math.abs(sx) <= 0 && Math.abs(sy) <= 0) {
            return;
        }

        this.x += sx;
        let collidingX = false;
        let collidingWithX = null;
        for (let i = 0; i < collisionBoxes.length; i++) {
            let box = collisionBoxes[i];
            if (this.x + hsize > box.x && this.x - hsize < box.x + box.w &&
                this.y + hsize > box.y && this.y - hsize < box.y + box.h) {
                let top = this.y - hsize <= box.y+box.h && this.y - hsize > box.y;
                let bottom = this.y + hsize > box.y && this.y + hsize <= box.y+box.h;
                let right = this.x + hsize > box.x && this.x + hsize <= box.x + box.w;
                let left = this.x - hsize < box.x + box.w && this.x - hsize > box.x;
                if (top || bottom || left || right) {
                    collidingX=true;
                    collidingWithX = box;
                }
            }
        }
        if (collidingX) {
            if (this.pushesEntities && collidingWithX.entity && collidingWithX.entity.move) {
                // move the entity the same amount
                collidingWithX.entity.move(sx, 0, true);
            } else {
                this.x -= sx;
                if(squish && this.squish) {
                    this.squish();
                }
            }
            if (sx > 0) {
                this.colliding[1] = true;
            } else if (sx < 0) {
                this.colliding[3] = true;
            }
        }

        this.y += sy;
        let collidingY = false;
        let collidingWithY = null;
        for (let i = 0; i < collisionBoxes.length; i++) {
            let box = collisionBoxes[i];
            if (this.x + hsize > box.x && this.x - hsize < box.x + box.w &&
                this.y + hsize > box.y && this.y - hsize < box.y + box.h) {
                let top = this.y - hsize <= box.y+box.h && this.y - hsize > box.y;
                let bottom = this.y + hsize > box.y && this.y + hsize <= box.y+box.h;
                let right = this.x + hsize > box.x && this.x + hsize <= box.x + box.w;
                let left = this.x - hsize < box.x + box.w && this.x - hsize >= box.x;
                if (top || bottom || left || right) {
                    collidingY=true;
                    collidingWithY = box;
                }
            }
        }
        if (collidingY) {
            if (this.pushesEntities && collidingWithY.entity && collidingWithY.entity.move) {
                // move the entity the same amount
                collidingWithY.entity.move(0, sy, true);
            } else {
                this.y -= sy;
                if(squish && this.squish) {
                    this.squish();
                }
            }
            if (sy > 0) {
                this.colliding[2] = true;
            } else if (sy < 0) {
                this.colliding[0] = true;
            }
        }
    }

    isColliding() {
        return this.colliding[0] || this.colliding[1] || this.colliding[2] || this.colliding[3];
    }
}