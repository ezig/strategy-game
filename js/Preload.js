Strategy.Preload = function(){};

Strategy.Preload.prototype = {
	preload: function() {
		// this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY,
		// 	'preloadBar');
		// this.preloadBar.anchor.setTo(0.5, 0.5);
		// this.load.setPreloadSprite(this.preloadBar);

		// load assets
		this.load.spritesheet('tiles', 'assets/images/tiles.png', 16, 16, 3);
		this.load.image('healthbar', 'assets/images/healthbar.png');
	},
	
	create: function() {
		this.game.state.start('Game');

	},

};