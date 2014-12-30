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
                tile.row = i;
                tile.col = j;

                grid[i][j] = tile;
            }
        }

        grid[1][10].tint = 0x00FF00;
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
                if (!grid[row][col].isObstacle)
                {
                    neighbors.push(grid[row][col]);
                }
            }
        }

        return neighbors;
    },

    drawMoveRange: function (moves, tile) {
        var frontier = [];
        frontier.push(tile);
        tile.visited = true;
        tile.depth = 0;

        while (frontier.length != 0) {
            var current = frontier.shift();
            
            if (current.depth > moves) {
                current.tint = 0xFF0000;
                continue;
            }

            if (current.depth != 0) {
                current.tint = 0x0000FF;
            }

            var neighbors = this.neighbors(current);
            var len = neighbors.length;

            for (var i = 0; i < len; i++) {
                if (!neighbors[i].visited) {
                    frontier.push(neighbors[i]);
                    neighbors[i].depth = current.depth + current.cost;
                    neighbors[i].visited = true;
                }
            }

        }
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
