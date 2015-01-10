// keep track of the translucent tiles drawn on top of the actual grid
// to represent movement range (keeping track in this way makes
// it easier to delete them later)
var path = [];
var drawn = [];

// keep track of all of the tiles on the map
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

// list of units to create at the start of the game
var units = [{moves: 5, range: 1, color: 0x00FF00, row: 1, col: 12, maxHealth: 10, team: 'player'},
             {moves: 4, range: 2, color: 0xFF00FF, row: 6, col: 9, maxHealth: 8, team: 'player'},
             {moves: 2, range: 1, color: 0xFF0000, row: 2, col: 2, maxHealth: 10, team: 'enemy'}];

// keep track of all of the units
var playerUnits = [];
var enemyUnits = [];

// either 'player' or 'enemy', keeps track of which turn it is
// (this lets us reuse some fucntions for both turns)
var turn = 'player';

Strategy.Game = function(){};

/* Class for defining a unit (player or enemy). Extends the Phaser Sprite
 * prototype. Unit is constructed by passing in unitData object.
 *
 * Unit data should include:
 * moves: integer movement range
 * range: integer attack range
 * color: hex color for square (temp)
 * row: integer starting row on the map (0-indexed)
 * col: integer starting col on the map (0-indexed)
 * maxHealth: integer maximum health (assumed that units start at max health)
 * team: string, either 'player' or 'enemy' to assign unit ownership
 * 
 * Future Idea: It would easy to convert units from one team to another
 * 
 */
Unit = function (unitData) {
    // initialize this as a phaser sprite
    Phaser.Sprite.call(this, Strategy.game, 16 * unitData.col, 16 * unitData.row, 'tiles');

    // set graphics properties
    this.frame = 1;
    this.anchor.setTo(-0.5,-0.5);
    this.scale.setTo(0.5);
    this.color = unitData.color;
    this.tint = unitData.color;

    // copy parameters to instance variables
    this.row = unitData.row;
    this.col = unitData.col;
    this.moves = unitData.moves;
    this.range = unitData.range;
    this.team = unitData.team;
    this.health = unitData.maxHealth;
    this.maxHealth = unitData.maxHealth;

    // mark the starting tile as containing a player or enemy
    // based on the team of the unit
    if (this.team == 'player') {
        grid[this.row][this.col].containsPlayer = true;
        this.inputEnabled = false;

    } else {
        grid[this.row][this.col].containsEnemy = true;
    }    

    // Actually add the sprite to the game
    Strategy.game.add.existing(this);
},

Unit.prototype = Object.create(Phaser.Sprite.prototype);
Unit.prototype.constructor = Unit;

// Creates a health bar as a child sprite of the unit
// The healthbar consists of a green foreground image
// and a red background image. updateHealthBar adjusts the 
// width of the foreground healthbar to show more red as the
// unit loses health or more green if the unit gets health
Unit.prototype.addHealthBar = function () {
    // Add red background to represent missing health
    var healthbarbg = this.game.add.sprite(0, -10, 'healthbar');
    healthbarbg.anchor.setTo(-0.5,-0.5);
    healthbarbg.cropEnabled = true;
    healthbarbg.tint = 0xFF0000;

    // Add green foreground to repesent current health
    var healthbarfg = this.game.add.sprite(0, -10, 'healthbar');
    healthbarfg.anchor.setTo(-0.5,-0.5);
    healthbarfg.cropEnabled = true;
    healthbarfg.tint = 0x00FF00;

    // add heathbars to unit sprite
    this.addChild(healthbarbg);
    this.addChild(healthbarfg);
}

// Given a change in health, healthDelta,
// Updates the unit's health and then
// Updates the unit's healthbar foreground sprite
// to reflect the current fraction of health remaining
Unit.prototype.updateHealth = function (healthDelta) {
    this.health += healthDelta;

    // get the width of the bar background (red part) to represent
    // maximum of health
    var maxWidth = this.getChild(0).width;

    // get the child healthbar foreground sprite
    var healthbarfg = this.getChild(1);

    // update the width based on fraction of health remaining
    healthbarfg.width = maxWidth * (this.health / this.maxHealth);
}

// TODO: Break this up into multiple functions

// Given a starting and ending tile, moves the unit
// along a path and updates the instance position variables
Unit.prototype.followPath = function (unitPath) {
        // stores cost of the tile that the unit is currently on
        var currentCost = 0;
        var playerTween = this.game.add.tween(this);

        while(unitPath.length > 0) {
            var next = unitPath.pop();

            // Add the location of the next tile to the tween
            // Speed of the tween is based on the movement cost
            // between the two tiles
            playerTween.to({
            x: next.col * 16, y: next.row * 16
            }, 300 * Math.max(next.cost, currentCost), Phaser.Easing.Linear.None);

            // store the cost of the new current tile to determine
            // the next movement cost
            currentCost = next.cost;
        }

        // TODO: Replace this with a context menu
        // When the tween is done, change the turn 
        playerTween.onComplete.add(function() {   
            Strategy.Game.prototype.unitDidMove(this);
            // if (turn == 'player') {
            //     Strategy.Game.prototype.enemyTurn.call(Strategy.game.state.states["Game"]);
            // } else {
            //     Strategy.Game.prototype.playerTurn.call(Strategy.game.state.states["Game"]);
            // }
        }, this);

        playerTween.start();

}

