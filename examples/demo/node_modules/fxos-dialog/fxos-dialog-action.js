(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./fxos-dialog"), require("fxos-component"));
	else if(typeof define === 'function' && define.amd)
		define(["./fxos-dialog", "fxos-component"], factory);
	else if(typeof exports === 'object')
		exports["FXOSDialogAction"] = factory(require("./fxos-dialog"), require("fxos-component"));
	else
		root["FXOSDialogAction"] = factory(root["FXOSDialog"], root["fxosComponent"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_2__) {
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

	var GaiaDialogProto = __webpack_require__(1).prototype;
	var component = __webpack_require__(2);

	/**
	 * Exports
	 */
	module.exports = component.register('fxos-dialog-action', {
	  created: function() {
	    this.setupShadowRoot();

	    this.els = {
	      dialog: this.shadowRoot.querySelector('fxos-dialog'),
	      submit: this.shadowRoot.querySelector('.submit'),
	      cancel: this.shadowRoot.querySelector('.cancel')
	    };

	    this.els.dialog.addEventListener('closed',
	      GaiaDialogProto.hide.bind(this));
	  },

	  open: function(e) {
	    return GaiaDialogProto.show.call(this)
	      .then(() => this.els.dialog.open(e));
	  },

	  close: function() {
	    // First close (hide) inner dialog and then the container.
	    return this.els.dialog.close()
	      .then(GaiaDialogProto.hide.bind(this));
	  },

	  template: `
	    <fxos-dialog>
	      <section>
	        <content select="h1"></content>
	      </section>
	      <content select="button"></content>
	      <button on-click="close" class="cancel">Cancel</button>
	    </fxos-dialog>
	    <style>
	      :host {
	        position: fixed;
	        width: 100%;
	        height: 100%;
	        z-index: 999;

	        display: none;
	      }

	      fxos-dialog section {
	        max-width: 320px;
	      }

	      ::content button {
	        position: relative;

	        display: block;
	        width: 100%;
	        height: 50px;
	        padding: 0 16px;
	        border: 0;
	        margin: 0;

	        font: inherit;
	        color: inherit;
	        transition: all 200ms;
	        transition-delay: 300ms;
	        background:
	          var(--fxos-dialog-button-background,
	          var(--fxos-button-background));
	      }

	      ::content h1 {
	        margin: 0;
	        font-size: 23px;
	        line-height: 26px;
	        font-weight: 200;
	        font-style: italic;
	        color: var(--fxos-title-color);
	      }

	      ::content button:after {
	        content: '';
	        display: block;
	        position: absolute;
	        height: 1px;
	        left: 6px;
	        right: 6px;
	        top: 49px;
	        background: #E7E7E7;
	      }

	      ::content button:last-child:after {
	        display: none;
	      }

	      ::content button:active {
	        background: var(--fxos-dialog-button-background-active);
	        color: var(--fxos-dialog-button-color-active);
	        transition: none;
	      }

	      ::content button:active:after {
	        background: var(--fxos-dialog-button-color-active);
	        transition: none;
	      }
	    </style>`
	});


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }
/******/ ])
});
;