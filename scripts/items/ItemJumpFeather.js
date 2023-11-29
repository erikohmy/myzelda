class ItemJumpFeather extends ItemBase {
    constructor(game) {
        super(game);
        this.jumped = false;
    }
    get name() {
        return "Roc's Feather";
    }
    get description() {
        return "Roc's Feather\nA nice lift.";
    }
    actionPress() {
        let player = this.game.player;
        if (!player.onHole) {
            player.jump();
            this.jumped = true;
        }
    }
    landed() {
        this.jumped = false;
    }
    renderIcon(ctx, x, y) { // icon for the inventory, and hotbar
        let sheet = this.game.spritesheets.items;
        sheet.drawSprite(ctx, 0, 2, x, y, 1, 2);
    }
}