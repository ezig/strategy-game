var grid = [];
var ranges = [];
var path = [];
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
           [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],];

Strategy.Game = function(){};

Strategy.Game.prototype = {

    create: function () {
        this.visited = [];

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

        var player = this.game.add.sprite(12 * 16, 1 * 16, 'tiles');
        player.frame = 1;
        player.anchor.setTo(-0.5,-0.5);
        player.scale.setTo(0.5);
        player.tint = 0x00FF00;
        player.row = 1;
        player.col = 12;
        player.moves = 10;
        player.range = 1;

        player.inputEnabled = true;
        player.events.onInputDown.add(this.drawRange, this, player);

        var player2 = this.game.add.sprite(144, 96, 'tiles');
        player2.frame = 1;
        player2.anchor.setTo(-0.5,-0.5);
        player2.scale.setTo(0.5);
        player2.tint = 0xFF00FF;
        player2.row = 6;
        player2.col = 9;
        player2.moves = 1;
        player2.range = 1;

        player2.inputEnabled = true;
        player2.events.onInputDown.add(this.drawRange, this, player2);

        this.test();
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
        this.clearDraw();
        this.findRange(player);

        var playerTile = grid[player.row][player.col];

        var len = ranges["move"].length;
        for (var i = 0; i < len; i++) {
            ranges["move"][i].tint = 0x0000FF;
            ranges["move"][i].inputEnabled = true;
            ranges["move"][i].events.onInputOver.add(function(tile, pointer) {
                this.drawPath(tile, playerTile);
            }, this);
            ranges["move"][i].events.onInputDown.add(function(tile, pointer) {
                this.followPath(player);
            }, this);
        };

        var len = ranges["attack"].length;
        for (var i = 0; i < len; i++) {
            ranges["attack"][i].tint = 0xFF0000;
        };
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
        this.clearDraw();

        while (path.length > 0) {
            next = path.pop();

            playerTween.to({
            x: next.col * 16, y: next.row * 16
            }, 300 * Math.max(next.cost, currentCost), Phaser.Easing.Linear.None);

            currentCost = next.cost;
        }
        player.row = next.row;
        player.col = next.col;

        playerTween.start();
    },

    findRange: function (player) {
        path = [];
        var visited = [];
        var frontier = [];
        var attack = [];

        var tile = grid[player.row][player.col];
        tile.depth = 0;

        frontier.push(tile);
        visited.push(tile);

        var moves = player.moves;
        var range = player.range;

        ranges["move"] = [];
        ranges["attack"] = [];

        while (frontier.length != 0) {
            // get the first tile in the queue
            var current = frontier.shift();

            // if we're with the movement range, show a blue tile
            if (current.depth <= moves) {
                ranges["move"].push(current);
            }
            // if we're outside of the movement range but within the attack range tile,
            // show a red tile
            else if (current.depth <= moves + range) {
                ranges["attack"].push(current);
            }

            // get all of the neighbors of the current tile
            var neighbors = this.neighbors(current);
            var len = neighbors.length;

            for (var i = 0; i < len; i++) {
                // if we've already been to this tile, ignore it
                if (visited.indexOf(neighbors[i]) == -1) {

                    if (!neighbors[i].isObstacle) {
                        // within the movement range, we take
                        // the cost (terrain type) of moving INTO a
                        // tile when we consider the "depth" of that
                        // tile from the starting point
                        if (current.depth < moves) {
                            neighbors[i].depth = current.depth + Math.max(neighbors[i].cost, current.cost);
                        } 
                        // outside of the movement range but within the attack range,
                        // all terrain costs the same
                        else {
                            neighbors[i].depth = current.depth + 1;
                        }

                        // add the neighbor to the queue and to the array of visited tiles
                        // as long as it is within the depth-limit of moves + range 
                        // (the max attack range after maximum movement)
                        if (neighbors[i].depth <= moves + range)
                        {
                            neighbors[i].cameFrom = current;
                            frontier.push(neighbors[i]);
                            visited.push(neighbors[i]);
                        }
                    } 
                    // if we encounter an obstacle in the movement range and our
                    // character has a ranged attack, keep track of the obstacle
                    // so that later we can see if there are any oppurtunities
                    // to attack over the wall
                    else if (range > 1) {
                        neighbors[i].depth = current.depth + 1;
                        attack.push(neighbors[i]);
                        visited.push(neighbors[i]);
                    }
                }
            }
        }

        this.visited = visited;

        // if we encountered obstacles as a ranged character in the movement range,
        // we need to check if there are any squares in the attack range
        // that are reachable by attacking over an obstacle
        // we will attempt to flood fill any non-obstacle spaces within the attack
        // range - 1 from the encountered obstacle (minus 1 because the obstacle itself
        // already represents 1 range away from where the character can stand)
        var len = attack.length;
        for (var i = 0; i < len; i++) {
            this.attackFill(attack[i], (moves + range) - attack[i].depth)
        }

        this.visited = visited;
    },

    attackFill: function (tile, range) {
        if (range < 0) {
            return;
        }

        if (this.visited.indexOf(tile) == -1 && !tile.isObstacle) {
            ranges["attack"].push(tile);
            this.visited.push(tile);
        }

        var neighbors = this.neighbors(tile);
        var len = neighbors.length;

        for (var i = 0; i < len; i++) {
            this.attackFill(neighbors[i], range - 1);
        }

    },

    clearDraw: function () {
        var len = this.visited.length;

        for (var i = 0; i < len; i++) {
            this.visited[i].tint = 0xFFFFFF;
            this.visited[i].events.onInputOver.removeAll();
            this.visited[i].events.onInputDown.removeAll();
        }
    },

    test: function () {
        var player = {};
        player.row = 6;
        player.col = 9;
        player.range = 1;
        player.moves = 1;
        this.findRange(player);
        assert(ranges["move"].sort == [grid[6][9],grid[7][9],grid[5][9],grid[6][8],grid[6][10]].sort);
        assert(ranges["attack"].sort ==
         [grid[8][9],grid[7][10],grid[7][8],grid[6][7],grid[6][11],grid[5][8],grid[5][10]].sort);
    },

};

function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";

        throw message;
    }
}
