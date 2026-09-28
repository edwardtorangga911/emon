GameEngine = Class.extend({
    tileSize: 32,
    tilesX: 17,
    tilesY: 13,
    size: {},
    fps: 50,
    botsCount: 2, /* 0 - 3 */
    playersCount: 2, /* 1 - 2 */
    bonusesPercent: 45,

    /**
     * Level Progression & Themes
     */
    currentLevel: 1,
    score: 0,
    themes: ['classic', 'ice', 'factory', 'warp'],
    currentTheme: 'classic',
    savedPlayerUpgrades: null,

    /**
     * Visual Juice: Screen shake, particles, floating text
     */
    shakeIntensity: 0,
    shakeTimer: 0,
    particles: [],
    floatingTexts: [],

    /**
     * Hazard data: Portal pairs
     */
    warps: [],
    floorGrid: {},

    stage: null,
    menu: null,
    players: [],
    bots: [],
    tiles: [],
    bombs: [],
    bonuses: [],

    playerBoyImg: null,
    playerImg: null,
    tilesImgs: {},
    bombImg: null,
    fireImg: null,
    bonusesImg: null,

    playing: false,
    mute: false,
    soundtrackLoaded: false,
    soundtrackPlaying: false,
    soundtrack: null,

    init: function() {
        this.size = {
            w: this.tileSize * this.tilesX,
            h: this.tileSize * this.tilesY
        };
        this.players = [];
        this.bots = [];
        this.tiles = [];
        this.bombs = [];
        this.bonuses = [];
        this.particles = [];
        this.floatingTexts = [];
        this.warps = [];
    },

    load: function() {
        if (createjs.DisplayObject) {
            try {
                var hitCanvas = document.createElement("canvas");
                hitCanvas.width = hitCanvas.height = 1;
                createjs.DisplayObject._hitTestCanvas = hitCanvas;
                createjs.DisplayObject._hitTestContext = hitCanvas.getContext("2d", { willReadFrequently: true });
            } catch (e) {}
        }
        if (createjs.WebAudioPlugin) {
            createjs.WebAudioPlugin.playEmptySound = function() {};
        }

        this.stage = new createjs.Stage("canvas");
        this.stage.enableMouseOver();

        this.menu = new Menu();

        var useXHR = (window.location.protocol !== 'file:');
        var queue = new createjs.LoadQueue(useXHR);
        var that = this;
        var finished = false;

        function onComplete() {
            if (finished) return;
            finished = true;
            try {
                that.playerBoyImg = queue.getResult("playerBoy") || that.playerBoyImg;
                that.playerImg = queue.getResult("player") || that.playerImg;
                that.tilesImgs.grass = queue.getResult("tile_grass") || that.tilesImgs.grass;
                that.tilesImgs.wall = queue.getResult("tile_wall") || that.tilesImgs.wall;
                that.tilesImgs.wood = queue.getResult("tile_wood") || that.tilesImgs.wood;
                that.bombImg = queue.getResult("bomb") || that.bombImg;
                that.fireImg = queue.getResult("fire") || that.fireImg;
                that.bonusesImg = queue.getResult("bonuses") || that.bonusesImg;
            } catch (e) {
                console.warn("Preload getResult warning:", e);
            }
            try {
                that.setup();
            } catch (e) {
                console.error("Setup error:", e);
                if (that.menu) {
                    that.menu.hideLoader();
                    that.menu.show();
                }
            }
        }

        queue.addEventListener("complete", onComplete);
        queue.addEventListener("error", function(err) {
            console.warn("Preload error fallback:", err);
            onComplete();
        });

        setTimeout(function() {
            if (!finished) {
                console.warn("Preload safety timer triggered setup");
                onComplete();
            }
        }, 1500);

        queue.loadManifest([
            {id: "playerBoy", src: "img/george.png"},
            {id: "player", src: "img/bomberman.png"},
            {id: "tile_grass", src: "img/tile_grass.png"},
            {id: "tile_wall", src: "img/tile_wall.png"},
            {id: "tile_wood", src: "img/tile_wood.png"},
            {id: "bomb", src: "img/bomb.png"},
            {id: "fire", src: "img/fire.png"},
            {id: "bonuses", src: "img/bonuses.png"}
        ]);

        if (window.location.protocol === 'file:') {
            createjs.Sound.registerPlugins([createjs.HTMLAudioPlugin]);
        }
        createjs.Sound.addEventListener("fileload", this.onSoundLoaded);
        createjs.Sound.alternateExtensions = ["mp3"];
        createjs.Sound.registerSound("sound/bomb.ogg", "bomb");
        createjs.Sound.registerSound("sound/game.ogg", "game");
    },

    setup: function() {
        if (!gInputEngine.bindings.length) {
            gInputEngine.setup();
        }

        this.bombs = [];
        this.tiles = [];
        this.floorGrid = {};
        this.bonuses = [];
        this.particles = [];
        this.floatingTexts = [];
        this.warps = [];

        // Set current theme from level
        this.currentTheme = this.themes[(this.currentLevel - 1) % this.themes.length];

        // Draw tiles according to theme hazards
        this.drawTiles();
        this.drawBonuses();

        if (this.playersCount >= 1) {
            this.spawnBots();
            this.spawnPlayers();
        }

        gInputEngine.addListener('mute', this.toggleSound);

        setTimeout(function() {
            gInputEngine.addListener('restart', function() {
                if (gGameEngine.playersCount == 0) {
                    gGameEngine.menu.setMode('single');
                } else {
                    gGameEngine.menu.hide();
                    gGameEngine.restart();
                }
            });
        }, 200);

        gInputEngine.addListener('escape', function() {
            if (!gGameEngine.menu.visible) {
                gGameEngine.menu.show();
            }
        });

        if (!createjs.Ticker.hasEventListener('tick')) {
            createjs.Ticker.addEventListener('tick', gGameEngine.update);
            createjs.Ticker.setFPS(this.fps);
        }

        if (gGameEngine.playersCount > 0) {
            if (this.soundtrackLoaded) {
                this.playSoundtrack();
            }
        }

        if (!this.playing) {
            this.menu.show();
        }

        this.updateHud();
    },

    onSoundLoaded: function(sound) {
        if (sound.id == 'game') {
            gGameEngine.soundtrackLoaded = true;
            if (gGameEngine.playersCount > 0) {
                gGameEngine.playSoundtrack();
            }
        }
    },

    playSoundtrack: function() {
        if (!gGameEngine.soundtrackPlaying) {
            try {
                gGameEngine.soundtrack = createjs.Sound.play("game", "none", 0, 0, -1);
                if (gGameEngine.soundtrack && gGameEngine.soundtrack.setVolume) {
                    gGameEngine.soundtrack.setVolume(0.3);
                }
                gGameEngine.soundtrackPlaying = true;
            } catch (e) {
                console.warn("Could not play soundtrack:", e);
            }
        }
    },

    addScore: function(pts) {
        this.score = (this.score || 0) + pts;
        this.updateHud();
    },

    triggerScreenShake: function(intensity, duration) {
        this.shakeIntensity = intensity || 6;
        this.shakeTimer = duration || 10;
    },

    updateScreenShake: function() {
        var canvas = document.getElementById('canvas');
        if (!canvas) return;

        if (this.shakeTimer > 0) {
            this.shakeTimer--;
            var decay = this.shakeTimer / 10;
            var dx = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
            var dy = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
            canvas.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)';
        } else if (canvas.style.transform) {
            canvas.style.transform = 'none';
        }
    },

    spawnDebris: function(position, type) {
        var pixels = Utils.convertToBitmapPosition(position);
        var cx = pixels.x + 16;
        var cy = pixels.y + 16;
        var count = 8;
        var colors = (type === 'ice') ? ['#bae6fd', '#38bdf8', '#ffffff'] : ['#b45309', '#d97706', '#f59e0b', '#78350f'];

        for (var i = 0; i < count; i++) {
            var shape = new createjs.Shape();
            var col = colors[Math.floor(Math.random() * colors.length)];
            var sz = Math.random() * 5 + 3;
            shape.graphics.beginFill(col).drawRect(-sz / 2, -sz / 2, sz, sz);
            shape.x = cx;
            shape.y = cy;
            this.stage.addChild(shape);

            var angle = Math.random() * Math.PI * 2;
            var speed = Math.random() * 4 + 2;
            this.particles.push({
                shape: shape,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                gravity: 0.25,
                rot: (Math.random() - 0.5) * 20,
                life: 25
            });
        }
    },

    updateParticles: function() {
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];
            p.shape.x += p.vx;
            p.shape.y += p.vy;
            p.vy += p.gravity;
            p.shape.rotation += p.rot;
            p.life--;
            p.shape.alpha = p.life / 25;

            if (p.life <= 0) {
                this.stage.removeChild(p.shape);
                this.particles.splice(i, 1);
            }
        }
    },

    spawnFloatingText: function(x, y, text, color) {
        var t = new createjs.Text(text, "bold 13px 'Plus Jakarta Sans', Arial, sans-serif", color || "#fbbf24");
        t.x = x - (t.getMeasuredWidth() / 2) + 16;
        t.y = y - 10;
        t.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        this.stage.addChild(t);

        this.floatingTexts.push({
            text: t,
            life: 35,
            vy: -1.2
        });
    },

    updateFloatingTexts: function() {
        for (var i = this.floatingTexts.length - 1; i >= 0; i--) {
            var ft = this.floatingTexts[i];
            ft.text.y += ft.vy;
            ft.life--;
            ft.text.alpha = Math.min(1, ft.life / 15);

            if (ft.life <= 0) {
                this.stage.removeChild(ft.text);
                this.floatingTexts.splice(i, 1);
            }
        }
    },

    teleportEntity: function(entity) {
        if (!this.warps || this.warps.length < 2) return;

        // Find which portal entity is currently on
        var currentPortal = null;
        var partnerPortal = null;

        for (var i = 0; i < this.warps.length; i++) {
            var w = this.warps[i];
            if (Utils.comparePositions(w.pos, entity.position)) {
                currentPortal = w;
                partnerPortal = w.partner;
                break;
            }
        }

        if (partnerPortal) {
            entity.position = { x: partnerPortal.pos.x, y: partnerPortal.pos.y };
            var pixels = Utils.convertToBitmapPosition(entity.position);
            entity.bmp.x = pixels.x;
            entity.bmp.y = pixels.y;

            if (window.AudioSynth) {
                AudioSynth.play('warp');
            }

            this.spawnDebris(currentPortal.pos, 'ice');
            this.spawnDebris(partnerPortal.pos, 'ice');
            this.spawnFloatingText(entity.bmp.x, entity.bmp.y, 'WARP!', '#c084fc');
        }
    },

    nextLevel: function() {
        // Save player powerup inventory
        if (this.players && this.players[0]) {
            var p = this.players[0];
            this.savedPlayerUpgrades = {
                bombsMax: p.bombsMax,
                bombStrength: p.bombStrength,
                baseVelocity: p.baseVelocity,
                hasPierceBomb: p.hasPierceBomb,
                hasDetonator: p.hasDetonator,
                hasKick: p.hasKick,
                hasThrow: p.hasThrow,
                hasBombPass: p.hasBombPass,
                hasWallPass: p.hasWallPass,
                shield: Math.max(1, p.shield || 0) // reward at least 1 shield on level clear!
            };
        }

        this.currentLevel++;
        this.currentTheme = this.themes[(this.currentLevel - 1) % this.themes.length];

        this.menu.hide();
        this.restart();

        if (this.spawnFloatingText && this.players[0]) {
            var p0 = this.players[0];
            this.spawnFloatingText(p0.bmp.x, p0.bmp.y, 'LEVEL ' + this.currentLevel + ' MULAI!', '#10b981');
        }
    },

    update: function() {
        // Players
        for (var i = 0; i < gGameEngine.players.length; i++) {
            gGameEngine.players[i].update();
        }

        // Bots
        for (var i = 0; i < gGameEngine.bots.length; i++) {
            gGameEngine.bots[i].update();
        }

        // Bombs
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            gGameEngine.bombs[i].update();
        }

        // Screen Shake decay
        gGameEngine.updateScreenShake();

        // Particles & Floating Text updates
        gGameEngine.updateParticles();
        gGameEngine.updateFloatingTexts();

        // Periodic HUD update
        if (createjs.Ticker.getTicks() % 8 === 0 && gGameEngine.updateHud) {
            gGameEngine.updateHud();
        }

        // Menu
        gGameEngine.menu.update();

        // Stage
        gGameEngine.stage.update();
    },

    drawTiles: function() {
        var theme = this.currentTheme;

        // Setup warp portals for 'warp' theme
        if (theme === 'warp') {
            var p1 = { x: 2, y: 2 };
            var p2 = { x: this.tilesX - 3, y: this.tilesY - 3 };
            var p3 = { x: 2, y: this.tilesY - 3 };
            var p4 = { x: this.tilesX - 3, y: 2 };

            var w1 = { pos: p1, partner: null };
            var w2 = { pos: p2, partner: null };
            var w3 = { pos: p3, partner: null };
            var w4 = { pos: p4, partner: null };
            w1.partner = w2; w2.partner = w1;
            w3.partner = w4; w4.partner = w3;
            this.warps = [w1, w2, w3, w4];
        }

        for (var i = 0; i < this.tilesY; i++) {
            for (var j = 0; j < this.tilesX; j++) {
                var isBorderOrPillar = (i == 0 || j == 0 || i == this.tilesY - 1 || j == this.tilesX - 1)
                    || (j % 2 == 0 && i % 2 == 0);

                if (isBorderOrPillar) {
                    var tile = new Tile('wall', { x: j, y: i });
                    this.stage.addChild(tile.bmp);
                    this.tiles.push(tile);
                } else {
                    // Check special hazard tiles based on theme
                    var floorMat = 'grass';

                    if (theme === 'ice') {
                        // Ice paths on alternating corridors
                        if ((i === 4 || i === 8 || j === 4 || j === 8 || j === 12)) {
                            floorMat = 'ice';
                        }
                    } else if (theme === 'factory') {
                        // Industrial conveyor belts
                        if (i === 3 && j >= 3 && j <= 13) {
                            floorMat = 'conveyor_right';
                        } else if (i === 9 && j >= 3 && j <= 13) {
                            floorMat = 'conveyor_left';
                        } else if (j === 8 && i >= 4 && i <= 8) {
                            floorMat = 'conveyor_down';
                        }
                    } else if (theme === 'warp') {
                        // Portal tiles
                        for (var wIdx = 0; wIdx < this.warps.length; wIdx++) {
                            if (this.warps[wIdx].pos.x === j && this.warps[wIdx].pos.y === i) {
                                floorMat = 'warp';
                                break;
                            }
                        }
                    }

                    var floorTile = new Tile(floorMat, { x: j, y: i });
                    this.stage.addChild(floorTile.bmp);
                    this.floorGrid[j + '_' + i] = floorMat;

                    // Wood destructible tiles (skip corners for player/bot spawn points and portals)
                    var isCornerSpawn = (i <= 2 && j <= 2)
                        || (i >= this.tilesY - 3 && j >= this.tilesX - 3)
                        || (i <= 2 && j >= this.tilesX - 3)
                        || (i >= this.tilesY - 3 && j <= 2);

                    var isWarpTile = (floorMat === 'warp');

                    if (!isCornerSpawn && !isWarpTile) {
                        // Slightly less wood on factory conveyors to keep belts moving
                        var woodChance = (floorMat.indexOf('conveyor_') === 0) ? 0.4 : 1.0;
                        if (Math.random() <= woodChance) {
                            var wood = new Tile('wood', { x: j, y: i });
                            this.stage.addChild(wood.bmp);
                            this.tiles.push(wood);
                        }
                    }
                }
            }
        }
    },

    drawBonuses: function() {
        var woods = [];
        for (var i = 0; i < this.tiles.length; i++) {
            var tile = this.tiles[i];
            if (tile.material == 'wood') {
                woods.push(tile);
            }
        }

        woods.sort(function() {
            return 0.5 - Math.random();
        });

        var bonusPool = [
            'bomb', 'bomb', 'fire', 'fire', 'speed', 'speed',
            'pierce', 'remote', 'kick', 'throw', 'bombpass',
            'shield', 'wallpass', 'skull'
        ];

        for (var j = 0; j < 4; j++) {
            var bonusesCount = Math.round(woods.length * this.bonusesPercent * 0.01 / 4);
            var placedCount = 0;
            for (var i = 0; i < woods.length; i++) {
                if (placedCount > bonusesCount) {
                    break;
                }

                var tile = woods[i];
                if ((j == 0 && tile.position.x < this.tilesX / 2 && tile.position.y < this.tilesY / 2)
                    || (j == 1 && tile.position.x < this.tilesX / 2 && tile.position.y > this.tilesY / 2)
                    || (j == 2 && tile.position.x > this.tilesX / 2 && tile.position.y < this.tilesX / 2)
                    || (j == 3 && tile.position.x > this.tilesX / 2 && tile.position.y > this.tilesX / 2)) {

                    var chosenType = bonusPool[Math.floor(Math.random() * bonusPool.length)];
                    var bonus = new Bonus(tile.position, chosenType);
                    this.bonuses.push(bonus);

                    this.moveToFront(tile.bmp);
                    placedCount++;
                }
            }
        }
    },

    updateHud: function() {
        try {
            var p = (this.players && this.players.length) ? this.players[0] : null;

            var elLvl = document.getElementById('hud-level');
            var elTheme = document.getElementById('hud-theme');
            var elScore = document.getElementById('hud-score');
            var elBomb = document.getElementById('hud-bombs');
            var elFire = document.getElementById('hud-fire');
            var elSpeed = document.getElementById('hud-speed');
            var elShield = document.getElementById('hud-shield');
            var elPierce = document.getElementById('badge-pierce');
            var elRemote = document.getElementById('badge-remote');
            var elKick = document.getElementById('badge-kick');
            var elThrow = document.getElementById('badge-throw');
            var elBombPass = document.getElementById('badge-bombpass');
            var elWallPass = document.getElementById('badge-wallpass');
            var elCurse = document.getElementById('hud-curse');

            var themeNames = {
                'classic': 'Taman Hijau',
                'ice': 'Gua Es Licin',
                'factory': 'Pabrik Konveyor',
                'warp': 'Kuil Portal Warp'
            };

            if (elLvl) elLvl.textContent = this.currentLevel;
            if (elTheme) elTheme.textContent = themeNames[this.currentTheme] || this.currentTheme;
            if (elScore) elScore.textContent = this.score;

            function setBadge(el, active) {
                if (!el) return;
                if (active) el.classList.add('active');
                else el.classList.remove('active');
            }

            if (p) {
                if (elBomb) elBomb.textContent = p.bombsMax;
                if (elFire) elFire.textContent = p.bombStrength;
                if (elSpeed) elSpeed.textContent = (p.velocity || 2).toFixed(1);
                if (elShield) elShield.textContent = p.shield || 0;

                setBadge(elPierce, p.hasPierceBomb);
                setBadge(elRemote, p.hasDetonator);
                setBadge(elKick, p.hasKick);
                setBadge(elThrow, p.hasThrow);
                setBadge(elBombPass, p.hasBombPass);
                setBadge(elWallPass, p.hasWallPass);

                if (elCurse) {
                    if (p.curse) {
                        var sec = Math.ceil(p.curseTimer / 50);
                        var curseNames = {
                            'diarrhea': 'Diare Bom',
                            'snail': 'Siput',
                            'reverse': 'Kontrol Terbalik',
                            'amnesia': 'Amnesia'
                        };
                        var cName = curseNames[p.curse] || p.curse;
                        elCurse.innerHTML = '<i class="fas fa-skull"></i> ' + cName + ' (' + sec + 's)';
                        elCurse.style.display = 'inline-flex';
                    } else {
                        elCurse.style.display = 'none';
                    }
                }
            } else {
                if (elBomb) elBomb.textContent = 1;
                if (elFire) elFire.textContent = 1;
                if (elSpeed) elSpeed.textContent = "2.0";
                if (elShield) elShield.textContent = 0;
                [elPierce, elRemote, elKick, elThrow, elBombPass, elWallPass].forEach(function(el) {
                    setBadge(el, false);
                });
                if (elCurse) elCurse.style.display = 'none';
            }
        } catch (e) {}
    },

    spawnBots: function() {
        this.bots = [];
        if (this.playersCount === 0) return;

        // Increase bot count on higher levels (up to 3 bots)
        var botTargetCount = Math.min(3, 1 + Math.floor(this.currentLevel / 2));
        if (this.playersCount === 2) botTargetCount = 2;

        var botPositions = [
            { x: 1, y: this.tilesY - 2 },
            { x: this.tilesX - 2, y: 1 },
            { x: this.tilesX - 2, y: this.tilesY - 2 }
        ];

        for (var i = 0; i < botTargetCount; i++) {
            var b = new Bot(botPositions[i]);
            // Speed scales slightly with level
            b.velocity = Math.min(2.4, 1.6 + (this.currentLevel * 0.12));
            this.bots.push(b);
        }
    },

    spawnPlayers: function() {
        this.players = [];
        if (this.playersCount === 0) return;

        var player1 = new Player({ x: 1, y: 1 });
        this.players.push(player1);

        // Restore saved powerups from previous level clear!
        if (this.savedPlayerUpgrades) {
            var u = this.savedPlayerUpgrades;
            player1.bombsMax = u.bombsMax;
            player1.bombStrength = u.bombStrength;
            player1.baseVelocity = u.baseVelocity;
            player1.velocity = u.baseVelocity;
            player1.hasPierceBomb = u.hasPierceBomb;
            player1.hasDetonator = u.hasDetonator;
            player1.hasKick = u.hasKick;
            player1.hasThrow = u.hasThrow;
            player1.hasBombPass = u.hasBombPass;
            player1.hasWallPass = u.hasWallPass;
            player1.shield = u.shield;
        }

        if (this.playersCount >= 2) {
            var controls = {
                'up': 'up2',
                'left': 'left2',
                'down': 'down2',
                'right': 'right2',
                'bomb': 'bomb2',
                'detonate': 'detonate2',
                'throw': 'throw2'
            };
            var player2 = new Player({ x: this.tilesX - 2, y: this.tilesY - 2 }, controls, 1);
            this.players.push(player2);
        }
    },

    getTile: function(position) {
        for (var i = 0; i < this.tiles.length; i++) {
            var tile = this.tiles[i];
            if (tile.position.x == position.x && tile.position.y == position.y) {
                return tile;
            }
        }
        return null;
    },

    getFloorMaterial: function(position) {
        if (!position) return 'grass';
        return this.floorGrid[position.x + '_' + position.y] || 'grass';
    },

    getTileMaterial: function(position) {
        var tile = this.getTile(position);
        if (tile) {
            return tile.material;
        }
        return this.getFloorMaterial(position);
    },

    gameOver: function(status) {
        if (gGameEngine.menu.visible) { return; }

        if (status == 'win') {
            // Victory! Award level bonus points and fanfare
            this.addScore(1000 * this.currentLevel);

            if (window.AudioSynth) {
                AudioSynth.play('win');
            }

            // Show level clear screen with Next Level progression!
            this.menu.show(null, true);
        } else {
            // Game Over
            this.menu.show([{text: 'Game Over', color: '#CC0000'}, {text: ' :(', color: '#FF4444'}], false);
        }
    },

    getWinner: function() {
        for (var i = 0; i < gGameEngine.players.length; i++) {
            var player = gGameEngine.players[i];
            if (player.alive) {
                return i;
            }
        }
        return 0;
    },

    restart: function() {
        gInputEngine.removeAllListeners();
        gGameEngine.stage.removeAllChildren();
        gGameEngine.setup();
    },

    moveToFront: function(child) {
        var children = gGameEngine.stage.getNumChildren();
        gGameEngine.stage.setChildIndex(child, children - 1);
    },

    intersectRect: function(r1, r2) {
        return !(r2.left > r1.right ||
                 r2.right < r1.left ||
                 r2.top > r1.bottom ||
                 r2.bottom < r1.top);
    },

    toggleSound: function() {
        if (gGameEngine.mute) {
            gGameEngine.mute = false;
            if (gGameEngine.soundtrack && gGameEngine.soundtrack.resume) {
                gGameEngine.soundtrack.resume();
            }
        } else {
            gGameEngine.mute = true;
            if (gGameEngine.soundtrack && gGameEngine.soundtrack.pause) {
                gGameEngine.soundtrack.pause();
            }
        }
    },

    countPlayersAlive: function() {
        var playersAlive = 0;
        for (var i = 0; i < gGameEngine.players.length; i++) {
            if (gGameEngine.players[i].alive) {
                playersAlive++;
            }
        }
        return playersAlive;
    },

    getPlayersAndBots: function() {
        var entities = [];
        for (var i = 0; i < gGameEngine.players.length; i++) {
            entities.push(gGameEngine.players[i]);
        }
        for (var i = 0; i < gGameEngine.bots.length; i++) {
            entities.push(gGameEngine.bots[i]);
        }
        return entities;
    }
});

gGameEngine = new GameEngine();