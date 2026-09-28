Bonus = Entity.extend({
    types: [
        'bomb',      // 0: Bomb Up (+1 kuota bom)
        'fire',      // 1: Fire Up (+1 jangkauan api)
        'speed',     // 2: Speed Up (+kecepatan gerak)
        'pierce',    // 3: Spike / Piercing Bomb (api tembus banyak balok rapuh)
        'remote',    // 4: Detonator (bom meledak via pemicu)
        'kick',      // 5: Bomb Kick (tendang bom meluncur)
        'throw',     // 6: Bomb Throw (lempar bom lewat tembok)
        'bombpass',  // 7: Bomb Pass (jalan tembus bom)
        'shield',    // 8: Shield (tahan 1x ledakan/musuh)
        'wallpass',  // 9: Wall Pass (jalan tembus balok kayu)
        'skull'      // 10: Tengkorak / Kutukan acak
    ],

    type: '',
    position: {},
    bmp: null,

    init: function(position, typeInput) {
        if (typeof typeInput === 'number') {
            this.type = this.types[typeInput % this.types.length];
        } else if (typeof typeInput === 'string') {
            this.type = typeInput;
        } else {
            this.type = 'bomb';
        }

        this.position = position;

        var canvas = Bonus.getIconCanvas(this.type);
        this.bmp = new createjs.Bitmap(canvas);

        var pixels = Utils.convertToBitmapPosition(position);
        this.bmp.x = pixels.x;
        this.bmp.y = pixels.y;

        // Subtle gentle bobbing animation
        createjs.Tween.get(this.bmp, { loop: true })
            .to({ y: pixels.y - 2 }, 600, createjs.Ease.sineInOut)
            .to({ y: pixels.y + 2 }, 600, createjs.Ease.sineInOut);

        gGameEngine.stage.addChild(this.bmp);
    },

    destroy: function() {
        createjs.Tween.removeTweens(this.bmp);
        gGameEngine.stage.removeChild(this.bmp);
        Utils.removeFromArray(gGameEngine.bonuses, this);
    }
});

// Icon metadata definition
Bonus.METADATA = {
    'bomb':     { name: 'Bomb Up', desc: 'Tambah kuota bom (+1)', category: 'Serangan', color: '#38bdf8', icon: 'fa-bomb' },
    'fire':     { name: 'Fire Up', desc: 'Jarak ledakan lebih luas (+1)', category: 'Serangan', color: '#f97316', icon: 'fa-fire' },
    'speed':    { name: 'Speed Up', desc: 'Kecepatan lari bertambah', category: 'Mobilitas', color: '#10b981', icon: 'fa-bolt' },
    'pierce':   { name: 'Bom Tembus', desc: 'Api bom menembus balok rapuh', category: 'Serangan', color: '#ef4444', icon: 'fa-bullseye' },
    'remote':   { name: 'Remote Bom', desc: 'Bom meledak via tombol pemicu', category: 'Serangan', color: '#8b5cf6', icon: 'fa-satellite-dish' },
    'kick':     { name: 'Tendang Bom', desc: 'Tabrak bom untuk meluncurkannya', category: 'Interaksi', color: '#06b6d4', icon: 'fa-shoe-prints' },
    'throw':    { name: 'Lempar Bom', desc: 'Ambil & lempar bom 3 petak (F / C)', category: 'Interaksi', color: '#ec4899', icon: 'fa-hand-rock' },
    'bombpass': { name: 'Tembus Bom', desc: 'Berjalan bebas menembus bom', category: 'Interaksi', color: '#14b8a6', icon: 'fa-ghost' },
    'shield':   { name: 'Perisai Hati', desc: 'Kebal 1x serangan / ledakan', category: 'Pertahanan', color: '#eab308', icon: 'fa-shield-halved' },
    'wallpass': { name: 'Tembus Tembok', desc: 'Berjalan menembus balok kayu', category: 'Pertahanan', color: '#a855f7', icon: 'fa-dungeon' },
    'skull':    { name: 'Kutukan Tengkorak', desc: 'Efek negatif acak selama 12 detik', category: 'Kekacauan', color: '#dc2626', icon: 'fa-skull' }
};

// Canvas 2D icon generator cache
Bonus.iconCache = {};

