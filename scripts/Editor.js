class Editor {
    game;
    sprites;
    spriteImages = [];
    spriteImage;

    constructor(game) {
        this.game = game;
        this.buildSpritelist();
    }

    buildSpritelist() {
        let sprites = [];
        // for all the tiles
        let tileNames = Object.keys(this.game.tiles);
        tileNames.forEach(name => {
            let tile = this.game.tiles[name];
            let spriteNames = Object.keys(tile.sprites);
            sprites.push({
                name: name,
                type: "tile",
                class: tile.constructor.name,
                subtype: this.getTileSubtype(tile),
                sprites: spriteNames,
                variants: tile.variantNames,
                flags: this.getTileFlags(tile),
            });
            spriteNames.forEach(spritename => {
                this.spriteImages.push({
                    name: spritename,
                    image: tile.sprites[spritename]
                });
            });
        });
        this.sprites = sprites;
    }
    getTileFlags(tile) {
        return {
            solid: tile.solid,
            hole: tile.hole,
            swim: tile.swim,
            drown: tile.drown,
            wet: tile.wet,
            dig: tile.dig,
            collision: tile.hasCollision(),
        };
    }
    getTileSubtype(tile) {
        // tile, edged, wall, directional
        if (tile instanceof TileEdged) {
            return "edged";
        }
        if (tile instanceof TileWall) {
            return "wall";
        }
        if (tile instanceof TileAnimated4) {
            return "animated";
        }
        /*if (tile instanceof TileDirectional) {
            return "directional";
        }*/
        return "tile";
    }
    async buildSpriteSheet() {
        // width and height of sheet
        let size = Math.ceil(Math.sqrt(this.spriteImages.length));
        let canvas = document.createElement("canvas");
        canvas.width = size*16;
        canvas.height = size*16;
        let ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        this.spriteImages.forEach((sprite, i) => {
            let x = i%size;
            let y = Math.floor(i/size);
            ctx.drawImage(sprite.image, x*16, y*16);
        });
        let img = new Image();
        img.src = canvas.toDataURL();
        await img.decode();
        this.spriteImage = img;
        return img;
    }
    downloadSpriteSheet() {
        this.buildSpriteSheet().then(() => {
            downloadURI(this.spriteImage.src, "spritesheet.png");
        });
    }

    stop(save=true) {
        this.element.classList.remove('active');
        if(save) {
            let pre = "let space = game.world.currentSpace;\n";
            
            let codeToRun = pre+this.tileDataToCode();
            let fn = Function(codeToRun);
            fn();
        }
        this.game.resume();
    }

    async start() {
        this.game.pause();
        if (!this.element) {
            this.element = document.querySelector('.editor');
            this.grid = document.querySelector('.editor .grid');
            this.pallet = document.querySelector('.editor .pallet');
            this.buildPallet();
            this.buildGrid();
            this.element.classList.add('loading');

            let sheet = await this.buildSpriteSheet();
            this.buildCss();
            this.element.style.setProperty('--tile-sheet', `url(${sheet.src})`);
            this.element.style.setProperty('--tile-sheetwidth', `${sheet.width}px`);
            this.element.style.setProperty('--tile-sheetheight', `${sheet.height}px`);

            let copybtn = document.createElement('button');
            copybtn.innerText = "Copy to Clipboard";
            copybtn.classList.add('btn-edit-copy');
            copybtn.addEventListener('click', () => {
                this.copyToClipboard(this.tileDataToCode());
            });

            let savebtn = document.createElement('button');
            savebtn.innerText = "Save";
            savebtn.classList.add('btn-edit-save');
            savebtn.addEventListener('click', () => {
                game.saveEdit();
            });
            
            let cancelbtn = document.createElement('button');
            cancelbtn.innerText = "Cancel";
            cancelbtn.classList.add('btn-edit-cancel');
            cancelbtn.addEventListener('click', () => {
                game.saveEdit();
            });

            this.element.querySelector('.toolbar').appendChild(copybtn);
            this.element.querySelector('.toolbar').appendChild(savebtn);
            this.element.querySelector('.toolbar').appendChild(cancelbtn);
        } else {
            // clear data and grid
            this.clearData();
        }

        this.game.sound.play("appear_vanish");
        setTimeout(() => {
            this.element.classList.remove('loading');
            this.element.classList.add('active');
        }, 100);

        // load tile data from active space if there is one
        if (this.game.world.currentSpace) {
            this.setFromSpace(this.game.world.currentSpace);
        }
    }

    copyToClipboard(text) {
        navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
            if (result.state == "granted" || result.state == "prompt") {
                navigator.clipboard.writeText(text);
            } else {
                this.unsecuredCopyToClipboard(text)
            }
        }); 
    }
    unsecuredCopyToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute('name', 'clipboard');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Unable to copy to clipboard', err);
          alert('Unable to copy to clipboard. Please copy manually from console')
          console.log(text);
        }
        document.body.removeChild(textArea);
      }

    clearData() {
        let sizeX = 20;
        let sizeY = 16;
        this.tileData = new Array(sizeY);
        for (let y=0; y<sizeY; y++) {
            this.tileData[y] = new Array(sizeX);
            for (let x=0; x<sizeX; x++) {
                this.tileData[y][x] = null;
            }
        }
        this.grid.querySelectorAll('.tile').forEach(el => {
            el.className = el.className.replace(/\bsprite-\S+/g, '');
            el.classList.add('empty');
        });
    }

    setFromSpace(space) {
        this.clearData();
        let sizeX = space.size[0];
        let sizeY = space.size[1];
        let tiles = space.tiles;
        for (let y=0; y<sizeY; y++) {
            for (let x=0; x<sizeX; x++) {
                let index = y*sizeX+x;
                let tiledata = tiles[index];
                let classname = "sprite-"+tiledata.name;
                if (tiledata.edges) {
                    classname += "-" + tiledata.edges;
                }
                if (tiledata.variant) {
                    classname += "-" + tiledata.variant;
                }
                let el = this.grid.querySelector('.tile-'+x+'-'+y);
                
                el.classList.remove('empty');
                el.classList.add(classname);
                
                this.tileData[y][x] = tiledata;
            }
        }
    }

    buildCss() {
        let css = "";
        let prefix = ".editor .tile";
        let perrow = Math.ceil(Math.sqrt(this.spriteImages.length));
        this.spriteImages.forEach((sprite, i) => {
            let x = i%perrow;
            let y = Math.floor(i/perrow);
            css += prefix + `.sprite-${sprite.name} { background-position: -${x*16*3}px -${y*16*3}px; }\n`;
        });
        let element = document.createElement("style");
        element.innerHTML = css;
        document.head.appendChild(element);
    }

    buildPallet() {
        this.sprites.forEach(sprite => {
            let el = document.createElement("div");
            el.classList.add("tile", 'sprite-'+sprite.sprites[0]);
            el.setAttribute('data-name', sprite.name);
            el.setAttribute('data-type', sprite.type);
            el.setAttribute('data-class', sprite.class);
            el.setAttribute('data-subtype', sprite.subtype);
            el.setAttribute('title', sprite.name);
            this.pallet.appendChild(el);

            if (sprite.sprites.length > 1 && sprite.subtype !== 'animated') {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    el.querySelector('.variants .tile').click();
                });

                // all variants
                let variants = document.createElement("div");
                variants.classList.add("variants");
                let varwrap = document.createElement("div");
                varwrap.classList.add("variants-wrap");
                variants.appendChild(varwrap);
                sprite.sprites.forEach(spritename => {
                    let el = document.createElement("div");
                    el.classList.add("tile", 'sprite-'+spritename);
                    el.setAttribute('title', spritename);
                    varwrap.appendChild(el);

                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        let prefix = sprite.name + "-";
                        let variant = spritename.substring(prefix.length);
                        this.paletteSelection =  {'name': sprite.name};
                        this.paletteSelection.class = 'sprite-'+spritename;
                        if (sprite.subtype === "edged") {
                            // set edges, and remove them from selection
                            if(this.variantIsEdge(variant)) {
                                this.paletteSelection.edges = variant;
                                variant = "";
                            } else {
                                let parts = variant.split("-");
                                if (parts.length > 1) { // we probably have an edge!
                                    this.paletteSelection.edges = parts[0];
                                    variant = parts[1];
                                }
                            }
                        }
                        if (variant) {
                            this.paletteSelection.variant = variant;
                        }
                    });
                });
                el.appendChild(variants);
            } else {
                el.addEventListener('click', () => {
                    this.paletteSelection = {'name': sprite.name, class: 'sprite-'+sprite.sprites[0]}
                });
            }
        });
    }

    variantIsEdge(variant) {
        let edges = [
            't',
            'r',
            'b',
            'l',
            'tr',
            'rb',
            'bl',
            'tl',
            'tb',
            'rl',
            'trb',
            'tbl',
            'trl',
            'rbl',
            'trbl'
        ];
        return variant && edges.indexOf(variant) !== -1;
    }

    buildGrid() {
        let tiles = [];
        let sizex = 20; // 24x24 grid
        let sizey = 16;
        for (let y=0; y<sizey; y++) {
            for (let x=0; x<sizex; x++) {
                let el = document.createElement("div");
                el.classList.add("tile", "empty", 'tile-'+x+'-'+y);
                let tile = {
                    x: x,
                    y: y,
                    element: el
                }
                this.grid.appendChild(el);
                tiles.push(tile);
                el.addEventListener('click', () => {
                    if(this.paletteSelection) {
                        let c = this.paletteSelection.class; 
                        // remove all classes starting with sprite-
                        el.className = el.className.replace(/\bsprite-\S+/g, '');
                        el.classList.remove('empty');
                        el.classList.add(c);
                        let tiledata = {
                            name: this.paletteSelection.name,
                        };
                        if (this.paletteSelection.variant) {
                            tiledata.variant = this.paletteSelection.variant;
                        }
                        if (this.paletteSelection.edges) {
                            tiledata.edges = this.paletteSelection.edges;
                        }
                        this.tileData[y][x] = tiledata;
                    }
                });
            }
        }
        this.tileData = new Array(sizey);
        for (let y=0; y<sizey; y++) {
            this.tileData[y] = new Array(sizex);
            for (let x=0; x<sizex; x++) {
                this.tileData[y][x] = null;
            }
        }
    }

    tileDataToCode() {
        let maps = [];
        let stringversion = new Array(this.tileData.length);
        for (let y=0; y<this.tileData.length; y++) {
            stringversion[y] = new Array(this.tileData[y].length);
        }

        // find all unique tiles used, and add to maps
        this.tileData.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile) {
                    let name = tile.name;
                    let variant = tile.variant;
                    let edges = tile.edges;
                    let map = maps.findIndex(m => m.name === name && m.variant === variant && m.edges === edges);
                    let id = null;
                    if (map === -1) {
                        id = maps.length.toString(16);
                        while (id.length < 2) {
                            id = "0"+id;
                        }
                        map = {
                            name: name,
                            variant: variant,
                            edges: edges,
                            id: id,
                        };
                        maps.push(map);
                    } else {
                        id = map.toString(16);
                        while (id.length < 2) {
                            id = "0"+id;
                        }
                    }
                    stringversion[y][x] = id;
                }
            });
        });

        let code = "space.setTiles({\n";
        maps.forEach(map => {
            code += "    '"+map.id+"': {name:'" + map.name+"', ";
            if (map.edges) {
                code += "edges: '"+map.edges+"', ";
            }
            if (map.variant) {
                code += "variant: '"+map.variant+"', ";
            }
            code = code.substring(0, code.length-2);
            code += "},\n";
        });
        code += "}, [\n";
        stringversion.forEach(row => {
            let r = row.join("");
            if (r) {
                code += "    '"+r+"',\n";
            }
        });
        code += "]);"

        return code;
    }
}