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

var units = [{moves: 5, range: 1, color: 0x00FF00, row: 1, col: 12, maxHealth: 10, team: 'player'},
             {moves: 4, range: 2, color: 0xFF00FF, row: 6, col: 9, maxHealth: 8, team: 'player'},
             {moves: 2, range: 1, color: 0xFF0000, row: 2, col: 2, maxHealth: 10, team: 'enemy'}]
var playerUnits = [];
var enemyUnits = [];

var turn = 'player';

Unit = function (unitData) {
    Phaser.Sprite.call(this, Strategy.game, 16 * unitData.col, 16 * unitData.row, 'tiles');

    this.frame = 1;
    this.anchor.setTo(-0.5,-0.5);
    this.scale.setTo(0.5);
    this.tint = unitData.color;
    this.row = unitData.row;
    this.col = unitData.col;
    this.moves = unitData.moves;
    this.range = unitData.range;
    this.team = unitData.team;
    this.health = unitData.maxHealth;

    if (this.team == 'player') {
        grid[this.row][this.col].containsPlayer = true;
        this.inputEnabled = true;
    } else {
        grid[this.row][this.col].containsEnemy = true;
    }    

    Strategy.game.add.existing(this);
},

Unit.prototype = Object.create(Phaser.Sprite.prototype);
Unit.prototype.constructor = Unit;


Unit.prototype.addHealthBar = function () {
    var healthbarbg = this.game.add.sprite(0, -10, 'healthbar');
    healthbarbg.anchor.setTo(-0.5,-0.5);
    healthbarbg.cropEnabled = true;
    healthbarbg.tint = 0xFF0000;

    var healthbarfg = this.game.add.sprite(0, -10, 'healthbar');
    healthbarfg.anchor.setTo(-0.5,-0.5);
    healthbarfg.cropEnabled = true;
    healthbarfg.tint = 0x00FF00;

    this.addChild(healthbarbg);
    this.addChild(healthbarfg);
}

Tile = function (row, col, type) {
    Phaser.Sprite.call(this, Strategy.game, 16 * col, 16 * row, 'tiles');

    this.frame = type
    this.isObstacle = !type;
    this.cost = type;
    this.row = row;
    this.col = col;
    this.depth = Infinity;

    Strategy.game.add.existing(this);
}

Tile.prototype = Object.create(Phaser.Sprite.prototype);
Tile.prototype.constructor = Tile;

Strategy.Game = function(){};

Strategy.Game.prototype = {

    create: function () {

        // TODO: factor this out to global
        var cols = this.game.width / 16;
        var rows = this.game.height / 16;

        for (var i = 0; i < rows; i++) {
            grid[i] = [];
            for (var j = 0; j < cols; j++) {
                grid[i][j] = new Tile (i, j, map[i][j]);
            }
        }

        var len = units.length;
        for (var i = 0; i < len; i++) {
            var unit = new Unit(units[i]);
            unit.addHealthBar();

            if (unit.team == 'player') {
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

    addHealthBar: function (unit) {

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
};

function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";

        throw message;
    }
}
