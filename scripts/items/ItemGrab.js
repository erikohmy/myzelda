class ItemGrab extends ItemBase {
    levels = 2;

    constructor(game) {
        super(game);
        // get level, from save data
        this.level = 1; // todo: save data
        this.name = this.level == 1 ? "Power Bracelet" : "Titan's Mitt";
        this.description = "Roc's Feather\nA nice lift.";

        this.holding = false;
    }

    actionPress() {
        if(this.holding) return;
        this.holding = true;
        console.log("holding");
    }
    actionRelease() {
        if(!this.holding) return;
        this.holding = false;
        console.log("stopped holding");
    }
    renderIcon(ctx, x, y) { // icon for the inventory, and hotbar
        let sheet = this.game.spritesheets.items;
        if (this.level == 1) {
            sheet.drawSprite(ctx, 4, 2, x, y, 1, 2); // bracelet
            sheet.drawSprite(ctx, 9, 2, x+8, y+8, 1, 1); // l-
            sheet.drawSprite(ctx, 9, 3, x+16, y+8, 1, 1); // 1
        } else {
            sheet.drawSprite(ctx, 5, 2, x, y, 1, 2); // glove
            sheet.drawSprite(ctx, 9, 2, x+8, y+8, 1, 1); // l-
            sheet.drawSprite(ctx, 9, 4, x+16, y+8, 1, 1); // 1
        }
        
    }
}