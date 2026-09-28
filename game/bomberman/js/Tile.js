Tile = Entity.extend({
    /**
     * Entity position on map grid
     */
    position: {},

    /**
     * Bitmap dimensions
     */
    size: {
        w: 32,
        h: 32
    },

    /**
     * Bitmap animation
     */
    bmp: null,

    material: '',

    init: function(material, position) {
        this.material = material;
        this.position = position;

        var imgOrCanvas = null;

        if (material == 'grass') {
            imgOrCanvas = gGameEngine.tilesImgs.grass;
        } else if (material == 'wall') {
            imgOrCanvas = gGameEngine.tilesImgs.wall;
        } else if (material == 'wood') {
            imgOrCanvas = gGameEngine.tilesImgs.wood;
        } else {
            // Hazard materials (ice, conveyor, warp) generated via Canvas 2D
            imgOrCanvas = Tile.getTileCanvas(material);
        }

        this.bmp = new createjs.Bitmap(imgOrCanvas);
        var pixels = Utils.convertToBitmapPosition(position);
        this.bmp.x = pixels.x;
        this.bmp.y = pixels.y;
    },

    update: function() {
    },

    remove: function() {
        // Spawn debris particles if wood was destroyed
        if (this.material === 'wood' && gGameEngine.spawnDebris) {
            gGameEngine.spawnDebris(this.position, 'wood');
            if (gGameEngine.addScore) {
                gGameEngine.addScore(50);
            }
        }

        gGameEngine.stage.removeChild(this.bmp);
        for (var i = 0; i < gGameEngine.tiles.length; i++) {
            var tile = gGameEngine.tiles[i];
            if (this == tile) {
                gGameEngine.tiles.splice(i, 1);
            }
        }
    }
});

// Canvas 2D generator for hazard & themed tiles
Tile.tileCache = {};

Tile.getTileCanvas = function(material) {
    if (Tile.tileCache[material]) {
        return Tile.tileCache[material];
    }

    var c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    var ctx = c.getContext('2d');

    if (material === 'ice') {
        // Frosted ice tile with glistening cracks
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(0, 0, 32, 32);

        var iceGrad = ctx.createLinearGradient(0, 0, 32, 32);
        iceGrad.addColorStop(0, '#e0f2fe');
        iceGrad.addColorStop(0.5, '#7dd3fc');
        iceGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = iceGrad;
        ctx.fillRect(1, 1, 30, 30);

        // Ice crystal fractures
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(4, 8); ctx.lineTo(14, 18); ctx.lineTo(26, 12);
        ctx.moveTo(14, 18); ctx.lineTo(18, 28);
        ctx.stroke();

        // Sparkle glint
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 6, 2, 2);
        ctx.fillRect(24, 20, 2, 2);
    } else if (material.indexOf('conveyor_') === 0) {
        var dir = material.split('_')[1];

        // Industrial steel belt
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 32, 32);

        ctx.fillStyle = '#334155';
        ctx.fillRect(2, 2, 28, 28);

        // Belt track rollers
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(2, 2, 28, 28);

        // Bright yellow chevron arrows pointing in direction
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1;

        ctx.save();
        ctx.translate(16, 16);
        if (dir === 'left') ctx.rotate(Math.PI);
        else if (dir === 'up') ctx.rotate(-Math.PI / 2);
        else if (dir === 'down') ctx.rotate(Math.PI / 2);

        // Double chevron arrow pointing right
        ctx.beginPath();
        ctx.moveTo(-6, -6); ctx.lineTo(0, 0); ctx.lineTo(-6, 6);
        ctx.moveTo(2, -6); ctx.lineTo(8, 0); ctx.lineTo(2, 6);
        ctx.stroke();
        ctx.restore();
    } else if (material === 'warp') {
        // Mystical swirling vortex portal
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 32, 32);

        var vortex = ctx.createRadialGradient(16, 16, 2, 16, 16, 15);
        vortex.addColorStop(0, '#ffffff');
        vortex.addColorStop(0.3, '#c084fc');
        vortex.addColorStop(0.7, '#6b21a8');
        vortex.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = vortex;
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.fill();

        // Swirling portal ring
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(16, 16, 10, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(16, 16, 6, Math.PI, Math.PI * 2.5);
        ctx.stroke();
    }

    Tile.tileCache[material] = c;
    return c;
};