window.addEventListener('load', async () => {
    window.graphics_font = new Image();
    graphics_font.src = 'assets/font.png';
    window.graphics_font_blue = await Graphics.palletChange(window.graphics_font, {
        "255,255,255": Graphics.colors.zblue
    });
});
class Graphics {
    static colors = {
        ui: "#fce6c6",
        zblue: "#1882ff",
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
    static font(color = "white") {
        if(color === "blue"){return window.graphics_font_blue}
        return window.graphics_font;
    }
    static fontSize() {
        return [8,10];
    }

    static drawChar(ctx, char, x, y, color = "white") {
        let fw, fh, fx, fy;
        [fw, fh] = this.fontSize();
        [fx, fy] = this.getCharIndex(char);
        if(fx === null) {
            ctx.fillStyle = "red";
            ctx.fillRect(x, y, fw, fh);
            ctx.fillStyle = "black";
            ctx.fillRect(x+1, y+1, fw-2, fh-2);
        } else {
            ctx.drawImage(this.font(color), fx*fw, fy*fh, fw, fh, x, y, fw, fh);
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

    static async palletChange(image, map) {
        await image.decode();
        map = this.colorMapProcess(map);
        // change the colors in an image, based on a map
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        let ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0);
        let imgData = ctx.getImageData(0, 0, image.width, image.height);
        const data = new Uint8ClampedArray(imgData.data);
        let seen = [];
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i + 0];
            let g = data[i + 1];
            let b = data[i + 2];
            let key = r + "," + g + "," + b;
            if (seen.indexOf(key) === -1) {
                //console.log('seen a new color', key);
                seen.push(key);
            }
            if (map[key]) {
                let [r2, g2, b2] = map[key].split(",");
                data[i + 0] = r2;
                data[i + 1] = g2;
                data[i + 2] = b2;
            }
        }
        const changedData = new ImageData(data, imgData.width, imgData.height)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(changedData, 0, 0);
        let changedImage = new Image();
        changedImage.src = canvas.toDataURL();
        await changedImage.decode();
        return changedImage;
    }
    static hex2rgb(hex) {
        // if we dont start with a #, return as is
        if (hex[0] !== "#") return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return r + "," + g + "," + b;
    }
    static colorMapProcess(map) {
        // turn all keys and values from hex to rgb
        let newMap = {};
        for (let key in map) {
            let value = map[key];
            let newKey = this.hex2rgb(key);
            let newValue = this.hex2rgb(value);
            newMap[newKey] = newValue;
        }
        return newMap;
    }
}