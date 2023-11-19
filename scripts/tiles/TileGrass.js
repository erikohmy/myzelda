class TileGrass extends TileEdged {
    dig = true;

    getSheet() {
        return this.game.spritesheets.overworld;
    }
}