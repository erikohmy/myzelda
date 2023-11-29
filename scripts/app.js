window.addEventListener('load', () => {
    const game = new Game(document.querySelector('#game'));
    window.game = game;
    game.load();
});

//Sorting Hex Color:
class Color {
    constructor(val) {
        if (val[0] != "#") {
            if (typeof val === "string") { // assume rgb in "r,g,b" format
                val = Color.rgb2hex(val.split(","));
            } else {
                throw new Error("Color must be a hex string or rgb string");
            }
        }
        this.hex = val;
        this.build();
    }

    get r() {return this.red;}
    get g() {return this.green;}
    get b() {return this.blue;}

    get hsl() {
        return Color.rgb2hsl([this.red, this.green, this.blue]);
    }

    build() {
        var hex = this.hex.substring(1);
        /* Get the RGB values to calculate the Hue. */
        var r = parseInt(hex.substring(0, 2), 16) / 255;
        var g = parseInt(hex.substring(2, 4), 16) / 255;
        var b = parseInt(hex.substring(4, 6), 16) / 255;

        /* Getting the Max and Min values for Chroma. */
        var max = Math.max.apply(Math, [r, g, b]);
        var min = Math.min.apply(Math, [r, g, b]);


        /* Variables for HSV value of hex color. */
        var chr = max - min;
        var hue = 0;
        var val = max;
        var sat = 0;

        if (val > 0) {
            /* Calculate Saturation only if Value isn't 0. */
            sat = chr / val;
            if (sat > 0) {
                if (r == max) {
                    hue = 60 * (((g - min) - (b - min)) / chr);
                    if (hue < 0) {
                        hue += 360;
                    }
                } else if (g == max) {
                    hue = 120 + 60 * (((b - min) - (r - min)) / chr);
                } else if (b == max) {
                    hue = 240 + 60 * (((r - min) - (g - min)) / chr);
                }
            }
        }

        this.chroma = chr;
        this.hue = hue;
        this.sat = sat;
        this.val = val;
        this.luma = 0.3 * r + 0.59 * g + 0.11 * b;
        this.red = parseInt(hex.substring(0, 2), 16);
        this.green = parseInt(hex.substring(2, 4), 16);
        this.blue = parseInt(hex.substring(4, 6), 16);
    }

    static rgb2hsl(color) {
        let r = color[0] / 255;
        let g = color[1] / 255;
        let b = color[2] / 255;
        const l = Math.max(r, g, b);
        const s = l - Math.min(r, g, b);
        const h = s
            ? l === r
            ? (g - b) / s
            : l === g
            ? 2 + (b - r) / s
            : 4 + (r - g) / s
            : 0;
        return [
            60 * h < 0 ? 60 * h + 360 : 60 * h,
            100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
            (100 * (2 * l - s)) / 2,
        ];
    }
    static rgb2hex(color) {
        let [r, g, b] = color;
        r = parseInt(r).toString(16);
        g = parseInt(g).toString(16);
        b = parseInt(b).toString(16);
        if (r.length === 1) r = "0" + r;
        if (g.length === 1) g = "0" + g;
        if (b.length === 1) b = "0" + b;
        return "#"+r+g+b;
    }

