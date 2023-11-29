class GameMenu {
    game;

    transitionTimer = 0;
    animationTick=0;
    opening = false;
    closing = false;
    open = false;
    fadeTime = 90;

    currentScreen = 0; // 0 inventory, 1 collectibles, 2 progress/save&quit
    selection = 0; // what index is the cursor at currently

    constructor(game) {
        this.game = game;

        this.game.events.on('input', (e) => {
            if (this.isBusy || !this.open) return;
            if (e === "left" || e === "right" || e === "up" || e === "down") {
                this.game.sound.play('menu_cursor', 0.016);
                // move cursor, depending on screen!, but left and right always increases and decreases by 1
                if(e === "left") {this.selection--;}
                if(e === "right") {this.selection++;}
                if(this.currentScreen === 0) { // inventory screen
                    if(e === "up") {this.selection -= 4;}
                    if(e === "down") {this.selection += 4;}
                    // we know we have 4*4 slots, so we can just wrap around
                    if(this.selection < 0) {this.selection = 4*4-1;}
                    else if(this.selection >= 4*4) {this.selection = 0;}
                }
                if(this.selection < 0) {this.selection = 0;} // actually wraparound later
            }
            if(this.currentScreen === 0) {
                let itemname = this.game.player.inventory.items[this.selection];
                if (e === "a" || e === "b") {
                    let hs = e === "a" ? 0 : 1;
                    let currentItem = this.game.player.hotbarItems[hs];
                    this.game.player.inventory.items[this.selection] = currentItem;
                    this.game.player.hotbarItems[hs] = itemname;
                    this.game.sound.play('menu_select');     
                }
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
                    this.game.interface.clearPressed();
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
        this.game.ctx.fillStyle = "#FFF";
        this.game.ctx.fillRect(0, 0, this.game.size[0], this.game.size[1]);
        this.game.renderUi();

        this.drawItemScreen();
    }

    drawItemScreen(ox=0,oy=0) {
        // draw item screen, 160 wide
        let sheet = this.game.spritesheets.ui;

        // left and right borders
        sheet.drawSprite(this.game.ctx, 5, 0, 0+ox, 16+oy, 1, 1, 8, 8, 1, 16);
        sheet.drawSprite(this.game.ctx, 5, 0, 160-8+ox, 16+oy, 1, 1, 8, 8, 1, 16);

        // top,bottom, and description borders
        sheet.drawSprite(this.game.ctx, 6, 0, 8+ox, 16+oy, 1, 1, 8, 8, 18, 1);
        sheet.drawSprite(this.game.ctx, 6, 0, 8+ox, 144-5+oy, 1, 1, 8, 8, 18, 1);
        sheet.drawSprite(this.game.ctx, 6, 0, 8+ox, 144-29+oy, 1, 1, 8, 8, 18, 1);

        let grid = new GameMenuGrid(4,4);
        grid.everySlot((slot, x, y, index) => {
            let px = x * (slot.totalWidth + 0) + 20 + ox;
            let py = y * (slot.height + 8) + 24 + oy;

            //this.game.ctx.fillStyle = testColors[testindex];
            //this.game.ctx.fillRect(px, py, slot.width + slot.barWidth * 2, slot.height);

            // draw item (if any)
            let itemname = this.game.player.inventory.items[index];
            if (itemname) {
                let item = this.game.player.inventoryItems[itemname];
                if (item) {
                    item.renderIcon(this.game.ctx, px + slot.barWidth, py);
                } else {
                    console.error("item not found", itemname);
                }
            }
            // if selected, draw cursor
            if (this.selection === index) {
                sheet.drawSprite(this.game.ctx, 3, 3, px, py, 0.5, 2);
                sheet.drawSprite(this.game.ctx, 3.5, 3, px+slot.width+4, py, 0.5, 2);
            }
        });
    }
}

class GameMenuGrid {
    slots;
    slotsX;
    slotsY;

    constructor(slotsX, slotsY) {
        this.slotsX = slotsX;
        this.slotsY = slotsY;
        this.slots = [];
        for (let y = 0; y < slotsY; y++) {
            for (let x = 0; x < slotsX; x++) {
                this.slots.push(new GameMenuSlot(null));
            }
        }
    }

    everySlot(fn) {
        testindex=0;
        for (let y = 0; y < this.slotsY; y++) {
            for (let x = 0; x < this.slotsX; x++) {
                let index = y * this.slotsX + x;
                let slot = this.slots[index];
                fn(slot, x, y, index);
                testindex++;
            }
        }
    }
}

let testindex = 0;
let testColors = [
    "#F00", "#0F0", "#00F", "#FF0", "#F0F", "#0FF",
    "#F00", "#0F0", "#00F", "#FF0", "#F0F", "#0FF",
    "#F00", "#0F0", "#00F", "#FF0", "#F0F", "#0FF",
    "#F00", "#0F0", "#00F", "#FF0", "#F0F", "#0FF"
];

class GameMenuSlot {
    barWidth = 4;
    height = 16;
    width = 24; // total width will be width + barWidth*2
    get totalWidth() {
        return this.width + this.barWidth * 2;
    }
}