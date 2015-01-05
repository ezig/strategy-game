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
var units = [{moves: 5, range: 1, color: 0x00FF00, row: 1, col: 12, team: 'player'},
             {moves: 4, range: 2, color: 0xFF00FF, row: 6, col: 9, team: 'player'},
             {moves: 2, range: 1, color: 0xFF0000, row: 2, col: 2, team: 'enemy'}]
var playerUnits = [];
var enemyUnits = [];

//var turn = 'player';

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

        var len = units.length;
        for (var i = 0; i < len; i++) {
            var unit = this.createUnit(units[i]);

            if (units[i].team == 'player') {
                playerUnits.push(unit);
            } else {
                enemyUnits.push(unit);
            }
        }

        this.playerTurn();
    },

    playerTurn: function () {
        turn = 'player';
        var len = playerUnits.length;
        for (var i = 0; i < len; i++) {
            var unit = playerUnits[i]
            unit.events.onInputDown.add(this.drawRange, this);
        }
    },

    enemyTurn: function () {
        turn = 'enemy';
        var unit = enemyUnits[0];
        var neighbors = this.neighbors(grid[unit.row][unit.col]);
        var tile = neighbors[Math.floor(Math.random() * neighbors.length)];
        path = [tile];
        this.followPath(unit);
    },

    createUnit: function (unit) {
        var unitSprite = this.game.add.sprite(16 * unit.col, 16 * unit.row, 'tiles');
        unitSprite.frame = 1;
        unitSprite.anchor.setTo(-0.5,-0.5);
        unitSprite.scale.setTo(0.5);
        unitSprite.tint = unit.color;
        unitSprite.row = unit.row;
        unitSprite.col = unit.col;
        unitSprite.moves = unit.moves;
        unitSprite.range = unit.range;
        unitSprite.team = unit.team;

        this.addHealthBar(unitSprite);

        if (unitSprite.team == 'player') {
            grid[unit.row][unit.col].containsPlayer = true;
            unitSprite.inputEnabled = true;
        } else {
            grid[unit.row][unit.col].containsEnemy = true;
        }    

        return unitSprite;
    },

    addHealthBar: function (unit) {
        var healthbarbg = this.game.add.sprite(0, -10, 'healthbar');
        healthbarbg.anchor.setTo(-0.5,-0.5);
        healthbarbg.cropEnabled = true;
        healthbarbg.tint = 0xFF0000;

        var healthbarfg = this.game.add.sprite(0, -10, 'healthbar');
        healthbarfg.anchor.setTo(-0.5,-0.5);
        healthbarfg.cropEnabled = true;
        healthbarfg.width *= 0.75
        healthbarfg.tint = 0x00FF00;

        unit.addChild(healthbarbg);
        unit.addChild(healthbarfg);
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

                if (!range[i].containsPlayer) {
                    range[i].inputEnabled = true;

                    range[i].events.onInputOver.add(function(tile, pointer) {
                        this.drawPath(tile, playerTile);
                    }, this);
                    range[i].events.onInputDown.add(function(tile, pointer) {
                        this.clearPath();
                        this.clearDraw(drawn);
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

        player.events.onInputDown.removeAll();

        while (path.length > 0) {
            next = path.pop();

            playerTween.to({
            x: next.col * 16, y: next.row * 16
            }, 300 * Math.max(next.cost, currentCost), Phaser.Easing.Linear.None);

            currentCost = next.cost;
        }

        playerTween.onComplete.add(function() {   
            if (turn == 'player') {
                this.enemyTurn();
            } else {
                this.playerTurn();
            }
            //player.events.onInputDown.add(this.drawRange, this, player);
        }, this);
        playerTween.start();

        if (player.team == 'player') {
            grid[player.row][player.col].containsPlayer = false;
            grid[next.row][next.col].containsPlayer = true;
        } else {
            grid[player.row][player.col].containsEnemy = false;
            grid[next.row][next.col].containsEnemy = true;
        }

        player.row = next.row;
        player.col = next.col;
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

                if (neighbors[i].isObstacle || neighbors[i].containsEnemy || nextDepth > player.moves) {
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
