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
        player.moves = 4;
        player.range = 1;

        player.inputEnabled = true;
        player.events.onInputDown.add(this.drawMoveRange, this, player);

        var player2 = this.game.add.sprite(144, 96, 'tiles');
        player2.frame = 1;
        player2.anchor.setTo(-0.5,-0.5);
        player2.scale.setTo(0.5);
        player2.tint = 0xFF00FF;
        player2.row = 6;
        player2.col = 9;
        player2.moves = 3;
        player2.range = 5;

        player2.inputEnabled = true;
        player2.events.onInputDown.add(this.drawMoveRange, this, player2);
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

    drawMoveRange: function (player) {
        this.clearDraw();

        var tile = grid[player.row][player.col];
        tile.visited = true;
        tile.depth = 0;

        var visited = [];
        var frontier = [];
        var attack = [];

        frontier.push(tile);

        var moves = player.moves;
        var range = player.range;

        while (frontier.length != 0) {
            var current = frontier.shift();

            // if we
            if (current.depth <= moves) {
                current.tint = 0x0000FF;
            }
            // if we're outside of the movement range, 
            else if (current.depth <= moves + range) {
                current.tint = 0xFF0000;
            }
            // we went too far, so we didn't really mean to visit this
            // this is important later for checking if you can shoot through a wall
            // because we may need to recheck this tile
            // else {
            //     visited.splice(visited.indexOf(current), 1);
            //     continue;
            // }

            var neighbors = this.neighbors(current);
            var len = neighbors.length;

            for (var i = 0; i < len; i++) {
                if (visited.indexOf(neighbors[i]) == -1) {
                    if (!neighbors[i].isObstacle) {
                        if (current.depth < moves) {
                            neighbors[i].depth = current.depth + neighbors[i].cost;
                        } else {
                            neighbors[i].depth = current.depth + 1;
                        }

                        if (neighbors[i].depth <= moves + range)
                        {
                            frontier.push(neighbors[i]);
                            visited.push(neighbors[i]);
                        }
                    } 
                    else if (current.depth <= moves && range > 1) {
                        neighbors[i].depth = moves + 1;
                        attack.push(neighbors[i]);
                        visited.push(neighbors[i]);
                    }
                }
            }
        }

        if (attack.length > 0) {
            while (attack.length != 0) {
                var current = attack.shift();

                if (current.depth <= moves + range) {
                    if (!current.isObstacle) {
                        current.tint = 0xFF0000;
                    }
                } 
                else {
                    continue;
                }

                var neighbors = this.neighbors(current);
                var len = neighbors.length;

                for (var i = 0; i < len; i++) {
                    if (visited.indexOf(neighbors[i]) == -1) {
                        neighbors[i].depth = current.depth + 1;
                        console.log(neighbors[i].row, neighbors[i].col);
                        if (neighbors[i].depth <= moves + range)
                        {
                            attack.push(neighbors[i]);
                            visited.push(neighbors[i]);
                        }
                    }
                }
            }
        }

        this.visited = visited;
    },

    clearDraw: function () {
        var len = this.visited.length;

        for (var i = 0; i < len; i++) {
            this.visited[i].tint = 0xFFFFFF;
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
