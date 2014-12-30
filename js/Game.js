var grid = [];
var frontier = [];

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
                tile.row = i;
                tile.col = j;

                grid[i][j] = tile;
            }
        }

        frontier.push(grid[1][10]);

        grid[1][10].tint = 0xFF0000;
        this.drawMoveRange(4,grid[1][10]);

    },

    neighbors: function (tile) {
        var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        var neighbors = [];

        var len = dirs.length
        for (var i = 0; i < dirs.length; i++)
        {
            var row = tile.row + dirs[i][0];
            var col = tile.col + dirs[i][1];
            if (row >= 0 && row <= grid.length - 1 && col >= 0 && col <= grid[0].length) {
                neighbors.push(grid[row][col]);
            }
        }

        return neighbors;
    },

    drawMoveRange: function (moves, tile) {
        if (tile.row < 0 || tile.row > grid.length - 1 || tile.col < 0 || tile.col > grid[0].length) {
            return;
        }
        if (tile.isObstacle) {
            return;
        }

        if (tile.tint != 0xFF0000) {
            tile.tint = 0x0000FF;
        }

        moves -= tile.cost;

        if (moves < 0) {
            return;
        }

        console.log(this.neighbors(tile));
        var neighbors = this.neighbors(tile);
        var len = neighbors.length;
        for (var i = 0; i < len; i++) {
            this.game.time.events.add(Phaser.Timer.SECOND, this.drawMoveRange, this, moves, neighbors[i]);  
        }
        
        // this.game.time.events.add(Phaser.Timer.SECOND, this.drawMoveRange, this, moves, row + 1, col);
        // this.game.time.events.add(Phaser.Timer.SECOND, this.drawMoveRange, this, moves, row, col - 1);
        // this.game.time.events.add(Phaser.Timer.SECOND, this.drawMoveRange, this, moves, row, col + 1);

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
