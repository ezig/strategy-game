var Strategy = Strategy || {};

Strategy.game = new Phaser.Game(320, 240, Phaser.AUTO, '');
Strategy.game.state.add('Boot', Strategy.Boot);
Strategy.game.state.add('Preload', Strategy.Preload);
Strategy.game.state.add('MainMenu', Strategy.MainMenu);
Strategy.game.state.add('Game', Strategy.Game);

Strategy.game.state.start('Boot');