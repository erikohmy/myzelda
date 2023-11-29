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
        zyellow: "#f8e010",
        zred: "#ee0000",
    };
    static fontMap() {
        return [
            'ABCDEFGHIJKLM',
            'NOPQRSTUVWXYZ',
            'abcdefghijklm',
            'nopqrstuvwxyz',
            ' 0123456789',
            '.!?\'-'
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

    static async imgFromCtx(ctx, useBitmap = true) {
        if (useBitmap) {
            return await createImageBitmap(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
        }
        let img = new Image();
        img.src = ctx.canvas.toDataURL();
        await img.decode();
        return img;
    }

    static async palletChange(image, map) {
        await image.decode();
        map = this.colorMapProcess(map);
        // change the colors in an image, based on a map
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        let ctx = canvas.getContext("2d", { willReadFrequently: true });
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
        return await Graphics.imgFromCtx(ctx);
    }
    static hex2rgb(hex) {
        // if we dont start with a #, return as is
        if (hex[0] !== "#") return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return r + "," + g + "," + b;
    }
    static rgb2hex(rgb) {
        // if we start with a #, return as is
        if (rgb[0] === "#") return rgb;
        let [r, g, b] = rgb.split(",");
        r = parseInt(r).toString(16);
        g = parseInt(g).toString(16);
        b = parseInt(b).toString(16);
        if (r.length === 1) r = "0" + r;
        if (g.length === 1) g = "0" + g;
        if (b.length === 1) b = "0" + b;
        return "#"+r+g+b;
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

    static drawShadow(ctx, x, y, width=8, height=8) {
        // draw an ellipse
        ctx.beginPath();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.ellipse(x, y, width/2, height/3, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    static applyFilters(ctx, filtersRaw) {
        // filters come in as filter:param, we turn that into a filters and params array
        let filters = [];
        let params = [];
        for (let i = 0; i < filtersRaw.length; i++) {
            let parts = filtersRaw[i].split(":");
            let filter = parts[0];
            let param = parts.length > 1 ? parseFloat(parts[1]) : 1;
            filters.push(filter);
            params.push(param);
        }
        let width = ctx.canvas.width;
        let height = ctx.canvas.height;
        let imgData = ctx.getImageData(0, 0, width, height);
        const data = new Uint8ClampedArray(imgData.data);
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i + 0];
            let g = data[i + 1];
            let b = data[i + 2];
            let a = data[i + 3];
            for (let j = 0; j < filters.length; j++) {
                let filter = filters[j];
                let param  = params[j];
                [r,g,b] = this.applyFilter(filter, param, r, g, b);
            }

            data[i + 0] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
        const changedData = new ImageData(data, imgData.width, imgData.height)
        //ctx.clearRect(0, 0, width, height);
        ctx.putImageData(changedData, 0, 0);
    }

    static getPalette(ctx) { // get all currently used colors in canvas, sorted by color value
        let width = ctx.canvas.width;
        let height = ctx.canvas.height;
        let imgData = ctx.getImageData(0, 0, width, height);
        const data = new Uint8ClampedArray(imgData.data);
        let seen = [];
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i + 0];
            let g = data[i + 1];
            let b = data[i + 2];
            let key = this.rgb2hex(r + "," + g + "," + b);
            if (seen.indexOf(key) === -1) {
                seen.push(key);
            }
        }
        if(typeof seen !== "object") {
            return [];
        }
        return sortColors(seen);
    }

    // filters
    static applyFilter(name, param, r, g, b) {
        if (name === "invert") {
            return this.filterInvert(r, g, b, param);
        } else if (name === "grayscale") {
            return this.filterGrayscale(r, g, b, param);
        } else if (name === "brightness") {
            return this.filterBrightness(r, g, b, param);
        }
        let color = new Color(r+","+g+","+b);
        return [r, g, b];
    }
    static filterInvert(r,g,b,m) {
        let fr, fg, fb;
        [fr,fg,fb] = [255-r, 255-g, 255-b]
        if(m === 1) {return [fr,fg,fb];}
        fr = r + ((fr - r) * m);
        fg = g + ((fg - g) * m);
        fb = b + ((fb - b) * m);
        return [fr,fg,fb];
    }
    static filterGrayscale(r,g,b,m) {
        let fr, fg, fb;
        let avg = (r + g + b) / 3;
        [fr,fg,fb] = [avg, avg, avg];
        if(m === 1) {return [fr,fg,fb];}
        fr = r + ((fr - r) * m);
        fg = g + ((fg - g) * m);
        fb = b + ((fb - b) * m);
        return [fr,fg,fb];
    }
    static filterBrightness(r,g,b,m) {
        return [r*m,g*m,b*m];
    }
}