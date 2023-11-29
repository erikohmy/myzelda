class GameMenu {
    game;

    transitionTimer = 0;
    animationTick=0;
    opening = false;
    closing = false;
    open = false;
    fadeTime = 90;

    currentScreen = 0; // 0 inventory, 1 collectibles, 2 progress/save&quit

    constructor(game) {
        this.game = game;

        this.game.events.on('input', (e) => {
            if (this.isBusy || !this.open) return;
            if (e === "left" || e === "right" || e === "up" || e === "down") {
                this.game.sound.play('menu_cursor', 0.016);
            }
        });
    }

    get isOpen() { // is the menu currently open or opening/closing
        return this.game.menuOpen;
    }

    get isBusy() {
        return this.opening || this.closing;
    }

    async show() {
        if(this.open || this.isBusy|| this.game.map.isOpen) return;
        this.game.menuOpen = true;
        this.open = true;
        this.opening = true;
        this.transitionTimer = 0;
        this.animationTick = 0;

        this.game.sound.play('menu_open');
        this.game.sound.musicVolume = 0.2;
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
        this.game.sound.musicVolume = 1;
        await new Promise((resolve) => {
            let fn = () => {
                if(!this.isBusy) {
                    this.game.menuOpen = false;
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
                    this.drawMenu();
                }
            }else if (this.closing) {
                this.drawMenu();
            }
            this.game.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            this.game.ctx.fillRect(0, 0, this.game.size[0], this.game.size[1]);
        } else if (this.open) {
            this.drawMenu();
        }
    }

    drawMenu() {
        this.game.ctx.fillStyle = Graphics.colors.ui;
        this.game.ctx.fillRect(0, 0, this.game.size[0], this.game.size[1]);
        this.game.renderUi();
    }
}