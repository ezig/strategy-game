var Strategy = Strategy || {};

Strategy.Boot = function(){};

Strategy.Boot.prototype = {

	init: function() {
		// disable multi touch
		this.input.maxPointers = 1;

		 //  Phaser will automatically pause if the browser tab the game is in loses focus. You can disable that here:
        this.stage.disableVisibilityChange = true;

        if (this.game.device.desktop)
        {
            //  desktop specific settings go in here
            this.scale.pageAlignHorizontally = true;
            this.scale.pageAlignVertically = true;
        }
        else
        {
            //  Same goes for mobile settings.
            //  In this case we're saying "scale the game, no lower than 480x260 and no higher than 1024x768"
            this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            this.scale.setMinMax(480, 260, 1024, 768);
            this.scale.forceLandscape = true;
            this.scale.pageAlignHorizontally = true;
        }

    },

	preload: function() {
		// preloader assets
		//this.load.image('preloadBar', 'assets/images/preloader-bar.png');
	},
	create: function() {
		// start the preloarder as soon as the assets are loaded
		this.state.start('Preload');
	}
};