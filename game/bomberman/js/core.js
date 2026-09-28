/**
 * Modern Browser Compatibility Patches for CreateJS (EaselJS & SoundJS)
 */
(function() {
    // 1. Suppress EaselJS 2D hit-test getImageData warning with willReadFrequently: true
    if (typeof createjs !== 'undefined' && createjs.DisplayObject) {
        try {
            var hitCanvas = document.createElement('canvas');
            hitCanvas.width = 1;
            hitCanvas.height = 1;
            createjs.DisplayObject._hitTestCanvas = hitCanvas;
            createjs.DisplayObject._hitTestContext = hitCanvas.getContext('2d', { willReadFrequently: true });
        } catch (e) {}
    }

    // 2. Suppress SoundJS autoplay AudioContext warning on page load
    if (typeof createjs !== 'undefined' && createjs.WebAudioPlugin) {
        createjs.WebAudioPlugin.playEmptySound = function() {
            // No-op during page load to adhere to browser Autoplay Policy
        };
    }

    // 3. One-time user interaction gesture unlocker for WebAudio
    function unlockAudio() {
        try {
            if (typeof createjs !== 'undefined') {
                if (createjs.WebAudioPlugin && createjs.WebAudioPlugin.context) {
                    if (createjs.WebAudioPlugin.context.state === 'suspended') {
                        createjs.WebAudioPlugin.context.resume();
                    }
                }
                if (createjs.Sound && createjs.Sound.activePlugin && createjs.Sound.activePlugin.context) {
                    if (createjs.Sound.activePlugin.context.state === 'suspended') {
                        createjs.Sound.activePlugin.context.resume();
                    }
                }
            }
        } catch (e) {}
    }

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        ['click', 'touchstart', 'keydown', 'pointerdown'].forEach(function(evt) {
            document.addEventListener(evt, unlockAudio, { once: true, passive: true });
        });
    }
})();

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();