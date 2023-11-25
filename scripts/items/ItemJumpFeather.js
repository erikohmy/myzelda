class ItemJumpFeather extends ItemBase {
    constructor(game) {
        super(game);
        this.name = "Roc's Feather";
        this.description = "Roc's Feather\nA nice lift.";
    }
    actionPress() {
        this.game.player.jump();
    }
    renderIcon(ctx, x, y) { // icon for the inventory, and hotbar
        let sheet = this.game.spritesheets.items;
        sheet.drawSprite(ctx, 0, 2, x, y, 1, 2);
    }
}