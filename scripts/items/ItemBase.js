class ItemBase { // inventory item that the player uses with action buttons
    game;

    constructor(game) {
        this.game = game;
    }

    get name() {
        return "baseItem";
    }
    
    get description() {
        return "A base item";
    }
    
    // todo: comment these out, so nothing runs if they arent defined
    actionPress() {} // called when action button is pressed
    actionRelease() {} // called when action button is released
    onEquip() {} // called when the item is equipped
    onUnequip() {} // called when the item is unequipped
    whileEquipped() {} // called every tick while the item is equipped
    playerBusy() {} // if this returns true, player cant move or do anything else
    animation() {} // if this doesnt return anything, or returns undefined, player handles animation, otherwise item does it! 
}