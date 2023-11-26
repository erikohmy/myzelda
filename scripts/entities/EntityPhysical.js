class EntityPhysical extends EntityBase {
    x = 0;
    y = 0;
    speedX = 0;
    speedY = 0;
    speed = 0.5;
    targetX = null;
    targetY = null;
    targetSpeed=1;
    size = 8;

    physical = true;

    playerCollisions = true; // should this entity collide with the player?
    pushesEntities = false; // if this entity is pushed into another entity, should it push that entity?
    squishesEntities = false; // if this entity is pushed into another entity, should it squish that entity if it cannot be moved?
    canBeBlocked = true; // can this entity be blocked by other entities?
    canBePushed = true; // can this entity be pushed by other entities?
    canGoOutside = false; // can this entity go outside the screen?
    blockFilter = null; // function to filter which entities can block this entity, if canBeBlocked is false, it acts as a blacklist
    noCollide = false; // if true, this entity will not collide with anything, not even running the collision checks

    colliding = [0,0,0,0]; // top, right, bottom, left

    collideEntity = null; // entity we are currently colliding with
    _lastCollidedWith = null; // last entity we collided with (be careful how used)
    moveNudge = false;

    getCollisionBox() {
        return {
            entity: this,
            x: this.x-(this.size/2),
            y: this.y-(this.size/2),
            w: this.size,
            h: this.size,
        };
    }

    _setCollideEntity(entity) {
        if (entity !== this.collideEntity) {
            if (!entity) {
                this._clearCollideEntity();
                return;
            }
            this.collideEntity = entity;
        }
    }
    _clearCollideEntity() {
        if (this.collideEntity) {
            this.collideEntity = null;
        }
    }
    
    get position() {
        return [this.x, this.y];
    }

    get tilePosition() {// currently occupied tile
        let tx = Math.floor(this.x/16);
        let ty = Math.floor(this.y/16);
        return [tx, ty];
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    setTile(x, y) {
        let halfsize = this.game.tilesize/2;
        this.x = x*this.game.tilesize+halfsize;
        this.y = y*this.game.tilesize+halfsize;
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

    moveTo(x, y, speed=1, callback=null) {
        this.targetX = x;
        this.targetY = y;
        this.targetSpeed = speed;
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        if(typeof callback === "function") {
            this.game.everyTick(0, ()=>{
                // check if we're there yet
                if (this.x == this.targetX && this.y == this.targetY) {
                    callback(this);
                    return false;
                }
            }, 'logic');
        }
    }

    moveToTile(x, y, speed=1, callback=null) {
        let hsize = this.size/2;
        this.moveTo(x*this.game.tilesize+hsize, y*this.game.tilesize+hsize, speed, callback);
    }

    move(sx, sy, justTest = false, allownudge = true) {
        if (!justTest) {
            this.colliding=[0,0,0,0];
        }
        let couldMoveX = sx !== 0 ? this._move(sx, 0, justTest, allownudge) : false;
        let couldMoveY = sy !== 0 ? this._move(0, sy, justTest, allownudge) : false;
        return couldMoveX || couldMoveY;
    }
    _move(sx, sy, justTest = false, allownudge = true) {
        if ((this.noCollide || this.isCarried) && !justTest) {
            this.x += sx;
            this.y += sy;
            return true;
        }
        let oldx = this.x;
        let oldy = this.y;
        let collisionBoxes = this.game.world.currentSpace.getCollisionBoxes("solid", (box) => {
            return box.entity !== this && !(this instanceof EntityPlayer && box.entity && box.entity.playerCollisions === false);
        });
        if (this.playerCollisions) {
            if (this instanceof EntityPlayer) {
                // ???
            } else {
                collisionBoxes.push(this.game.world.player.getCollisionBox());
            }
        }
        let hsize = this.size/2;

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
                if (!justTest && this.pushesEntities && collidingWithX && collidingWithX.entity && collidingWithX.entity.move && collidingWithX.entity.canBePushed) {
                    // move the entity the same amount
                    blockedX = !collidingWithX.entity.move(sx, 0);
                    if (this.squishesEntities && blockedX && collidingWithX.entity.squish) {
                        collidingWithX.entity.squish();
                    }
                    //console.log( this.constructor.name ,"pushing entity sideways", collidingWithX.entity.constructor.name, blockedX);
                } else {
                    blockedX = true;
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
                if (!justTest && this.pushesEntities && collidingWithY && collidingWithY.entity && collidingWithY.entity.move && collidingWithY.entity.canBePushed) {
                    // move the entity the same amount
                    blockedY = !collidingWithY.entity.move(0, sy);
                    if (this.squishesEntities && blockedY && collidingWithY.entity.squish) {
                        collidingWithY.entity.squish();
                    }
                    //console.log( this.constructor.name ,"pushing entity up or down", collidingWithY.entity.constructor.name, blockedY);
                } else {
                    blockedY = true;
                }
            }
        }

        let wasBlocked = (blockedX || blockedY); // todo: work with canBeBlocked
        if (true) {
            if(!justTest) {
                if (wasBlocked) {
                    this._setCollideEntity(collidingWithX ? collidingWithX.entity : (collidingWithY ? collidingWithY.entity: null));
                } else {
                    this._clearCollideEntity();
                }
            }

            let canBeBlockedX = this.canBeBlocked;
            if (blockedX && this.blockFilter) {
                let filterResult = this.blockFilter(collidingWithX ? collidingWithX.entity : null);
                if (this.canBeBlocked) {
                    canBeBlockedX = filterResult;
                } else {
                    canBeBlockedX = !filterResult;
                }
            }

            let canBeBlockedY = this.canBeBlocked;
            if (blockedY && this.blockFilter) {
                let filterResult = this.blockFilter(collidingWithY ? collidingWithY.entity : null);
                if (this.canBeBlocked) {
                    canBeBlockedY = filterResult;
                } else {
                    canBeBlockedY = !filterResult;
                }
            }

            if (blockedX && canBeBlockedX) { // undo the x move if we were blocked, and can be blocked
                if (this.moveNudge && allownudge) {
                    
                    let checks = Math.floor(this.size/2) + 2;
                    let nudgeUp = false;
                    let nudgeDown = false;
                    for (let i = 1; i <= checks; i++) {
                        if (this._move(0, -i, true, false)) {
                            nudgeUp = i;
                            break;
                        }
                        if (this._move(0, i, true, false)) {
                            nudgeDown = i;
                            break;
                        }
                    }
                    if(!justTest) {
                        if (nudgeUp) {
                            //console.log('could walk, if we nudged up by', nudgeUp, 'px')
                            this.x -= sx;
                            return this.move(0,-1)
                        } else if (nudgeDown) {
                            //console.log('could walk, if we nudged down by', nudgeDown, 'px')
                            this.x -= sx;
                            return this.move(0,1)
                        }
                    } else if(nudgeUp || nudgeDown) {
                        this.x -= sx;
                        return true;
                    }
                }
                if(!justTest) {
                    this.x -= sx;
                    if (sx > 0) {
                        this.colliding[1] = 1;
                    } else if (sx < 0) {
                        this.colliding[3] = 1;
                    }
                }
            }

            if (blockedY && canBeBlockedY) { // undo the y move if we were blocked, and can be blocked
                if (this.moveNudge && allownudge) {
                    let checks = Math.floor(this.size/2) + 2;
                    let nudgeLeft = false;
                    let nudgeRight = false;
                    for (let i = 1; i <= checks; i++) {
                        if (this._move(-i, 0, true, false)) {
                            nudgeLeft = i;
                            break;
                        }
                        if (this._move(i, 0, true, false)) {
                            nudgeRight = i;
                            break;
                        }
                    }
                    if(!justTest) {
                        if (nudgeLeft) {
                            //console.log('could walk, if we nudged left by', nudgeLeft, 'px')
                            this.y -= sy;
                            return this.move(-1,0)
                        } else if (nudgeRight) {
                            //console.log('could walk, if we nudged right by', nudgeRight, 'px')
                            this.y -= sy;
                            return this.move(1,0)
                        }
                    } else if(nudgeLeft || nudgeRight) {
                        this.y -= sy;
                        return true;
                    }
                }
                if(!justTest) {
                    this.y -= sy;
                    if (sy > 0) {
                        this.colliding[2] = 1;
                    } else if (sy < 0) {
                        this.colliding[0] = 1;
                    }
                }
            }
        }
        if(justTest) { // just a test, reset position
            this.x = oldx;
            this.y = oldy;
        }
        if (collidingWithX) {
            this._lastCollidedWith = collidingWithX;
        } else if(collidingWithY) {
            this._lastCollidedWith = collidingWithY;
        } else {
            this._lastCollidedWith = null;
        }
        return !wasBlocked;
    }

    isColliding() {
        return !!(this.colliding[0] || this.colliding[1] || this.colliding[2] || this.colliding[3]);
    }

    getDebugInfo() {
        let info = super.getDebugInfo();
        let position = this.position;
        info.position = position[0] + "," + position[1];
        return info;
    }
}