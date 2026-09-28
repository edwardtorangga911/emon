Player = Entity.extend({
    id: 0,

    /**
     * Moving speed
     */
    velocity: 2,
    baseVelocity: 2,

    /**
     * Max number of bombs user can spawn
     */
    bombsMax: 1,

    /**
     * How far the fire reaches when bomb explodes
     */
    bombStrength: 1,

    /**
     * Power-up ability flags
     */
    hasPierceBomb: false,
    hasDetonator: false,
    hasKick: false,
    hasThrow: false,
    hasBombPass: false,
    hasWallPass: false,

    /**
     * Defensive shield count & invulnerability frame timer
     */
    shield: 0,
    invulnerableTimer: 0,

    /**
     * Negative curse states: null, 'diarrhea', 'snail', 'reverse', 'amnesia'
     */
    curse: null,
    curseTimer: 0,
    lastStepTile: null,

    /**
     * Facing direction for throwing: 'up', 'down', 'left', 'right'
     */
    facingDirection: 'down',

    /**
     * Entity position on map grid
     */
    position: {},

    /**
     * Collision box dimensions
     */
    size: {
        w: 48,
        h: 48
    },

    spriteSheets: {
        player: { w: 27, h: 40, regX: -2, regY: 5, dead: 15 },
        bot: { w: 48, h: 48, regX: 10, regY: 12, dead: 16 }
    },

    bmp: null,
    auraGfx: null,

    alive: true,
    bombs: [],

    controls: {
        'up': 'up',
        'left': 'left',
        'down': 'down',
        'right': 'right',
        'bomb': 'bomb',
        'detonate': 'detonate',
        'throw': 'throw'
    },

    escapeBomb: null,
    deadTimer: 0,

    init: function(position, controls, id) {
        if (id) {
            this.id = id;
        }

        if (controls) {
            this.controls = controls;
        }

        var layout = this.spriteSheets.bot;
        var img = gGameEngine.playerBoyImg;
        if (!(this instanceof Bot)) {
            layout = this.spriteSheets.player;
            img = gGameEngine.playerImg;
        }

        var spriteSheet = new createjs.SpriteSheet({
            images: [img],
            frames: { width: layout.w, height: layout.h, regX: layout.regX, regY: layout.regY },
            animations: {
                idle: [0, 0, 'idle'],
                down: [0, 3, 'down', 0.1],
                left: [4, 7, 'left', 0.1],
                up: [8, 11, 'up', 0.1],
                right: [12, 15, 'right', 0.1],
                dead: [layout.dead, layout.dead, 'dead', 0.1]
            }
        });
        this.bmp = new createjs.Sprite(spriteSheet);

        this.position = position;
        var pixels = Utils.convertToBitmapPosition(position);
        this.bmp.x = pixels.x;
        this.bmp.y = pixels.y;

        // Container for shield bubble and curse text
        this.auraGfx = new createjs.Shape();
        gGameEngine.stage.addChild(this.auraGfx);

        gGameEngine.stage.addChild(this.bmp);

        this.bombs = [];
        this.baseVelocity = 2;
        this.velocity = 2;
        this.lastStepTile = { x: position.x, y: position.y };

        this.setBombsListener();
        this.setSpecialControlsListener();
    },

    setBombsListener: function() {
        if (!(this instanceof Bot)) {
            var that = this;
            gInputEngine.addListener(this.controls.bomb, function() {
                that.plantBomb();
            });
        }
    },

    setSpecialControlsListener: function() {
        if (!(this instanceof Bot)) {
            var that = this;

            // Detonator listener
            if (this.controls.detonate) {
                gInputEngine.addListener(this.controls.detonate, function() {
                    that.detonateRemoteBombs();
                });
            }

            // Throw bomb listener
            if (this.controls.throw) {
                gInputEngine.addListener(this.controls.throw, function() {
                    that.throwBomb();
                });
            }
        }
    },

    plantBomb: function() {
        if (!this.alive || (gGameEngine.menu && gGameEngine.menu.visible)) return;

        // Amnesia curse disables planting bombs
        if (this.curse === 'amnesia') {
            return;
        }

        // Check whether there is already bomb on this position
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            if (Utils.comparePositions(bomb.position, this.position)) {
                // If standing on bomb and has throw ability, pressing bomb again can throw it!
                if (this.hasThrow) {
                    this.throwBomb();
                }
                return;
            }
        }

        var unexplodedBombs = 0;
        for (var i = 0; i < this.bombs.length; i++) {
            if (!this.bombs[i].exploded) {
                unexplodedBombs++;
            }
        }

        if (unexplodedBombs < this.bombsMax) {
            var bomb = new Bomb(this.position, this.bombStrength, {
                isPierce: this.hasPierceBomb,
                isRemote: this.hasDetonator,
                owner: this
            });

            gGameEngine.stage.addChild(bomb.bmp);
            this.bombs.push(bomb);
            gGameEngine.bombs.push(bomb);

            if (window.AudioSynth) {
                AudioSynth.play('plant');
            }

            var that = this;
            bomb.setExplodeListener(function() {
                Utils.removeFromArray(that.bombs, bomb);
                if (gGameEngine.updateHud) gGameEngine.updateHud();
            });

            if (gGameEngine.updateHud) gGameEngine.updateHud();
        } else if (this.hasDetonator) {
            // If already at max bombs and has detonator, pressing bomb detonates!
            this.detonateRemoteBombs();
        }
    },

    detonateRemoteBombs: function() {
        if (!this.hasDetonator || !this.alive) return;

        var detonated = false;
        for (var i = 0; i < this.bombs.length; i++) {
            var bomb = this.bombs[i];
            if (!bomb.exploded && bomb.isRemote) {
                bomb.explode();
                detonated = true;
            }
        }

        if (detonated && window.AudioSynth) {
            AudioSynth.play('detonate');
        }
    },

    throwBomb: function() {
        if (!this.hasThrow || !this.alive) return;

        // Find bomb on current position or 1 tile in front
        var targetBomb = null;
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var b = gGameEngine.bombs[i];
            if (!b.exploded) {
                if (Utils.comparePositions(b.position, this.position)) {
                    targetBomb = b;
                    break;
                }
            }
        }

        if (!targetBomb) {
            var frontPos = { x: this.position.x, y: this.position.y };
            if (this.facingDirection === 'up') frontPos.y -= 1;
            else if (this.facingDirection === 'down') frontPos.y += 1;
            else if (this.facingDirection === 'left') frontPos.x -= 1;
            else if (this.facingDirection === 'right') frontPos.x += 1;

            for (var i = 0; i < gGameEngine.bombs.length; i++) {
                var b = gGameEngine.bombs[i];
                if (!b.exploded && Utils.comparePositions(b.position, frontPos)) {
                    targetBomb = b;
                    break;
                }
            }
        }

        if (targetBomb && !targetBomb.isThrowing) {
            var throwDist = 3;
            var targetGrid = { x: this.position.x, y: this.position.y };
            if (this.facingDirection === 'up') targetGrid.y -= throwDist;
            else if (this.facingDirection === 'down') targetGrid.y += throwDist;
            else if (this.facingDirection === 'left') targetGrid.x -= throwDist;
            else if (this.facingDirection === 'right') targetGrid.x += throwDist;

            // Clamp inside border walls (1 to tilesX - 2, 1 to tilesY - 2)
            targetGrid.x = Math.max(1, Math.min(gGameEngine.tilesX - 2, targetGrid.x));
            targetGrid.y = Math.max(1, Math.min(gGameEngine.tilesY - 2, targetGrid.y));

            targetBomb.throw(targetGrid);
        }
    },

    update: function() {
        if (!this.alive) {
            this.fade();
            return;
        }
        if (gGameEngine.menu.visible) {
            return;
        }

        // Update Invulnerability timer
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
            this.bmp.alpha = (Math.floor(this.invulnerableTimer / 4) % 2 === 0) ? 0.3 : 1;
        } else if (this.hasWallPass) {
            // Ghost effect when having Wall Pass
            this.bmp.alpha = 0.65;
        } else {
            this.bmp.alpha = 1;
        }

        // Update Curse timer
        if (this.curse) {
            this.curseTimer--;

            if (this.curse === 'snail') {
                this.velocity = 0.9;
            }

            if (this.curse === 'diarrhea') {
                if (!this.lastStepTile || this.position.x !== this.lastStepTile.x || this.position.y !== this.lastStepTile.y) {
                    this.plantBomb();
                    this.lastStepTile = { x: this.position.x, y: this.position.y };
                }
            }

            if (this.curseTimer <= 0) {
                this.curse = null;
                this.velocity = this.baseVelocity || 2;
                if (gGameEngine.updateHud) gGameEngine.updateHud();
            }
        }

        var position = { x: this.bmp.x, y: this.bmp.y };
        var dirX = 0;
        var dirY = 0;

        // Check directional inputs (handles reversed controls curse)
        var actionUp = gInputEngine.actions[this.controls.up];
        var actionDown = gInputEngine.actions[this.controls.down];
        var actionLeft = gInputEngine.actions[this.controls.left];
        var actionRight = gInputEngine.actions[this.controls.right];

        if (this.curse === 'reverse') {
            var tempUp = actionUp;
            var tempDown = actionDown;
            var tempLeft = actionLeft;
            var tempRight = actionRight;
            actionUp = tempDown;
            actionDown = tempUp;
            actionLeft = tempRight;
            actionRight = tempLeft;
        }

        if (this.warpCooldown > 0) this.warpCooldown--;

        var currentMat = gGameEngine.getTileMaterial(this.position);

        // Warp Portal Teleportation
        if (currentMat === 'warp' && this.warpCooldown <= 0) {
            if (gGameEngine.teleportEntity) {
                gGameEngine.teleportEntity(this);
                this.warpCooldown = 75; // ~1.5s cooldown
            }
        }

        // Conveyor belt drift
        if (currentMat && currentMat.indexOf('conveyor_') === 0) {
            var cDir = currentMat.split('_')[1];
            var cSpeed = 1;
            if (cDir === 'left') position.x -= cSpeed;
            else if (cDir === 'right') position.x += cSpeed;
            else if (cDir === 'up') position.y -= cSpeed;
            else if (cDir === 'down') position.y += cSpeed;
        }

        var isMovingInput = actionUp || actionDown || actionLeft || actionRight;

        if (actionUp) {
            this.animate('up');
            position.y -= this.velocity;
            dirY = -1;
            this.facingDirection = 'up';
            this.slideDir = { x: 0, y: -1 };
        } else if (actionDown) {
            this.animate('down');
            position.y += this.velocity;
            dirY = 1;
            this.facingDirection = 'down';
            this.slideDir = { x: 0, y: 1 };
        } else if (actionLeft) {
            this.animate('left');
            position.x -= this.velocity;
            dirX = -1;
            this.facingDirection = 'left';
            this.slideDir = { x: -1, y: 0 };
        } else if (actionRight) {
            this.animate('right');
            position.x += this.velocity;
            dirX = 1;
            this.facingDirection = 'right';
            this.slideDir = { x: 1, y: 0 };
        } else if (currentMat === 'ice' && this.slideDir) {
            // Ice sliding inertia
            position.x += this.slideDir.x * (this.velocity * 0.85);
            position.y += this.slideDir.y * (this.velocity * 0.85);
            dirX = this.slideDir.x;
            dirY = this.slideDir.y;
            if (Math.random() < 0.05 && window.AudioSynth) AudioSynth.play('slide');
        } else {
            this.animate('idle');
            this.slideDir = null;
        }

        if (position.x != this.bmp.x || position.y != this.bmp.y) {
            var bombCollision = this.detectBombCollision(position);

            // Handle Bomb Kick when colliding with bomb
            if (bombCollision && this.hasKick) {
                var collidingBomb = this.getCollidingBomb(position);
                if (collidingBomb && !collidingBomb.isMoving) {
                    collidingBomb.kick(dirX, dirY);
                }
            }

            // Bomb pass ignores bomb collisions entirely
            if (!bombCollision || this.hasBombPass) {
                if (this.detectWallCollision(position)) {
                    var cornerFix = this.getCornerFix(dirX, dirY);
                    if (cornerFix) {
                        var fixX = 0;
                        var fixY = 0;
                        if (dirX) {
                            fixY = (cornerFix.y - this.bmp.y) > 0 ? 1 : -1;
                        } else {
                            fixX = (cornerFix.x - this.bmp.x) > 0 ? 1 : -1;
                        }
                        this.bmp.x += fixX * this.velocity;
                        this.bmp.y += fixY * this.velocity;
                        this.updatePosition();
                    } else {
                        this.slideDir = null;
                    }
                } else {
                    this.bmp.x = position.x;
                    this.bmp.y = position.y;
                    this.updatePosition();
                }
            } else {
                this.slideDir = null;
            }
        }

        // Fire collision damage with Shield protection
        if (this.detectFireCollision()) {
            if (this.invulnerableTimer <= 0) {
                if (this.shield > 0) {
                    this.shield--;
                    this.invulnerableTimer = 60; // ~1.2s invulnerability
                    if (window.AudioSynth) AudioSynth.play('shield_break');
                    if (gGameEngine.updateHud) gGameEngine.updateHud();
                } else {
                    this.die();
                }
            }
        }

        // Update Aura / Shield / Curse visual graphics
        this.updateAuraGfx();

        this.handleBonusCollision();
    },

    updateAuraGfx: function() {
        if (!this.auraGfx) return;
        this.auraGfx.graphics.clear();

        var px = this.bmp.x + 13;
        var py = this.bmp.y + 18;

        // Shield glowing bubble
        if (this.shield > 0) {
            this.auraGfx.graphics
                .setStrokeStyle(2)
                .beginStroke('#38bdf8')
                .beginFill('rgba(56, 189, 248, 0.22)')
                .drawCircle(px, py, 18);
        }

        // Active curse indicator halo
        if (this.curse) {
            var pulse = Math.sin(createjs.Ticker.getTicks() * 0.2) * 2;
            this.auraGfx.graphics
                .setStrokeStyle(1.5)
                .beginStroke('#ef4444')
                .drawCircle(px, py - 20, 5 + pulse);
        }
    },

    getCollidingBomb: function(pixels) {
        var position = Utils.convertToEntityPosition(pixels);
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            if (bomb.position.x == position.x && bomb.position.y == position.y) {
                return bomb;
            }
        }
        return null;
    },

    getCornerFix: function(dirX, dirY) {
        var edgeSize = 30;
        var position = {};

        var pos1 = { x: this.position.x + dirY, y: this.position.y + dirX };
        var bmp1 = Utils.convertToBitmapPosition(pos1);

        var pos2 = { x: this.position.x - dirY, y: this.position.y - dirX };
        var bmp2 = Utils.convertToBitmapPosition(pos2);

        var mat1 = gGameEngine.getTileMaterial(pos1);
        var mat2 = gGameEngine.getTileMaterial(pos2);
        var currentMat = gGameEngine.getTileMaterial({ x: this.position.x + dirX, y: this.position.y + dirY });

        // Non-wall tiles (grass, ice, conveyor, warp) are passable; wood is passable only with WallPass
        var isPassable = (mat) => (mat !== 'wall' && (mat !== 'wood' || this.hasWallPass));

        if (isPassable(currentMat)) {
            position = this.position;
        } else if (isPassable(mat1)
            && Math.abs(this.bmp.y - bmp1.y) < edgeSize && Math.abs(this.bmp.x - bmp1.x) < edgeSize) {
            if (isPassable(gGameEngine.getTileMaterial({ x: pos1.x + dirX, y: pos1.y + dirY }))) {
                position = pos1;
            }
        } else if (isPassable(mat2)
            && Math.abs(this.bmp.y - bmp2.y) < edgeSize && Math.abs(this.bmp.x - bmp2.x) < edgeSize) {
            if (isPassable(gGameEngine.getTileMaterial({ x: pos2.x + dirX, y: pos2.y + dirY }))) {
                position = pos2;
            }
        }

        if (position.x && isPassable(gGameEngine.getTileMaterial(position))) {
            return Utils.convertToBitmapPosition(position);
        }
    },

    updatePosition: function() {
        this.position = Utils.convertToEntityPosition(this.bmp);
    },

    detectWallCollision: function(position) {
        var player = {
            left: position.x,
            top: position.y,
            right: position.x + this.size.w,
            bottom: position.y + this.size.h
        };

        var tiles = gGameEngine.tiles;
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];

            // WallPass ability: ignore wood block collisions completely!
            if (this.hasWallPass && tile.material === 'wood') {
                continue;
            }

            var tilePosition = tile.position;
            var tileBox = {
                left: tilePosition.x * gGameEngine.tileSize + 25,
                top: tilePosition.y * gGameEngine.tileSize + 20,
                right: tilePosition.x * gGameEngine.tileSize + 25 + gGameEngine.tileSize - 30,
                bottom: tilePosition.y * gGameEngine.tileSize + 20 + gGameEngine.tileSize - 30
            };

            if (gGameEngine.intersectRect(player, tileBox)) {
                return true;
            }
        }
        return false;
    },

    detectBombCollision: function(pixels) {
        // BombPass ability ignores all bomb collisions
        if (this.hasBombPass) {
            return false;
        }

        var position = Utils.convertToEntityPosition(pixels);

        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            if (bomb.position.x == position.x && bomb.position.y == position.y) {
                if (bomb == this.escapeBomb) {
                    return false;
                } else {
                    return true;
                }
            }
        }

        if (this.escapeBomb) {
            this.escapeBomb = null;
        }

        return false;
    },

    detectFireCollision: function() {
        var bombs = gGameEngine.bombs;
        for (var i = 0; i < bombs.length; i++) {
            var bomb = bombs[i];
            for (var j = 0; j < bomb.fires.length; j++) {
                var fire = bomb.fires[j];
                var collision = bomb.exploded && fire.position.x == this.position.x && fire.position.y == this.position.y;
                if (collision) {
                    return true;
                }
            }
        }
        return false;
    },

    handleBonusCollision: function() {
        for (var i = 0; i < gGameEngine.bonuses.length; i++) {
            var bonus = gGameEngine.bonuses[i];
            if (Utils.comparePositions(bonus.position, this.position)) {
                this.applyBonus(bonus);
                bonus.destroy();
            }
        }
    },

    applyBonus: function(bonus) {
        if (window.AudioSynth) {
            if (bonus.type === 'skull') {
                AudioSynth.play('curse');
            } else {
                AudioSynth.play('pickup');
            }
        }

        var meta = Bonus.METADATA[bonus.type] || { name: bonus.type };

        if (bonus.type == 'speed') {
            this.baseVelocity = (this.baseVelocity || 2) + 0.6;
            this.velocity = this.baseVelocity;
        } else if (bonus.type == 'bomb') {
            this.bombsMax++;
        } else if (bonus.type == 'fire') {
            this.bombStrength++;
        } else if (bonus.type == 'pierce') {
            this.hasPierceBomb = true;
        } else if (bonus.type == 'remote') {
            this.hasDetonator = true;
        } else if (bonus.type == 'kick') {
            this.hasKick = true;
        } else if (bonus.type == 'throw') {
            this.hasThrow = true;
        } else if (bonus.type == 'bombpass') {
            this.hasBombPass = true;
        } else if (bonus.type == 'shield') {
            this.shield = Math.min((this.shield || 0) + 1, 2);
        } else if (bonus.type == 'wallpass') {
            this.hasWallPass = true;
        } else if (bonus.type == 'skull') {
            this.triggerRandomCurse();
        }

        if (bonus.type !== 'skull') {
            if (gGameEngine.spawnFloatingText) {
                gGameEngine.spawnFloatingText(this.bmp.x, this.bmp.y, '+' + meta.name.toUpperCase(), meta.color);
            }
            if (gGameEngine.addScore) {
                gGameEngine.addScore(150);
            }
        } else {
            if (gGameEngine.spawnFloatingText) {
                gGameEngine.spawnFloatingText(this.bmp.x, this.bmp.y, 'KUTUKAN!', '#ef4444');
            }
        }

        if (gGameEngine.updateHud) {
            gGameEngine.updateHud();
        }
    },

    triggerRandomCurse: function() {
        var curses = ['diarrhea', 'snail', 'reverse', 'amnesia'];
        var picked = curses[Math.floor(Math.random() * curses.length)];
        this.curse = picked;
        this.curseTimer = 12 * 50; // 12 seconds @ 50fps

        if (picked === 'snail') {
            this.velocity = 0.9;
        }

        if (gGameEngine.updateHud) {
            gGameEngine.updateHud();
        }
    },

    animate: function(animation) {
        if (!this.bmp.currentAnimation || this.bmp.currentAnimation.indexOf(animation) === -1) {
            this.bmp.gotoAndPlay(animation);
        }
    },

    die: function() {
        this.alive = false;

        if (this.auraGfx) {
            gGameEngine.stage.removeChild(this.auraGfx);
            this.auraGfx = null;
        }
        if (this instanceof Bot && gGameEngine.addScore) {
            gGameEngine.addScore(300);
            if (gGameEngine.spawnFloatingText) {
                gGameEngine.spawnFloatingText(this.bmp.x, this.bmp.y, '+300 PTS', '#10b981');
            }
        }

        if (gGameEngine.countPlayersAlive() == 1 && gGameEngine.playersCount == 2) {
            gGameEngine.gameOver('win');
        } else if (gGameEngine.countPlayersAlive() == 0) {
            gGameEngine.gameOver('lose');
        }

        this.bmp.gotoAndPlay('dead');
        this.fade();
    },

    fade: function() {
        var timer = 0;
        var bmp = this.bmp;
        var fade = setInterval(function() {
            timer++;
            if (timer > 30) {
                bmp.alpha -= 0.05;
            }
            if (bmp.alpha <= 0) {
                clearInterval(fade);
            }
        }, 30);
    }
});