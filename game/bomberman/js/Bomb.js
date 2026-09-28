Bomb = Entity.extend({
    /**
     * Entity position on map grid
     */
    position: {},

    /**
     * How far the fire reaches when bomb explodes
     */
    strength: 1,

    /**
     * Bitmap dimensions
     */
    size: {
        w: 28,
        h: 28
    },

    /**
     * Bitmap animation
     */
    bmp: null,

    /**
     * Special powerup modifiers
     */
    isPierce: false,
    isRemote: false,
    owner: null,

    /**
     * Movement / Kick state
     */
    isMoving: false,
    moveDir: { x: 0, y: 0 },
    moveSpeed: 5,

    /**
     * Throw trajectory state
     */
    isThrowing: false,
    throwStart: { x: 0, y: 0 },
    throwTarget: { x: 0, y: 0 },
    throwGridTarget: { x: 0, y: 0 },
    throwProgress: 0,

    /**
     * Visual aura shapes
     */
    auraGfx: null,

    /**
     * Timer in frames
     */
    timer: 0,

    /**
     * Max timer value in seconds
     */
    timerMax: 2,

    exploded: false,

    fires: [],

    explodeListener: null,

    init: function(position, strength, options) {
        this.strength = strength;
        options = options || {};
        this.isPierce = options.isPierce || false;
        this.isRemote = options.isRemote || false;
        this.owner = options.owner || null;

        var spriteSheet = new createjs.SpriteSheet({
            images: [gGameEngine.bombImg],
            frames: {
                width: this.size.w,
                height: this.size.h,
                regX: 5,
                regY: 5
            },
            animations: {
                idle: [0, 4, "idle", 0.2]
            }
        });
        this.bmp = new createjs.Sprite(spriteSheet);
        this.bmp.gotoAndPlay('idle');

        this.position = position;

        var pixels = Utils.convertToBitmapPosition(position);
        this.bmp.x = pixels.x + this.size.w / 4;
        this.bmp.y = pixels.y + this.size.h / 4;

        this.fires = [];

        // Special visual auras for Pierce & Remote bombs
        if (this.isPierce || this.isRemote) {
            this.auraGfx = new createjs.Shape();
            this.updateAura();
            gGameEngine.stage.addChild(this.auraGfx);
        }

        // Remote bombs do not auto-explode on timer
        if (this.isRemote) {
            this.timerMax = 999999;
        }

        // Allow players and bots that are already on this position to escape
        var players = gGameEngine.getPlayersAndBots();
        for (var i = 0; i < players.length; i++) {
            var player = players[i];
            if (Utils.comparePositions(player.position, this.position)) {
                player.escapeBomb = this;
            }
        }
    },

    updateAura: function() {
        if (!this.auraGfx) return;
        this.auraGfx.graphics.clear();

        var cx = this.bmp.x + 9;
        var cy = this.bmp.y + 9;

        if (this.isPierce) {
            // Glowing crimson spikes around bomb
            this.auraGfx.graphics
                .setStrokeStyle(1.5)
                .beginStroke('rgba(239, 68, 68, 0.8)')
                .beginFill('rgba(239, 68, 68, 0.25)')
                .drawCircle(cx, cy, 14);

            // Spikes
            for (var i = 0; i < 4; i++) {
                var angle = (i * Math.PI) / 2 + (this.timer * 0.05);
                var sx = cx + Math.cos(angle) * 16;
                var sy = cy + Math.sin(angle) * 16;
                this.auraGfx.graphics
                    .beginFill('#fde047')
                    .drawPolyStar(sx, sy, 3, 3, 0, angle * 180 / Math.PI);
            }
        } else if (this.isRemote) {
            // Pulsing cyan aura with antenna ring
            var pulse = Math.sin(this.timer * 0.15) * 2;
            this.auraGfx.graphics
                .setStrokeStyle(1.5)
                .beginStroke('#8b5cf6')
                .beginFill('rgba(139, 92, 246, 0.2)')
                .drawCircle(cx, cy, 13 + pulse);

            // Blinking red beacon on top
            var beaconColor = (Math.floor(this.timer / 15) % 2 === 0) ? '#ef4444' : '#475569';
            this.auraGfx.graphics
                .beginFill(beaconColor)
                .drawCircle(cx, cy - 13, 2.5);
        }
    },

    kick: function(dirX, dirY) {
        if (this.isMoving || this.isThrowing || this.exploded) return;

        // Check if next tile in direction is free
        var nextPos = { x: this.position.x + dirX, y: this.position.y + dirY };
        var material = gGameEngine.getTileMaterial(nextPos);
        if (material !== 'grass') return;

        // Check if another bomb is in the way
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var b = gGameEngine.bombs[i];
            if (b !== this && !b.exploded && Utils.comparePositions(b.position, nextPos)) {
                return;
            }
        }

        this.isMoving = true;
        this.moveDir = { x: dirX, y: dirY };
        if (window.AudioSynth) AudioSynth.play('kick');
    },

    throw: function(targetGridPos) {
        if (this.isThrowing || this.exploded) return;

        this.isMoving = false;
        this.isThrowing = true;
        this.throwProgress = 0;
        this.throwStart = { x: this.bmp.x, y: this.bmp.y };

        var targetPixels = Utils.convertToBitmapPosition(targetGridPos);
        this.throwTarget = {
            x: targetPixels.x + this.size.w / 4,
            y: targetPixels.y + this.size.h / 4
        };
        this.throwGridTarget = targetGridPos;

        if (window.AudioSynth) AudioSynth.play('throw');
    },

    update: function() {
        if (this.exploded) { return; }

        this.timer++;

        // Update Aura graphics
        if (this.auraGfx) {
            this.updateAura();
        }

        // Handle Throw Flight Arc
        if (this.isThrowing) {
            this.throwProgress += 0.06;
            if (this.throwProgress >= 1) {
                this.isThrowing = false;
                this.bmp.x = this.throwTarget.x;
                this.bmp.y = this.throwTarget.y;
                this.position = { x: this.throwGridTarget.x, y: this.throwGridTarget.y };

                // If landed on wall or wood or another bomb, bounce or explode
                var mat = gGameEngine.getTileMaterial(this.position);
                if (mat !== 'grass') {
                    this.explode();
                    return;
                }
            } else {
                // Parabolic trajectory
                var arcY = -Math.sin(this.throwProgress * Math.PI) * 50;
                this.bmp.x = this.throwStart.x + (this.throwTarget.x - this.throwStart.x) * this.throwProgress;
                this.bmp.y = this.throwStart.y + (this.throwTarget.y - this.throwStart.y) * this.throwProgress + arcY;
                return;
            }
        }

        // Handle Sliding from Kick
        if (this.isMoving) {
            this.bmp.x += this.moveDir.x * this.moveSpeed;
            this.bmp.y += this.moveDir.y * this.moveSpeed;

            var currentGrid = Utils.convertToEntityPosition(this.bmp);
            this.position = currentGrid;

            // Check next tile ahead in moving direction
            var aheadGrid = {
                x: currentGrid.x + this.moveDir.x,
                y: currentGrid.y + this.moveDir.y
            };
            var aheadMat = gGameEngine.getTileMaterial(aheadGrid);
            var obstacleAhead = (aheadMat !== 'grass');

            if (!obstacleAhead) {
                for (var i = 0; i < gGameEngine.bombs.length; i++) {
                    var otherBomb = gGameEngine.bombs[i];
                    if (otherBomb !== this && !otherBomb.exploded && Utils.comparePositions(otherBomb.position, aheadGrid)) {
                        obstacleAhead = true;
                        break;
                    }
                }
            }

            // Also check if reached center of tile when next tile is blocked
            var tileCenter = Utils.convertToBitmapPosition(currentGrid);
            var targetX = tileCenter.x + this.size.w / 4;
            var targetY = tileCenter.y + this.size.h / 4;

            var passedCenter = false;
            if (this.moveDir.x > 0 && this.bmp.x >= targetX) passedCenter = true;
            else if (this.moveDir.x < 0 && this.bmp.x <= targetX) passedCenter = true;
            else if (this.moveDir.y > 0 && this.bmp.y >= targetY) passedCenter = true;
            else if (this.moveDir.y < 0 && this.bmp.y <= targetY) passedCenter = true;

            if (obstacleAhead && passedCenter) {
                this.bmp.x = targetX;
                this.bmp.y = targetY;
                this.position = currentGrid;
                this.isMoving = false;
            }
        }

        // Normal timer explosion for non-remote bombs
        if (!this.isRemote) {
            var fps = (createjs.Ticker && createjs.Ticker.getMeasuredFPS()) || 50;
            if (this.timer > this.timerMax * fps) {
                this.explode();
            }
        }
    },

    explode: function() {
        if (this.exploded) return;
        this.exploded = true;

        if (this.auraGfx) {
            gGameEngine.stage.removeChild(this.auraGfx);
            this.auraGfx = null;
        }

        if (!gGameEngine.mute && gGameEngine.soundtrackPlaying) {
            try {
                var bombSound = createjs.Sound.play("bomb");
                if (bombSound && bombSound.setVolume) {
                    bombSound.setVolume(0.2);
                }
            } catch (e) {
                console.warn("Could not play bomb sound:", e);
            }
        }

        // Fire in all directions!
        var positions = this.getDangerPositions();
        for (var i = 0; i < positions.length; i++) {
            var position = positions[i];
            this.fire(position);

            var material = gGameEngine.getTileMaterial(position);
            if (material == 'wood') {
                var tile = gGameEngine.getTile(position);
                if (tile) {
                    tile.remove();
                }
            } else if (material == 'grass') {
                // Explode chain bombs in fire
                for (var j = 0; j < gGameEngine.bombs.length; j++) {
                    var bomb = gGameEngine.bombs[j];
                    if (!bomb.exploded && Utils.comparePositions(bomb.position, position)) {
                        bomb.explode();
                    }
                }
            }
        }

        this.remove();
    },

    /**
     * Returns positions that are going to be covered by fire.
     * With Spike/Pierce bomb: fire continues through multiple wood blocks!
     */
    getDangerPositions: function() {
        var positions = [];
        positions.push(this.position);

        for (var i = 0; i < 4; i++) {
            var dirX = 0;
            var dirY = 0;
            if (i == 0) { dirX = 1; dirY = 0; }
            else if (i == 1) { dirX = -1; dirY = 0; }
            else if (i == 2) { dirX = 0; dirY = 1; }
            else if (i == 3) { dirX = 0; dirY = -1; }

            for (var j = 1; j <= this.strength; j++) {
                var explode = true;
                var last = false;

                var position = { x: this.position.x + j * dirX, y: this.position.y + j * dirY };
                var material = gGameEngine.getTileMaterial(position);

                if (material == 'wall') {
                    // Indestructible border or pillar wall
                    explode = false;
                    last = true;
                } else if (material == 'wood') {
                    // Fragile wood block
                    explode = true;
                    // Normal bomb stops at 1st wood block; Piercing bomb cuts straight through!
                    if (!this.isPierce) {
                        last = true;
                    }
                }

                if (explode) {
                    positions.push(position);
                }

                if (last) {
                    break;
                }
            }
        }

        return positions;
    },

    fire: function(position) {
        var fire = new Fire(position, this);
        this.fires.push(fire);
    },

    remove: function() {
        if (this.auraGfx) {
            gGameEngine.stage.removeChild(this.auraGfx);
            this.auraGfx = null;
        }
        gGameEngine.stage.removeChild(this.bmp);
    },

    setExplodeListener: function(listener) {
        this.explodeListener = listener;
    }
});