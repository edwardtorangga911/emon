/**
 * AudioSynth - Zero-dependency 8-bit Sound Synthesizer using Web Audio API
 */
var AudioSynth = (function() {
    var ctx = null;

    function getContext() {
        if (!ctx) {
            var AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                ctx = new AudioCtx();
            }
        }
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    // Unlock audio context on user interaction
    ['click', 'touchstart', 'keydown'].forEach(function(evt) {
        document.addEventListener(evt, function() {
            getContext();
        }, { once: true, passive: true });
    });

    return {
        play: function(type) {
            if (window.gGameEngine && window.gGameEngine.mute) {
                return;
            }
            var ac = getContext();
            if (!ac) return;

            var now = ac.currentTime;

            try {
                if (type === 'pickup') {
                    // Ascending chime
                    var osc = ac.createOscillator();
                    var gain = ac.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                    osc.connect(gain);
                    gain.connect(ac.destination);
                    osc.start(now);
                    osc.stop(now + 0.2);
                } else if (type === 'kick') {
                    // Slide kick
                    var osc = ac.createOscillator();
                    var gain = ac.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(220, now);
                    osc.frequency.linearRampToValueAtTime(110, now + 0.12);
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                    osc.connect(gain);
                    gain.connect(ac.destination);
                    osc.start(now);
                    osc.stop(now + 0.15);
                } else if (type === 'throw') {
                    // Whoosh throw
                    var osc = ac.createOscillator();
                    var gain = ac.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(300, now);
                    osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);
                    osc.frequency.exponentialRampToValueAtTime(350, now + 0.25);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                    osc.connect(gain);
                    gain.connect(ac.destination);
                    osc.start(now);
                    osc.stop(now + 0.25);
                } else if (type === 'shield_break') {
                    // Glass / electric shield hit
                    var osc = ac.createOscillator();
                    var gain = ac.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
                    gain.gain.setValueAtTime(0.35, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                    osc.connect(gain);
                    gain.connect(ac.destination);
                    osc.start(now);
                    osc.stop(now + 0.35);
                } else if (type === 'curse') {
                    // Ominous descending tritone
                    var osc = ac.createOscillator();
                    var gain = ac.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(350, now);
                    osc.frequency.linearRampToValueAtTime(180, now + 0.35);
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                    osc.connect(gain);
                    gain.connect(ac.destination);
                    osc.start(now);
                    osc.stop(now + 0.4);
                } else if (type === 'detonate') {
                    // Double high beep
                    var osc = ac.createOscillator();
                    var gain = ac.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1200, now);
                    osc.frequency.setValueAtTime(1600, now + 0.08);
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
                    osc.connect(gain);
                    gain.connect(ac.destination);
                    osc.start(now);
                    osc.stop(now + 0.16);
                } else if (type === 'plant') {
                    // Pop drop
                    var osc = ac.createOscillator();
                    var gain = ac.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(180, now);
                    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
                    osc.connect(gain);
                    gain.connect(ac.destination);
                    osc.start(now);
                    osc.stop(now + 0.09);
                }
            } catch (err) {
                console.warn('AudioSynth error:', err);
            }
        }
    };
})();
