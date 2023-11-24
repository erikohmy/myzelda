class GameMap {
    game;

    transitionTimer = 0;
    animationTick=0;
    opening = false;
    closing = false;
    open = false;
    fadeTime = 90;

    currentCoords = [0,0];
    selectedCoords = [0,0];

    constructor(game) {
        this.game = game;

        this.game.events.on('input', (e) => {
            if (this.isBusy || !this.open) return;
            if (e === "left" || e === "right" || e === "up" || e === "down") {
                this.game.sound.play('menu_cursor', 0.016);
            }
            if(e === "left") {this.selectedCoords[0]--;}
            if(e === "right") {this.selectedCoords[0]++;}
            if(e === "up") {this.selectedCoords[1]--;}
            if(e === "down") {this.selectedCoords[1]++;}
            if(this.selectedCoords[0] < 0) {this.selectedCoords[0] = 0;}
            if(this.selectedCoords[1] < 0) {this.selectedCoords[1] = 0;}
            if(this.selectedCoords[0] >= 14) {this.selectedCoords[0] = 14-1;}
            if(this.selectedCoords[1] >= 14) {this.selectedCoords[1] = 14-1;}
            if(e === "a") {
                // check if space exists
                let space = this.game.world.layers.overworld.getSpace(this.selectedCoords[0], this.selectedCoords[1]);
                if (space) {
                    setTimeout(()=>{
                        this.game.world.goToString(`overworld:${this.selectedCoords[0]},${this.selectedCoords[1]}:warp:none:appear:none:none`);
                    }, 100)
                    
                    this.game.sound.play('menu_select');
                    this.hide();
                }
            }
        });
    }

    get isBusy() {
        return this.opening || this.closing;
    }

    get type() { // 'overworld' or 'dungeon'
        return "overworld";
    }

    async show() {
        if(this.open || this.isBusy) return;
        this.game.mapOpen = true;
        this.open = true;
        this.opening = true;
        this.transitionTimer = 0;
        this.animationTick = 0;
        if(this.type === 'overworld') {
            this.currentCoords = this.game.world.player.space.position;
            this.selectedCoords = this.game.world.player.space.position;
        }
        this.game.sound.play('menu_open');
        await new Promise((resolve) => {
            let fn = () => {
                if(!this.isBusy) {
                    resolve();
                } else {
                    requestAnimationFrame(fn);
                }
            }
            fn();
        });
    }

    async hide() {
        if(!this.open || this.isBusy) return;
        this.open = false;
        this.closing = true;
        this.transitionTimer = 0;
        this.game.sound.play('menu_close');
        await new Promise((resolve) => {
            let fn = () => {
                if(!this.isBusy) {
                    this.game.mapOpen = false;
                    resolve();
                } else {
                    requestAnimationFrame(fn);
                }
           }
           fn();
        });
    }

    tick() {
        if (this.opening || this.closing) {
            this.transitionTimer++;
            if (this.transitionTimer >= this.fadeTime) {
                if(this.opening){
                    this.opening = false;
                } else {
                    this.closing = false;
                }
            }
        }
        this.animationTick++;
    }

    draw() {
        if(this.opening || this.closing || !this.open) {
            this.game.render();
        }

        if (this.opening || this.closing) {
            let alpha = this.transitionTimer / (this.fadeTime/2);
            if (alpha > 1) {
                alpha = 2-alpha
                if(this.opening) {
                    this.drawMap();
                }
            }else if (this.closing) {
                this.drawMap();
            }
            this.game.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            this.game.ctx.fillRect(0, 0, this.game.size[0], this.game.size[1]);
        } else if (this.open) {
            this.drawMap();
        }
    }

    drawMap() {
        this.game.ctx.fillStyle = Graphics.colors.ui;
        this.game.ctx.fillRect(0, 0, this.game.size[0], this.game.size[1]);

        let sheet = this.game.spritesheets.mapOverworld;
        sheet.drawRegion(this.game.ctx, 0, 0, 0, 0, this.game.size[0], this.game.size[0]);

        let sizex = 14;
        let sizey = 14;
        let ot = 16;
        let ol = 24;
        for (let x = 0; x < sizex; x++) {
            for (let y = 0; y < sizey; y++) {
                let space = this.game.world.layers.overworld.getSpace(x, y);
                if (space) {
                    /*
                    let color = 'rgb(50,255,50)';
                    if (this.selectedCoors[0] === x && this.selectedCoors[1] === y) {
                        color = Graphics.colors.zblue;
                    }
                    this.game.ctx.fillStyle = color;
                    this.game.ctx.fillRect(8 * x + ol, 8 * y + ot, 8, 8);
                    */
                    if (space.minimap && typeof space.minimap === 'function') {
                        space.minimap(this.game.ctx, 8 * x + ol+1, 8 * y + ot+1);
                    } else {
                        this.game.ctx.fillStyle = space.background;
                        this.game.ctx.fillRect(8 * x + ol+1, 8 * y + ot+1, 7, 7);
                    }
                } else {
                    this.game.ctx.fillStyle = "#555";
                    this.game.ctx.fillRect(8 * x + ol+1, 8 * y + ot+1, 7, 7);
                    this.game.ctx.fillStyle = "#333";
                    this.game.ctx.fillRect(8 * x + ol+2, 8 * y + ot+2, 5, 5);
                }
                // grid lines
                this.game.ctx.fillStyle = "#000";
                this.game.ctx.fillRect(8 * x +ol, 8 * y+ot, 8, 1);
                this.game.ctx.fillRect(8 * x +ol, 8 * y+ot+1, 1, 7);
            }
        }
        // end of grid
        this.game.ctx.fillRect(ol, 8 * sizey + ot, 8*sizex+1, 1);
        this.game.ctx.fillRect(8 * sizex + ol, ot, 1, 8*sizey);

        // draw selection rectangle
        let x = this.selectedCoords[0];
        let y = this.selectedCoords[1];

        let cursoroffset = 4;// + Math.floor(this.animationTick/30)%2;
        this.game.spritesheets.ui.drawSprite(this.game.ctx, 0, 1, 8 * x +ol-cursoroffset, 8 * y+ot-cursoroffset);
        this.game.spritesheets.ui.drawSprite(this.game.ctx, 1, 1, 8 * x +ol+cursoroffset, 8 * y+ot-cursoroffset);
        this.game.spritesheets.ui.drawSprite(this.game.ctx, 0, 2, 8 * x +ol-cursoroffset, 8 * y+ot+cursoroffset);
        this.game.spritesheets.ui.drawSprite(this.game.ctx, 1, 2, 8 * x +ol+cursoroffset, 8 * y+ot+cursoroffset);

        // draw player
        let px = this.currentCoords[0];
        let py = this.currentCoords[1];
        if (Math.floor(this.animationTick/100)%2 > 0) {
            this.game.spritesheets.ui.drawSprite(this.game.ctx, 4, 1, 8 * px +ol+1, 8 * py+ot-5);
        }
    }
}