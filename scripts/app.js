window.addEventListener('load', () => {
    const game = new Game(document.querySelector('#game'));
    window.game = game;
    game.load();
});