class Dialog {
    game;

    _show = false;
    text = "";
    textRows = [];
    displayedText = "";
    currentRow = 0;

    progressing = false;
    showingMore = false;
    pt = 0; // progress tick
    wait = 0;

    doSound = true;
    instant = false;
    anyNext = false;
    
    constructor(game) {
        this.game = game;
    }
    
    get show() {
        return this._show;
    }
    set show(value) {
        value = !!value;
        if (this._show !== value) {
            this._show = value;
            if (value) {
                this.reset();
            }
        }
    }

    reset() {
        this.displayedText = "";
        this.currentRow = 0;
    }

    setupText(text) {
        this.text = text;
        this.textRows = text.split("\n");
        // if uneven, add a blank line
        if (this.textRows.length % 2 == 1) {
            this.textRows.push(" ");
        }
    }

    display(text, doSound = true, anyNext = false, instant = false) {
        this.doSound = doSound;
        this.anyNext = anyNext;
        this.instant = instant;
        this.reset();
        this.setupText(text);
        this.show = true;
        this.pt = 0;
        this.progressing = true;
    }

    tick() {
        if (!this.show) {
            return;
        }
        if(this.progressing) {
            this.pt++;
            if (this.pt==1 || this.pt==10) {
                this.currentRow++;
            }
            if (this.pt==20) {
                this.progressing = false;
            }
        }
        let textToDisplay = "";
        if (this.currentRow > -1) {
            for(let i = 0; i < this.currentRow && i < this.textRows.length; i++) {
                textToDisplay += this.textRows[i] + "\n";
            }
            // remove trailing newline
            textToDisplay = textToDisplay.slice(0, -1);
        }
        let lengthdiff = textToDisplay.length - this.displayedText.length;
        if (lengthdiff > 0) {
            this.showingMore = true;
            if (this.wait > 0) {
                this.wait--;
            } else {
                this.displayedText = textToDisplay.slice(0, this.displayedText.length+1);
            }
            if (this.doSound) {
                this.game.sound.play("text_letter");
            }
        } else if(this.showingMore) {
            this.wait = 0;
            this.showingMore = false;
        }
    }

    get isMore() {
        return !(this.currentRow >= this.textRows.length);
    }

    get isBusy() {
        return this.progressing || this.showingMore || this.wait > 0;
    }

    next() {
        if (this.progressing || this.showingMore) {
            return;
        }
        // is all text displayed?
        if (this.currentRow >= this.textRows.length) {
            this.show = false;
            return;
        } else {
            this.progressing = true;
            this.pt = 0;
            this.wait = 2;
            this.game.sound.play("text_done");
        }
    }

    render() {
        if (!this.show) {
            return;
        }
        let playerY = this.game.world.player.y;
        // if player is above the middle of the screen, draw dialog box below player
        // if player is below the middle of the screen, draw dialog box above player
        let offsetY = 8 + 16; // ui + 8px margin
        let offsetX = 8;
        let width = this.game.size[0] -16;
        let height = 40;
        if (playerY < this.game.size[1] / 2) {
            offsetY = this.game.size[1] - 48;
        }
        this.game.ctx.fillStyle = "#000";
        this.game.ctx.fillRect(offsetX, offsetY, width, height);

        let paddingTop = 8;
        let paddingLeft = 8;
        let text = "";
        // get last two rows of displayedText
        let rows = this.displayedText.split("\n");
        if (rows.length > 1) {
            text = rows[rows.length-2] + "\n" + rows[rows.length-1];
        } else {
            text = rows[rows.length-1];
        }
        Graphics.drawText(this.game.ctx, text, offsetX+paddingLeft, offsetY+paddingTop, "white");

        // draw arrow if there is more text
        if (this.isMore && !this.isBusy) {
            // flash arrow
            if ( this.game.gametick % 60 < 30) {
                let arrowX = offsetX + width - 12;
                let arrowY = offsetY + height - 12;
                this.game.ctx.fillStyle = "#f00";
                this.game.ctx.fillRect(arrowX, arrowY, 8, 8);
            }
        }
    }
}