Unit.prototype.move = function (to) {
    var unitPath = [];
    var from = grid[this.row][this.col];
    var newRow = to.row;
    var newCol = to.col;

    while (to != from) {
        unitPath.push(to);
        to = to.cameFrom;
    }

    this.followPath(unitPath);

    // update grid properties to reflect the movement of the character
    if (this.team == 'player') {
        grid[this.row][this.col].containsPlayer = false;
        grid[newRow][newCol].containsPlayer = true;
    } else {
        grid[this.row][this.col].containsEnemy = false;
        grid[newRow][newCol].containsEnemy = true;
    }

    // update instance variables to reflect move
    this.row = newRow;
    this.col = newCol;
}

/* Creates a Tile (extends Sprite) given the following parameters:
 * row: integer starting row on the map (0-indexed)
 * col: integer starting col on the map (0-indexed)
 * type: integer representing tile type (currently 0 represents an obstacle,
 * all other positive integers correspond to move cost) */
Tile = function (row, col, type) {
    // create sprite
    Phaser.Sprite.call(this, Strategy.game, Strategy.game.global.tileSize * col, Strategy.game.global.tileSize * row, 'tiles');

    // set instance variables
    this.frame = type
    this.isObstacle = !type;
    this.cost = type;
    this.row = row;
    this.col = col;

    // it is important to set the initial search depth to inifinty
    // so that the movement range search works properly
    this.depth = Infinity;

    // add sprite to game
    Strategy.game.add.existing(this);
}

Tile.prototype = Object.create(Phaser.Sprite.prototype);
Tile.prototype.constructor = Tile;

Strategy.Game.prototype = {

    create: function () {
        // set dimensions of the game
        var cols = this.game.width / this.game.global.tileSize;
        var rows = this.game.height / this.game.global.tileSize;

        // create the grid from global map variable
        for (var i = 0; i < rows; i++) {
            grid[i] = [];
            for (var j = 0; j < cols; j++) {
                grid[i][j] = new Tile (i, j, map[i][j]);
            }
        }

        // create units
        var len = units.length;
        for (var i = 0; i < len; i++) {
            var unit = new Unit(units[i]);
            unit.addHealthBar();

            if (unit.team == 'player') {
                unit.events.onInputDown.add(this.drawRange, this);
                playerUnits.push(unit);
            } else {
                enemyUnits.push(unit);
            }
        }

        // star the game with the player turn
        this.playerTurn();
    },

    // Called when turn switches from enemy to player
    playerTurn: function () {
        turn = 'player';

        this.recolor(enemyUnits);

        // make player units clickable to show range
        var len = playerUnits.length;
        for (var i = 0; i < len; i++) {
            var unit = playerUnits[i];
            unit.didMove = false;
            unit.inputEnabled = true;
        }
    },

    // Called when turn switches from player to enemy
    enemyTurn: function () {
        this.recolor(playerUnits);

        turn = 'enemy';
        // Sample enemy behavior that randomly moves the first enemy unit one space
        var unit = enemyUnits[0];
        var neighbors = this.neighbors(grid[unit.row][unit.col]);
        var tile = neighbors[Math.floor(Math.random() * neighbors.length)];
        tile.cameFrom = grid[unit.row][unit.col];
        unit.move(tile);
    },

    recolor: function (unitArray) {
        var len = unitArray.length;

        for (var i = 0; i < len; i++) {
            unitArray[i].tint = unitArray[i].color;
        }
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
        this.clearPath();

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


                // TODO: this part of the code should be in a more logical place
                if (!range[i].containsPlayer) {
                    tile.inputEnabled = true;

                    tile.events.onInputOver.add(function(tile, pointer) {
                        this.drawPath(grid[tile.row][tile.col], playerTile);
                        this.game.world.bringToTop(player);
                    }, this);

                    tile.events.onInputDown.add(function(tile, pointer) {
                        player.inputEnabled = false;
                        this.clearPath();
                        this.clearDraw();
                        player.move(grid[tile.row][tile.col]);
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

        this.moveUnitsToTop();
    },

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
        // TODO: Find a way to combine this step into the loop?
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
        this.resetGrid();
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

    // Clears the tiles that have been drawn
    // to represent the movement and attack ranges
    clearDraw: function () {
        var len = drawn.length;
        for (var i = 0; i < len; i++) {
            drawn[i].destroy();
            // TODO: Move this logic
        }

        drawn = [];
    },

    // TODO: Check where this actually needs to be called
    resetGrid: function () {
        for (var i = 0; i < grid.length; i++) {
            for (var j = 0; j < grid[0].length; j++) {
                grid[i][j].depth = Infinity; 
            }
        }
    },

    unitDidMove: function (unit) {
        var unitArray;

        unit.didMove = true;

        unit.tint = 0xAAAAAA;

        if (unit.team == 'player') {
            unitArray = playerUnits;
        } else {
            unitArray = enemyUnits;
        }

        var len = unitArray.length;

        for (var i = 0; i < len; i++) {
            if (!unitArray[i].didMove) {
                return;
            }
        }

        if (turn == 'player') {
            this.enemyTurn();
        } else {
            this.playerTurn();
        }
    },

    moveUnitsToTop: function () {
        var allUnits = playerUnits.concat(enemyUnits);

        var len = allUnits.length;
        for (var i = 0; i < len; i++) {
            this.game.world.bringToTop(allUnits[i]);
        }
    }
};
