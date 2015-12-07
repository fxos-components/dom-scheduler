(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("fxos-component"));
	else if(typeof define === 'function' && define.amd)
		define(["fxos-component"], factory);
	else if(typeof exports === 'object')
		exports["FXOSDialog"] = factory(require("fxos-component"));
	else
		root["FXOSDialog"] = factory(root["fxosComponent"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Dependencies
	 */
	var component = __webpack_require__(1);

	/**
	 * Simple logger (toggle 0)
	 *
	 * @type {Function}
	 */
	var debug = 0 ? console.log.bind(console, '[fxos-dialog]') : () => {};

	/**
	 * Use the dom-scheduler if it's around,
	 * else fallback to fake shim.
	 *
	 * @type {Object}
	 */
	var schedule = window.scheduler || {
	  mutation: block => Promise.resolve(block()),
	  transition: (block, el, event, timeout) => {
	    block();
	    return after(el, event, timeout || 500);
	  }
	};

	/**
	 * Exports
	 */

	module.exports = component.register('fxos-dialog', {
	  created() {
	    this.setupShadowRoot();

	    this.els = {
	      inner: this.shadowRoot.querySelector('.dialog-inner'),
	      background: this.shadowRoot.querySelector('.background'),
	      window: this.shadowRoot.querySelector('.window')
	    };

	    this.shadowRoot.addEventListener('click', e => this.onClick(e));

	    setTimeout(() => this.makeAccessible());
	  },

	  makeAccessible() {
	    this.setAttribute('role', 'dialog');
	  },

	  onClick(e) {
	    var el = e.target.closest('[on-click]');
	    if (!el) { return; }
	    debug('onClick');
	    var method = el.getAttribute('on-click');
	    if (typeof this[method] == 'function') { this[method](); }
	  },

	  open(options) {
	    if (this.isOpen) { return; }
	    debug('open dialog');
	    this.isOpen = true;

	    return this.show()
	      .then(() => this.animateBackgroundIn(options))
	      .then(() => this.animateWindowIn())
	      .then(() => this.dispatch('opened'));
	  },

	  close(options) {
	    if (!this.isOpen) { return; }
	    debug('close dialog');
	    this.isOpen = false;

	    return this.animateWindowOut()
	      .then(() => this.animateBackgroundOut())
	      .then(() => this.hide())
	      .then(() => this.dispatch('closed'));
	  },

	  animateBackgroundIn(options) {
	    if (options) { return this.animateBackgroundInFrom(options); }

	    var el = this.els.background;
	    return schedule.transition(() => {
	      debug('animate background in');
	      el.classList.remove('animate-out');
	      el.classList.add('animate-in');
	    }, el, 'animationend');
	  },

	  animateBackgroundOut() {
	    var el = this.els.background;
	    return schedule.transition(() => {
	      debug('animate background out');
	      el.classList.add('animate-out');
	      el.classList.remove('animate-in');
	    }, el, 'animationend')
	      .then(() => el.style = '');
	  },

	  animateBackgroundInFrom(pos) {
	    var el = this.els.background;
	    var scale = Math.sqrt(window.innerWidth * window.innerHeight) / 15;
	    var duration = scale * 9;

	    return schedule.mutation(() => {
	        el.classList.add('circular');
	        el.classList.remove('animate-out');
	        el.style.transform = `translate(${pos.clientX}px, ${pos.clientY}px)`;
	        el.style.transitionDuration = duration + 'ms';
	        el.offsetTop; // Hack, any ideas?
	      })

	      .then(() => {
	        return schedule.transition(() => {
	          debug('animate background in from', pos);
	          el.style.transform += ` scale(${scale})`;
	          el.style.opacity = 1;
	        }, el, 'transitionend', duration * 1.5);
	      });
	  },

	  show() {
	    return schedule.mutation(() => {
	      debug('show');
	      this.style.display = 'block';
	    });
	  },

	  hide() {
	    return schedule.mutation(() => {
	      debug('hide');
	      this.style.display = 'none';
	    });
	  },

	  animateWindowIn() {
	    debug('animate window in');
	    var el = this.els.window;
	    return schedule.transition(() => {
	      debug('animate window in');
	      el.classList.add('animate-in');
	      el.classList.remove('animate-out');
	    }, el, 'animationend');
	  },

	  animateWindowOut() {
	    debug('animate window out');
	    var el = this.els.window;
	    return schedule.transition(() => {
	        el.classList.add('animate-out');
	        el.classList.remove('animate-in');
	      }, el, 'animationend')
	      .then(() => el.classList.remove('animate-out'));
	  },

	  dispatch(name) {
	    this.dispatchEvent(new CustomEvent(name));
	  },

	  attrs: {
	    opened: {
	      get: function() { return !!this.isOpen; },
	      set: function(value) {
	        value = value === '' || value;
	        if (!value) { this.close(); }
	        else { this.open(); }
	      }
	    }
	  },

	  template: `
	    <div class="dialog-inner">
	      <div class="background" on-click="close"></div>
	      <div class="window"><content></content></div>
	    </div>
	    <style>
	      ::content * {
	        box-sizing: border-box;
	        font-weight: inherit;
	        font-size: inherit;
	      }

	      ::content p,
	      ::content h1,
	      ::content h2,
	      ::content h3,
	      ::content h4,
	      ::content button,
	      ::content fieldset {
	        padding: 0;
	        margin: 0;
	        border: 0;
	      }

	      :host {
	        display: none;
	        position: fixed;
	        top: 0px;
	        left: 0px;
	        z-index: 200;

	        width: 100%;
	        height: 100%;
	        overflow: hidden;

	        font-size: 17px;
	        font-style: italic;
	        font-weight: 300;
	        text-align: center;

	        color:
	          var(--fxos-dialog-color,
	          var(--fxos-color));
	      }

	      .dialog-inner {
	        display: flex;
	        width: 100%;
	        height: 100%;
	        padding: 20px;
	        box-sizing: border-box;

	        align-items: center;
	        justify-content: center;
	      }

	      .background {
	        position: absolute;
	        top: 0; left: 0;
	        width: 100%;
	        height: 100%;
	        opacity: 0;
	        background:
	          var(--fxos-dialog-background,
	          rgba(199,199,199,0.85));
	      }

	      /**
	       * .circular
	       */

	      .background.circular {
	        width: 40px;
	        height: 40px;
	        margin: -20px;
	        border-radius: 50%;
	        will-change: transform, opacity;
	        transition-property: opacity, transform;
	        transition-timing-function: linear;
	      }

	      /**
	       * .animate-in
	       */

	      .background.animate-in {
	        animation-name: fxos-dialog-fade-in;
	        animation-duration: 200ms;
	        animation-fill-mode: forwards;
	      }

	      /**
	       * .animate-out
	       */

	      .background.animate-out {
	        animation-name: fxos-dialog-fade-out;
	        animation-duration: 200ms;
	        animation-fill-mode: forwards;
	        opacity: 1;
	      }

	      .window {
	        position: relative;
	        width: 100%;
	        margin: auto;
	        box-shadow: 0 1px 0 0px rgba(0,0,0,0.15);
	        transition: opacity 300ms;
	        opacity: 0;

	        background:
	          var(--fxos-dialog-window-background,
	          var(--fxos-background));
	      }

	      @media (min-width: 360px) {
	        .window {
	          width: auto;
	          min-width: 320px;
	        }
	      }

	      .window.animate-in {
	        animation-name: fxos-dialog-entrance;
	        animation-duration: 300ms;
	        animation-timing-function: cubic-bezier(0.175, 0.885, 0.320, 1.275);
	        animation-fill-mode: forwards;
	        opacity: 1;
	      }

	      .window.animate-out {
	        animation-name: fxos-dialog-fade-out;
	        animation-duration: 150ms;
	        animation-timing-function: linear;
	        animation-fill-mode: forwards;
	        opacity: 1;
	      }

	      ::content h1 {
	        font-size: 23px;
	        line-height: 26px;
	        font-weight: 200;
	        font-style: italic;
	        color: var(--fxos-title-color);
	      }

	      ::content strong {
	        font-weight: 700;
	      }

	      ::content small {
	        font-size: 0.8em;
	      }

	      /** Section
	       ---------------------------------------------------------*/

	      ::content section {
	        padding: 30px 18px;
	      }

	      ::content section > *:not(:last-child) {
	        margin-bottom: 13px;
	      }

	      /** Paragraphs
	       ---------------------------------------------------------*/

	      ::content p {
	        text-align: start;
	        line-height: 1.3em;
	      }

	      /** Buttons
	       ---------------------------------------------------------*/

	      ::content button {
	        position: relative;

	        display: block;
	        width: 100%;
	        height: 50px;
	        border: 0;
	        padding: 0 16px;

	        font: inherit;
	        color: inherit;
	        cursor: pointer;
	        transition: all 200ms;
	        transition-delay: 300ms;
	        border-radius: 0;
	        background:
	          var(--fxos-dialog-button-background,
	          var(--fxos-button-background));
	      }

	      /**
	       * .primary
	       */

	      ::content button.primary {
	        color:
	          var(--fxos-primary-button-color,
	          var(--fxos-brand-color));
	      }

	      /**
	       * .danger
	       */

	      ::content button.danger {
	        color: var(--fxos-color-destructive);
	      }

	      /**
	       * Disabled buttons
	       */

	      ::content button[disabled] {
	        color: var(--fxos-dialog-disabled-color);
	      }

	      ::content button:after {
	        content: '';
	        display: block;
	        position: absolute;
	        height: 1px;
	        left: 6px;
	        right: 6px;
	        top: 49px;
	        background:
	          var(--fxos-dialog-button-background,
	          var(--fxos-background));
	      }

	      ::content button:last-of-type:after {
	        display: none;
	      }

	      ::content button:active {
	        color:
	          var(--fxos-dialog-button-active-color,
	          var(--fxos-button-active-color, #fff));
	        transition: none;
	        background:
	          var(--fxos-dialog-button-background-active,
	          var(--fxos-brand-color));
	      }

	      ::content button:active:after {
	        background:
	          var(--fxos-dialog-button-background-active,
	          var(--fxos-brand-color));
	      }

	      ::content button[data-icon]:before {
	        float: left;
	      }

	      /** Fieldset (button group)
	       ---------------------------------------------------------*/

	      ::content fieldset {
	        overflow: hidden;
	      }

	      ::content fieldset button {
	        position: relative;
	        float: left;
	        width: 50%;
	      }

	      ::content fieldset button:after {
	        content: '';
	        display: block;
	        position: absolute;
	        top: 6px;
	        bottom: 6px;
	        right: 0px;
	        left: auto;
	        width: 1px;
	        height: calc(100% - 12px);
	        transition: all 200ms;
	        transition-delay: 200ms;

	        background:
	          var(--fxos-dialog-button-background,
	          var(--fxos-background));
	      }
	    </style>`,

	  globalCss: `
	    @keyframes fxos-dialog-entrance {
	      0% { transform: translateY(100px); }
	      100% { transform: translateY(0px); }
	    }

	    @keyframes fxos-dialog-fade-in {
	      0% { opacity: 0 }
	      100% { opacity: 1 }
	    }

	    @keyframes fxos-dialog-fade-out {
	      0% { opacity: 1 }
	      100% { opacity: 0 }
	    }`
	});

	/**
	 * Utils
	 */

	function after(target, event, timeout) {
	  return new Promise(resolve => {
	    var timer = timeout && setTimeout(cb, timeout);
	    target.addEventListener(event, cb);
	    function cb() {
	      target.removeEventListener(event, cb);
	      clearTimeout(timer);
	      resolve();
	    }
	  });
	}


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }
/******/ ])
});
;