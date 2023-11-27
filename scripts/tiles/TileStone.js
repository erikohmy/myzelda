class TileStone extends TileBase {
    spriteOffsetX = 8;
    spriteOffsetY = 14;
    solid = true;
    liftable = true;
    tileBeneath = "dug";

    getSheet() {
        return this.game.spritesheets.overworld;
    }
}