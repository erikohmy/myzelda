window.addEventListener('load', () => {
    window.graphics_font = new Image();
    graphics_font.src = 'assets/font.png';
});
class Graphics {
    static colors = {
        ui: "#fce6c6",
    };
    static fontMap() {
        return [
            'ABCDEFGHIJKLM',
            'NOPQRSTUVWXYZ',
            'abcdefghijklm',
            'nopqrstuvwxyz',
            ' 0123456789',
            '.!?'
        ]
    }
    static getCharIndex(char) {
        let map = this.fontMap();
        for (let i = 0; i < map.length; i++) {
            let row = map[i];
            let idx = row.indexOf(char);
            if (idx > -1) {
                return [idx, i];
            }
        }
        return [null, null];
    }
    static font() {
        return window.graphics_font;
    }
    static fontSize() {
        return [8,10];
    }

    static drawChar(ctx, char, x, y) {
        let fw, fh, fx, fy;
        [fw, fh] = this.fontSize();
        [fx, fy] = this.getCharIndex(char);
        if(fx === null) {
            ctx.fillStyle = "red";
            ctx.fillRect(x, y, fw, fh);
            ctx.fillStyle = "black";
            ctx.fillRect(x+1, y+1, fw-2, fh-2);
        } else {
            ctx.drawImage(this.font(), fx*fw, fy*fh, fw, fh, x, y, fw, fh);
        }
    }

    // draws pixel text using a sprite sheet
    static drawText(ctx, text, x, y, color = "white") {
        let filterBefore = ctx.filter;
        if (color !== "white") {
            ctx.filter = "invert(100%)";
        }
        let fw, fh;
        [fw, fh] = this.fontSize();
        let sx = 0; // spacing x
        let sy = 4; // spacing y
        let rows = text.split("\n");
        // longest row
        let cols = 0;
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            if (row.length > cols) {
                cols = row.length;
            }
        }
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            for (let j = 0; j < row.length; j++) {
                let char = row[j];
                let px =  x + (j * (fw + sx));
                let py = y + (i * (fh + sy));
                this.drawChar(ctx, char, px, py, color);
            }
        }
        if (color !== "white") {
            ctx.filter = filterBefore;
        }
    }
}