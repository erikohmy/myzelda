class TileCliff extends TileBase {
    solid = true;

    variants = 2;
    variantNames = [
        'present',
        'past'
    ];

    spriteMap = [
        ["top", "x01", "col", "cor", "xo2", "lel", "lmh", "ler", "let"], 
        ["bo1", "bo2", "sml", "smr", "ctl", "ctr", "ltl", "ltr", "lmv"],
        ["lef", "rig", "sbl", "sbr", "cbl", "cbr", "lbl", "lbr", "leb"] 
    ];

    getSheet() {
        return this.game.spritesheets.cliffs;
    }

    defineTiles() {
        let tiles = {};

        // tiles[this.name+""] = ["", "", "", ""];
        tiles[this.name+"-01"] = ["top", "top", "lmh", "lmh"];
        tiles[this.name+"-02"] = ["col", "top", "lef", "ltl"];
        tiles[this.name+"-03"] = ["cbr", "lmv", "lmh", "lbr"];
        tiles[this.name+"-04"] = ["lmv", "cbl", "lbl", "lmh"];
        tiles[this.name+"-05"] = ["top", "cor", "ltr", "rig"];
        tiles[this.name+"-06"] = ["lel", "lmh", "sml", "bo1"];
        tiles[this.name+"-07"] = ["lmh", "ler", "bo2", "smr"];
        tiles[this.name+"-08"] = ["lef", "lmv", "lef", "leb"];
        tiles[this.name+"-09"] = ["lmv", "rig", "leb", "rig"];
        tiles[this.name+"-10"] = ["col", "top", "lef", "lel"];
        tiles[this.name+"-11"] = ["top", "cor", "ler", "rig"];
        tiles[this.name+"-12"] = ["col", "cor", "lef", "let"];
        tiles[this.name+"-13"] = ["col", "cor", "let", "rig"];
        tiles[this.name+"-14"] = ["sml", "smr", "sml", "smr"];

        tiles[this.name+"-15"] = ["lmh", "lmh", "bo1", "bo2"];
        tiles[this.name+"-16"] = ["lef", "lbl", "sbl", "bo1"];
        tiles[this.name+"-17"] = ["lmh", "ltr", "ctr", "lmv"];
        tiles[this.name+"-18"] = ["ltl", "lmh", "lmv", "ctl"];
        tiles[this.name+"-19"] = ["lbr", "rig", "bo2", "sbr"];
        tiles[this.name+"-20"] = ["sml", "bo1", "sml", "bo2"];
        tiles[this.name+"-21"] = ["bo2", "smr", "bo1", "smr"];
        tiles[this.name+"-22"] = ["lef", "let", "lef", "lmv"];
        tiles[this.name+"-23"] = ["let", "rig", "lmv", "rig"];
        tiles[this.name+"-24"] = ["lef", "lel", "sml", "bo2"];
        tiles[this.name+"-25"] = ["ler", "rig", "bo2", "smr"];
        tiles[this.name+"-26"] = ["lef", "leb", "sml", "smr"];
        tiles[this.name+"-27"] = ["leb", "rig", "sml", "smr"];
        tiles[this.name+"-28"] = ["sml", "smr", "sbl", "sbr"];

        tiles[this.name+"-29"] = ["sml", "bo1", "sbl", "bo2"];
        tiles[this.name+"-30"] = ["bo2", "smr", "bo1", "sbr"];
        tiles[this.name+"-31"] = ["lef", "lmv", "lef", "lmv"];
        tiles[this.name+"-32"] = ["lmv", "rig", "lmv", "rig"];
        tiles[this.name+"-33"] = ["bo2", "bo1", "bo1", "bo2"];
        tiles[this.name+"-34"] = ["lel", "lmh", "sbl", "bo2"];
        tiles[this.name+"-35"] = ["lmh", "ler", "bo1", "sbr"];
        tiles[this.name+"-36"] = ["lel", "lmh", "bo1", "bo2"];
        tiles[this.name+"-37"] = ["lmh", "ler", "bo1", "bo2"];
        tiles[this.name+"-38"] = ["lef", "leb", "sml", "bo2"];
        tiles[this.name+"-39"] = ["leb", "rig", "bo1", "smr"];
        tiles[this.name+"-40"] = ["lef", "lel", "sbl", "bo2"];
        tiles[this.name+"-41"] = ["ler", "rig", "bo1", "sbr"];
        tiles[this.name+"-42"] = ["cbr", "lmv", "lel", "lbr"];

        tiles[this.name+"-43"] = ["col", "top", "lel", "lmh"];
        tiles[this.name+"-44"] = ["top", "cor", "lmh", "ler"];
        tiles[this.name+"-45"] = ["lef", "lbl", "sml", "bo2"];
        tiles[this.name+"-46"] = ["lbr", "rig", "bo2", "smr"];
        tiles[this.name+"-47"] = ["x01", "x01", "x01", "x01"]; // empty
        tiles[this.name+"-48"] = ["top", "top", "lel", "lmh"];
        tiles[this.name+"-49"] = ["top", "top", "lmh", "ler"];
        tiles[this.name+"-50"] = ["col", "top", "lef", "ltl"];
        tiles[this.name+"-51"] = ["top", "cor", "ltr", "rig"];
        tiles[this.name+"-52"] = ["ctr", "let", "lef", "lmv"];
        tiles[this.name+"-53"] = ["let", "ctl", "lmv", "rig"];
        tiles[this.name+"-54"] = ["lel", "ltr", "ctr", "lmv"];
        tiles[this.name+"-55"] = ["ltl", "ler", "lmv", "ctl"];
        tiles[this.name+"-56"] = ["lmv", "cbl", "lbl", "ler"];

        tiles[this.name+"-57"] = ["lef", "lbl", "sml", "bo1"];
        tiles[this.name+"-58"] = ["lbr", "rig", "bo2", "smr"];

        return tiles;
    }
}