(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./fxos-dialog"), require("fxos-component"));
	else if(typeof define === 'function' && define.amd)
		define(["./fxos-dialog", "fxos-component"], factory);
	else if(typeof exports === 'object')
		exports["FXOSDialogMenu"] = factory(require("./fxos-dialog"), require("fxos-component"));
	else
		root["FXOSDialogMenu"] = factory(root["FXOSDialog"], root["fxosComponent"]);
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
	module.exports = component.register('fxos-dialog-menu', {
	  created: function() {
	    this.setupShadowRoot();
	    this.els = {
	      dialog: this.shadowRoot.querySelector('fxos-dialog'),
	      items: this.shadowRoot.querySelector('.items')
	    };

	    this.els.dialog.addEventListener('closed',
	      GaiaDialogProto.hide.bind(this));

	    setTimeout(() => this.makeAccessible());
	  },

	  makeAccessible() {
	    this.els.items.setAttribute('role', 'menu');
	    [].forEach.call(this.querySelectorAll('button'),
	      menuitem => menuitem.setAttribute('role', 'menuitem'));
	  },

	  open: function(e) {
	    return GaiaDialogProto.show.call(this)
	      .then(() => this.els.dialog.open(e));
	  },

	  close: function() {
	    return this.els.dialog.close()
	      .then(GaiaDialogProto.hide.bind(this));
	  },

	  template: `
	    <fxos-dialog>
	      <div class="items"><content select="button"></content></div>
	    </fxos-dialog>
	    <style>
	      :host {
	        display: none;
	        position: fixed;
	        width: 100%;
	        height: 100%;
	        z-index: 999;
	      }

	      ::content > button {
	        position: relative;
	        display: block;
	        width: 100%;
	        height: 50px;
	        line-height: 51px;
	        border: 0;
	        padding: 0 16px;
	        font: inherit;
	        font-style: italic;
	        text-align: start;
	        background:
	          var(--fxos-dialog-button-background,
	          var(--fxos-button-background));
	        color:
	          var(--fxos-dialog-menu-button-color,
	          var(--fxos-brand-color));

	      }

	      ::content > button[data-icon]:before {
	        width: 50px;
	        font-size: 22px;
	        vertical-align: middle;
	      }

	      /** Button Divider Line
	       ---------------------------------------------------------*/

	      ::content > button:after {
	        content: '';
	        display: block;
	        position: absolute;
	        height: 1px;
	        left: 6px;
	        right: 6px;
	        top: 49px;
	        background: var(--fxos-border-color);
	      }

	      ::content > button:last-of-type:after {
	        display: none;
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