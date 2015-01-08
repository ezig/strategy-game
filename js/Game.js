// These shouldn't be cglobal
var path = [];
var drawn = [];

var grid = [];
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

Strategy.Game = function(){};

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

Unit.prototype.followPath = function (to, from) {
        var currentCost = 0;
        var playerTween = this.game.add.tween(this);
        var next;

        var my_path = [];

        // TODO: combine these steps?
        while (to != from) {
            my_path.push(to);
            to = to.cameFrom;
        }

        while(my_path.length > 0) {
            var next = my_path.pop();

            playerTween.to({
            x: next.col * 16, y: next.row * 16
            }, 300 * Math.max(next.cost, currentCost), Phaser.Easing.Linear.None);

            currentCost = next.cost;
        }

        playerTween.onComplete.add(function() {   
            if (turn == 'player') {
                Strategy.Game.prototype.enemyTurn.call(Strategy.game.state.states["Game"]);
            } else {
                Strategy.Game.prototype.playerTurn.call(Strategy.game.state.states["Game"]);
            }
        }, this);
        playerTween.start();

        if (this.team == 'player') {
            grid[this.row][this.col].containsPlayer = false;
            grid[next.row][next.col].containsPlayer = true;
        } else {
            grid[this.row][this.col].containsEnemy = false;
            grid[next.row][next.col].containsEnemy = true;
        }

        this.row = next.row;
        this.col = next.col;
}


Tile = function (row, col, type) {
    Phaser.Sprite.call(this, Strategy.game, Strategy.game.global.tileSize * col, Strategy.game.global.tileSize * row, 'tiles');

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

Strategy.Game.prototype = {

    create: function () {
        var cols = this.game.width / this.game.global.tileSize;
        var rows = this.game.height / this.game.global.tileSize;

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
        tile.cameFrom = grid[unit.row][unit.col];
        //var path = [tile];
        unit.followPath(tile, grid[unit.row][unit.col]);
        // this.playerTurn();
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
                var tile = this.game.add.sprite(range[i].col * this.game.global.tileSize,
                                                range[i].row * this.game.global.tileSize,
                                                'tiles');
                tile.frame = 1;
                tile.tint = 0x0000FF;
                tile.alpha = 0.7;
                tile.row = range[i].row;
                tile.col = range[i].col;
                drawn.push(tile);

                this.game.world.bringToTop(player);

                // TODO: this part of the code should be in a more logical place
                if (!range[i].containsPlayer) {
                    range[i].inputEnabled = true;

                    range[i].events.onInputOver.add(function(tile, pointer) {
                        this.drawPath(tile, playerTile);
                        this.game.world.bringToTop(player);
                    }, this);
                    range[i].events.onInputDown.add(function(tile, pointer) {
                        len = playerUnits.length;
                        for (var i = 0; i < len; i++) {
                            playerUnits[i].events.onInputDown.removeAll();
                        };
                        this.clearPath();
                        this.clearDraw(drawn);
                        player.followPath(tile, playerTile);
                    }, this);
                }
            }
            else {
                var tile = this.game.add.sprite(range[i].col * this.game.global.tileSize,
                                                range[i].row * this.game.global.tileSize,
                                                'tiles');
                tile.frame = 1;
                tile.tint = 0xFF0000;
                tile.alpha = 0.7;
                tile.row = range[i].row;
                tile.col = range[i].col;
                drawn.push(tile);
            }
        }
    },

    // change the layer ordering of the character and the tiles
    drawPath: function (to, from) {
        this.clearPath();
        path = [];

        while(to != from) {
            var tile = this.game.add.sprite(to.col * this.game.global.tileSize,
                                            to.row * this.game.global.tileSize,
                                            'tiles');
            tile.frame = 1;
            tile.tint = 0x00FF00;
            tile.alpha = 0.5;
            path.push(tile);

            to = to.cameFrom;
        }

        var tile = this.game.add.sprite(from.col * this.game.global.tileSize,
                                        from.row * this.game.global.tileSize,
                                        'tiles');
        tile.frame = 1;
        tile.tint = 0x00FF00;
        tile.alpha = 0.5;
        path.push(tile);
    },

    clearPath: function () {
        var len = path.length;

        for (var i = 0; i < len; i++) {
            path[i].destroy();
        }

        path = [];
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
            if (visited.indexOf(current) == -1 && !current.isObstacle) {
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

    clearDraw: function () {
        var len = drawn.length;
        for (var i = 0; i < len; i++) {
            drawn[i].destroy();
            grid[drawn[i].row][drawn[i].col].depth = Infinity; 
            // tiles[i].tint = 0xFFFFFF;
            grid[drawn[i].row][drawn[i].col].events.onInputOver.removeAll();
            grid[drawn[i].row][drawn[i].col].events.onInputDown.removeAll();
        }

        drawn = [];
    },
};
