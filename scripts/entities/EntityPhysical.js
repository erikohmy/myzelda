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

    playerCollisions = true; // should this entity collide with the player?
    pushesEntities = false; // if this entity is pushed into another entity, should it push that entity?
    squishesEntities = false; // if this entity is pushed into another entity, should it squish that entity if it cannot be moved?
    canBeBlocked = true; // can this entity be blocked by other entities?
    canBePushed = true; // can this entity be pushed by other entities?
    canGoOutside = false; // can this entity go outside the screen?

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
        let limit = 8;
        this.speedX += sx;
        this.speedY += sy;

        if (this.speedX > limit) {
            this.speedX = limit;
        } else if (this.speedX < -limit) {
            this.speedX = -limit;
        }
        if (this.speedY > limit) {
            this.speedY = limit;
        } else if (this.speedY < -limit) {
            this.speedY = -limit;
        }
    }

    get velocity() {
        let speed = Math.sqrt(this.speedX*this.speedX + this.speedY*this.speedY);
        return speed;
    }

    moveTo(x, y, speed=1) {
        this.targetX = x;
        this.targetY = y;
        this.targetSpeed = speed;
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
    }

    moveToTile(x, y, speed=1) {
        let hsize = this.size/2;
        this.moveTo(x*16+hsize, y*16+hsize, speed);
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

        this.x += sx;
        let collidingX = false;
        let collidingWithX = null;
        let blockedX = false;
        if (Math.abs(sx) > 0) {
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
            // would this send us outside the screen?
            if (!this.canGoOutside && (this.x - hsize < 0 || this.x + hsize > (this.game.world.currentSpace.size[0])*16)) {
                collidingX = true;
            }
            if (collidingX) {
                if (this.pushesEntities && collidingWithX && collidingWithX.entity && collidingWithX.entity.move && collidingWithX.entity.canBePushed) {
                    // move the entity the same amount
                    blockedX = !collidingWithX.entity.move(sx, 0, this.squishesEntities);
                    //console.log( this.constructor.name ,"pushing entity sideways", collidingWithX.entity.constructor.name, blockedX);
                } else {
                    blockedX = true;
                }

                if (blockedX && this.canBeBlocked){
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
        }

        this.y += sy;
        let collidingY = false;
        let collidingWithY = null;
        let blockedY = false;
        if (Math.abs(sy) > 0) {
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
            // would this send us outside the screen?
            if (!this.canGoOutside && (this.y - hsize < 0 || this.y + hsize > (this.game.world.currentSpace.size[1])*16)) {
                collidingY = true;
            }
            if (collidingY) {
                if (this.pushesEntities && collidingWithY && collidingWithY.entity && collidingWithY.entity.move && collidingWithY.entity.canBePushed) {
                    // move the entity the same amount
                    blockedY = !collidingWithY.entity.move(0, sy, this.squishesEntities);
                    //console.log( this.constructor.name ,"pushing entity up or down", collidingWithY.entity.constructor.name, blockedY);
                } else {
                    blockedY = true;
                }
                if (blockedY && this.canBeBlocked) {
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
        return !(blockedX || blockedY);
    }

    isColliding() {
        return this.colliding[0] || this.colliding[1] || this.colliding[2] || this.colliding[3];
    }
}