Bonus.getIconCanvas = function(type) {
    if (Bonus.iconCache[type]) {
        return Bonus.iconCache[type];
    }

    var c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    var ctx = c.getContext('2d');

    var meta = Bonus.METADATA[type] || { color: '#38bdf8' };
    var color = meta.color;

    // Draw round tile background
    ctx.save();
    ctx.beginPath();
    var r = 6;
    var x = 1, y = 1, w = 30, h = 30;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    // Background gradient
    var grad = ctx.createLinearGradient(0, 0, 0, 32);
    grad.addColorStop(0, '#232936');
    grad.addColorStop(1, '#111622');
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = color;
    ctx.stroke();

    // Subtle inner glow
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();
    ctx.restore();

    // Draw icon graphics per type
    ctx.save();
    if (type === 'bomb') {
        // Classic black bomb + +1
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(15, 17, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(13, 14, 2, 0, Math.PI * 2);
        ctx.fill();
        // Fuse
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(17, 10);
        ctx.quadraticCurveTo(21, 8, 22, 6);
        ctx.stroke();
        // Spark
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(21, 5, 3, 3);
    } else if (type === 'fire') {
        // Big flame
        var fireGrad = ctx.createLinearGradient(16, 25, 16, 6);
        fireGrad.addColorStop(0, '#dc2626');
        fireGrad.addColorStop(0.5, '#f97316');
        fireGrad.addColorStop(1, '#fde047');
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.moveTo(16, 6);
        ctx.bezierCurveTo(22, 12, 25, 19, 21, 24);
        ctx.bezierCurveTo(18, 27, 14, 27, 11, 24);
        ctx.bezierCurveTo(7, 19, 10, 12, 16, 6);
        ctx.fill();
        // Inner white/yellow core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(16, 21, 3.5, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'speed') {
        // Neon lightning bolt / speed wing
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(18, 5);
        ctx.lineTo(9, 16);
        ctx.lineTo(15, 16);
        ctx.lineTo(12, 27);
        ctx.lineTo(23, 14);
        ctx.lineTo(17, 14);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#a7f3d0';
        ctx.lineWidth = 1;
        ctx.stroke();
    } else if (type === 'pierce') {
        // Spiked crimson star / spike bomb
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        var cx = 16, cy = 16, outerR = 10, innerR = 5.5;
        for (var i = 0; i < 8; i++) {
            var rot = (i * Math.PI) / 4;
            var x1 = cx + Math.cos(rot) * outerR;
            var y1 = cy + Math.sin(rot) * outerR;
            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            rot += Math.PI / 8;
            var x2 = cx + Math.cos(rot) * innerR;
            var y2 = cy + Math.sin(rot) * innerR;
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'remote') {
        // Detonator handset
        ctx.fillStyle = '#475569';
        ctx.fillRect(10, 11, 12, 16);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 11, 12, 16);
        // Antenna
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(13, 11);
        ctx.lineTo(13, 5);
        ctx.stroke();
        // Antenna tip LED
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(13, 5, 2, 0, Math.PI * 2);
        ctx.fill();
        // Screen & Red big button
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(12, 13, 8, 5);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(16, 22, 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'kick') {
        // Armored boot kicking right
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(9, 8);
        ctx.lineTo(16, 8);
        ctx.lineTo(16, 17);
        ctx.lineTo(24, 18);
        ctx.lineTo(24, 24);
        ctx.lineTo(9, 24);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Motion speed trail lines
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(5, 12); ctx.lineTo(8, 12);
        ctx.moveTo(4, 17); ctx.lineTo(8, 17);
        ctx.moveTo(5, 22); ctx.lineTo(8, 22);
        ctx.stroke();
    } else if (type === 'throw') {
        // Power glove throwing bomb
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(14, 18, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(8, 17, 8, 8);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(7, 22, 10, 3);
        // Tossed mini bomb arc
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(22, 11, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(17, 16, 7, -Math.PI / 2, 0);
        ctx.stroke();
    } else if (type === 'bombpass') {
        // Ghostly bomb with pass arrow
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(16, 16, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Green arrow passing through
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.moveTo(7, 16);
        ctx.lineTo(20, 16);
        ctx.lineTo(16, 12);
        ctx.lineTo(25, 16);
        ctx.lineTo(16, 20);
        ctx.lineTo(20, 16);
        ctx.closePath();
        ctx.fill();
    } else if (type === 'shield') {
        // Golden shield with cross/heart
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(16, 6);
        ctx.lineTo(25, 9);
        ctx.lineTo(24, 18);
        ctx.quadraticCurveTo(22, 25, 16, 28);
        ctx.quadraticCurveTo(10, 25, 8, 18);
        ctx.lineTo(7, 9);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // Inner blue cross / gem
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(14, 11, 4, 11);
        ctx.fillRect(10.5, 14.5, 11, 4);
    } else if (type === 'wallpass') {
        // Ghost phasing through brick
        ctx.fillStyle = '#b45309';
        ctx.fillRect(7, 9, 8, 14); // brick
        ctx.strokeStyle = '#d97706';
        ctx.strokeRect(7, 9, 8, 14);
        // Ghost shape
        ctx.fillStyle = 'rgba(232, 121, 249, 0.85)';
        ctx.beginPath();
        ctx.arc(19, 14, 6, Math.PI, 0);
        ctx.lineTo(25, 23);
        ctx.lineTo(22, 20);
        ctx.lineTo(19, 23);
        ctx.lineTo(16, 20);
        ctx.lineTo(13, 23);
        ctx.closePath();
        ctx.fill();
        // Ghost eyes
        ctx.fillStyle = '#3b0764';
        ctx.beginPath();
        ctx.arc(17.5, 14, 1.2, 0, Math.PI * 2);
        ctx.arc(21.5, 14, 1.2, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'skull') {
        // Menacing skull
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(16, 14, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(12, 18, 8, 6);
        // Eye sockets
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(13.5, 14, 2.2, 0, Math.PI * 2);
        ctx.arc(18.5, 14, 2.2, 0, Math.PI * 2);
        ctx.fill();
        // Glowing purple eye pupils
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(13.5, 14, 1, 0, Math.PI * 2);
        ctx.arc(18.5, 14, 1, 0, Math.PI * 2);
        ctx.fill();
        // Teeth
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(14, 21, 1, 3);
        ctx.fillRect(17, 21, 1, 3);
    }
    ctx.restore();

    Bonus.iconCache[type] = c;
    return c;
};