(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./fxos-dialog"), require("fxos-component"));
	else if(typeof define === 'function' && define.amd)
		define(["./fxos-dialog", "fxos-component"], factory);
	else if(typeof exports === 'object')
		exports["FXOSDialogAlert"] = factory(require("./fxos-dialog"), require("fxos-component"));
	else
		root["FXOSDialogAlert"] = factory(root["FXOSDialog"], root["fxosComponent"]);
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
	module.exports = component.register('fxos-dialog-alert', {
	  created: function() {
	    this.setupShadowRoot();
	    this.els = {
	      dialog: this.shadowRoot.querySelector('fxos-dialog')
	    };
	    this.els.dialog.addEventListener('closed',
	      GaiaDialogProto.hide.bind(this));
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
	      <section>
	        <p><content></content></p>
	      </section>
	      <div>
	        <button class="submit primary" on-click="close">Ok</button>
	      </div>
	    </fxos-dialog>
	    <style>
	      :host {
	        display: none;
	        position: fixed;
	        left: 0;
	        top: 0;
	        z-index: 999;

	        width: 100%;
	        height: 100%;
	      }

	      fxos-dialog section {
	        max-width: 320px;
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