    // cluster sorting
    static clusters = [
        { name: 'red', leadColor: [255, 0, 0], colors: [] },
        { name: 'orange', leadColor: [255, 128, 0], colors: [] },
        { name: 'yellow', leadColor: [255, 255, 0], colors: [] },
        { name: 'chartreuse', leadColor: [128, 255, 0], colors: [] },
        { name: 'green', leadColor: [0, 255, 0], colors: [] },
        { name: 'spring green', leadColor: [0, 255, 128], colors: [] },
        { name: 'cyan', leadColor: [0, 255, 255], colors: [] },
        { name: 'azure', leadColor: [0, 127, 255], colors: [] },
        { name: 'blue', leadColor: [0, 0, 255], colors: [] },
        { name: 'violet', leadColor: [127, 0, 255], colors: [] },
        { name: 'magenta', leadColor: [255, 0, 255], colors: [] },
        { name: 'rose', leadColor: [255, 0, 128], colors: [] },
        { name: 'white', leadColor: [255, 255, 255], colors: [] },
        { name: 'grey', leadColor: [235, 235, 235], colors: [] },
        { name: 'black', leadColor: [0, 0, 0], colors: [] },
    ];
    static clustersGrouped = [
        //reds
        { name: 'pastelred', leadColor: [255, 200, 200], colors: [] },
        { name: 'red', leadColor: [255, 0, 0], colors: [] },
        { name: 'darkred', leadColor: [200, 0, 0], colors: [] },
        //oranges
        { name: 'orange', leadColor: [255, 128, 0], colors: [] },
        //brown
        { name: 'brown', leadColor: [130, 80, 0], colors: [] },
        //yellows
        { name: 'yellow', leadColor: [255, 255, 0], colors: [] },

        // greens
        { name: 'pastelgreen', leadColor: [200, 255, 200], colors: [] },
        { name: 'chartreuse', leadColor: [128, 255, 0], colors: [] },
        { name: 'spring green', leadColor: [0, 255, 128], colors: [] },
        { name: 'green', leadColor: [0, 255, 0], colors: [] },
        { name: 'darkgreen', leadColor: [0, 200, 0], colors: [] },

        // blues
        { name: 'cyan', leadColor: [0, 255, 255], colors: [] },
        { name: 'pastelblue', leadColor: [200, 200, 255], colors: [] },
        { name: 'azure', leadColor: [0, 127, 255], colors: [] },
        { name: 'blue', leadColor: [0, 0, 255], colors: [] },
        { name: 'darkblue', leadColor: [0, 0, 200], colors: [] },


        { name: 'violet', leadColor: [127, 0, 255], colors: [] },
        { name: 'magenta', leadColor: [255, 0, 255], colors: [] },
        { name: 'rose', leadColor: [255, 0, 128], colors: [] },
        { name: 'white', leadColor: [255, 255, 255], colors: [] },
        
        { name: 'grey', leadColor: [235, 235, 235], colors: [] },
        { name: 'black', leadColor: [0, 0, 0], colors: [] },
    ];
    static sortWithClusters(colorsToSort, flatten=true) {
        const clusters = JSON.parse(JSON.stringify(Color.clustersGrouped));
        const mappedColors = colorsToSort.map((v)=>{return v instanceof Color ? v : new Color(v);});
        mappedColors.forEach((color) => {
            let minDistance;
            let minDistanceClusterIndex;
            clusters.forEach((cluster, clusterIndex) => {
                const colorRgbArr = [color.r, color.g, color.b];
                const distance = Vector3D.distanceBetween(colorRgbArr, cluster.leadColor);
                if (typeof minDistance === 'undefined' || minDistance > distance) {
                    minDistance = distance;
                    minDistanceClusterIndex = clusterIndex;
                }
            });
            clusters[minDistanceClusterIndex].colors.push(color);
        });
        clusters.forEach((cluster) => {
            const dim = 0;//['white', 'grey', 'black'].includes(cluster.name) ? 2 : 1; // hsl,  2 = l, 1 = s
            cluster.colors = this.oneDimensionSorting(cluster.colors, dim)
        });
        if (flatten) {
            clusters.forEach(cl=>{
                cl.colors.forEach(c=>c.cluster=cl.name);
            })
            return clusters.reduce((acc, cluster) => {
                return acc.concat(cluster.colors);
            }, []);
        }
        return clusters;
    }
    static oneDimensionSorting(colors, dim) {
        return colors.sort((colorA, colorB) => {
            if (colorA.hsl[dim] < colorB.hsl[dim]) {
                return -1;
            } else if (colorA.hsl[dim] > colorB.hsl[dim]) {
                return 1;
            } else {
                return 0;
            }
        });
    }
}
class Vector3D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static distanceBetween(a, b) { // measure distance between two points
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
    }
}
function sortColors(hexArray,asObject=false) {
    var colors = [];
    hexArray.forEach(v => {
        colors.push(new Color(v));
    });
    
    /*
    colors.sort((a, b) => {
        return a.luma - b.luma;
    });
    colors.sort((a, b) => {
        return a.chroma - b.chroma;
    });
    */
    colors = Color.sortWithClusters(colors)
    if (asObject){
        return colors;
    }
    return colors.map(v => {
        return v.hex;
    });
};