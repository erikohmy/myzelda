class TileWallRoot extends TileWall {
    spriteOffsetX = 8;
    getSheet() {
        return this.game.spritesheets.buildings;
    }
}