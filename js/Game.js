var grid = [];
var map = [[1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],];

Strategy.Game = function(){};

Strategy.Game.prototype = {

    create: function () {

        var cols = this.game.width / 16;
        var rows = this.game.height / 16;

        for (var i = 0; i < rows; i++) {
            grid[i] = [];
            for (var j = 0; j < cols; j++) {
                var tile = this.game.add.sprite(j * 16, i * 16, 'tiles');
                tile.frame = map[i][j];
                tile.isObstacle = !map[i][j];
                tile.cost = map[i][j];

                grid[i][j] = tile;
            }
        }

        grid[1][10].tint = 0xFF0000;
        this.drawMoveRange(4,1,10);

    },

    drawMoveRange: function (moves, row, col) {
        if (row < 0 || row > grid.length - 1 || col < 0 || col > grid[0].length)
        {
            return;
        }
        if (grid[row][col].isObstacle)
        {
            return;
        }

        if (grid[row][col].tint != 0xFF0000)
        {
            grid[row][col].tint = 0x0000FF;
        }

        moves -= grid[row][col].cost;

        if (moves < 0)
        {
            return;
        }

        this.game.time.events.add(Phaser.Timer.SECOND, this.drawMoveRange, this, moves, row - 1, col);
        this.game.time.events.add(Phaser.Timer.SECOND, this.drawMoveRange, this, moves, row + 1, col);
        this.game.time.events.add(Phaser.Timer.SECOND, this.drawMoveRange, this, moves, row, col - 1);
        this.game.time.events.add(Phaser.Timer.SECOND, this.drawMoveRange, this, moves, row, col + 1);

        // this.drawMoveRange(moves, row - 1, col);
        // this.drawMoveRange(moves, row + 1, col);
        // this.drawMoveRange(moves, row, col - 1);
        // this.drawMoveRange(moves, row, col + 1);
    },

    update: function () {

        //  Honestly, just about anything could go here. It's YOUR game after all. Eat your heart out!

    },

    quitGame: function (pointer) {

        //  Here you should destroy anything you no longer need.
        //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

        //  Then let's go back to the main menu.
        this.state.start('MainMenu');

    }

};
