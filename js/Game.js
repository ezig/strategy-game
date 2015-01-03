// BREADTH FIRST SEARCH THEN FLOOD FILL

var grid = [];
var path = [];
var drawn = [];
var map = [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,2,2,2,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1],
           [1,1,2,2,2,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1],
           [1,1,2,2,2,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1],
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
                tile.depth = Infinity;

                grid[i][j] = tile;
            }
        }

        var player = this.game.add.sprite(12 * 16, 1 * 16, 'tiles');
        player.frame = 1;
        player.anchor.setTo(-0.5,-0.5);
        player.scale.setTo(0.5);
        player.tint = 0x00FF00;
        player.row = 1;
        player.col = 12;
        player.moves = 5;
        player.range = 1;
        grid[player.row][player.col].containsPlayer = true;

        player.inputEnabled = true;
        player.events.onInputDown.add(this.drawRange, this, player);

        var player2 = this.game.add.sprite(144, 96, 'tiles');
        player2.frame = 1;
        player2.anchor.setTo(-0.5,-0.5);
        player2.scale.setTo(0.5);
        player2.tint = 0xFF00FF;
        player2.row = 6;
        player2.col = 9;
        player2.moves = 4;
        player2.range = 2;
        grid[player2.row][player2.col].containsPlayer = true;

        player2.inputEnabled = true;
        player2.events.onInputDown.add(this.drawRange, this, player2);

        //this.test();
    },

    neighbors: function (tile) {
        var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        var neighbors = [];

        var len = dirs.length
        for (var i = 0; i < dirs.length; i++)
        {
            var row = tile.row + dirs[i][0];
            var col = tile.col + dirs[i][1];
            if (row >= 0 && row <= grid.length - 1 && col >= 0 && col <= grid[0].length - 1) {
                neighbors.push(grid[row][col]);
            }
        }
        return neighbors;
    },

    drawRange: function (player) {
        this.clearDraw(drawn);

        var playerTile = grid[player.row][player.col];

        range = this.getRange(player);

        var len = range.length;
        for (var i = 0; i < len; i++) {
            if (range[i].depth <= player.moves) {
                range[i].tint = 0x0000FF;

                range[i].inputEnabled = true;
                range[i].events.onInputOver.add(function(tile, pointer) {
                    this.drawPath(tile, playerTile);
                }, this);

                if (!range[i].containsPlayer) {
                    range[i].events.onInputDown.add(function(tile, pointer) {
                        this.followPath(player);
                    }, this);
                }
            }
            else {
                range[i].tint = 0xFF0000;
            }
        };

        drawn = range;
    },

    drawPath: function (to, from) {
        this.clearPath();
        path = [];

        while(to != from) {
            path.push(to);
            to.tint = 0x00FF00;
            to = to.cameFrom;
        }

        from.tint = 0x00FF00;
    },

    clearPath: function () {
        var len = path.length;

        for (var i = 0; i < len; i++) {
            path[i].tint = 0x0000FF;
        }
    },

    // problem with clicking on player space
    followPath: function (player) {
        var next;
        var currentCost = 0;
        var playerTween = this.game.add.tween(player);

        this.clearPath();
        this.clearDraw(drawn);

        while (path.length > 0) {
            next = path.pop();

            playerTween.to({
            x: next.col * 16, y: next.row * 16
            }, 300 * Math.max(next.cost, currentCost), Phaser.Easing.Linear.None);

            currentCost = next.cost;
        }

        grid[player.row][player.col].containsPlayer = false;
        player.row = next.row;
        player.col = next.col;
        grid[player.row][player.col].containsPlayer = true;
        playerTween.start();
    },

    getRange: function (player) {
        path = [];
        var visited = [];
        var frontier = [];

        var tile = grid[player.row][player.col];
        tile.depth = 0;

        frontier.push(tile);
        visited.push(tile);

        while (frontier.length != 0) {
            // get the first tile in the queue
            var current = frontier.shift();
            if (visited.indexOf(current) == -1) {
                visited.push(current);
            }

            // get all of the neighbors of the current tile
            var neighbors = this.neighbors(current);
            var len = neighbors.length;

            for (var i = 0; i < len; i++) {

                var nextDepth = current.depth + Math.max(neighbors[i].cost, current.cost);

                if (neighbors[i].isObstacle || nextDepth > player.moves) {
                    nextDepth = Math.max(current.depth + 1, player.moves + 1);
                    if (nextDepth > player.moves + player.range) {
                        continue;
                    }
                }

                if (nextDepth < neighbors[i].depth) {
                    neighbors[i].depth = nextDepth;
                    neighbors[i].cameFrom = current;
                    frontier.push(neighbors[i]);
                }
            }
        }

        return visited;
    },

    clearDraw: function (tiles) {
        var len = tiles.length;
        for (var i = 0; i < len; i++) {
            tiles[i].depth = Infinity; 
            tiles[i].tint = 0xFFFFFF;
            tiles[i].events.onInputOver.removeAll();
            tiles[i].events.onInputDown.removeAll();
        }
    },

    test: function () {
        var player = {};
        player.row = 6;
        player.col = 9;
        player.range = 1;
        player.moves = 1;
        this.getRange(player);
        assert(ranges["move"].sort == [grid[6][9],grid[7][9],grid[5][9],grid[6][8],grid[6][10]].sort);
        // assert(ranges["attack"].sort ==
        //  [grid[8][9],grid[7][10],grid[7][8],grid[6][7],grid[6][11],grid[5][8],grid[5][10]].sort);
    },

};

function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";

        throw message;
    }
}
