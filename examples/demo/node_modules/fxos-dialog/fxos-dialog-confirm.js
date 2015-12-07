(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./fxos-dialog"), require("fxos-component"));
	else if(typeof define === 'function' && define.amd)
		define(["./fxos-dialog", "fxos-component"], factory);
	else if(typeof exports === 'object')
		exports["FXOSDialogConfirm"] = factory(require("./fxos-dialog"), require("fxos-component"));
	else
		root["FXOSDialogConfirm"] = factory(root["FXOSDialog"], root["fxosComponent"]);
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
	module.exports = component.register('fxos-dialog-confirm', {
	  created: function() {
	    this.setupShadowRoot();

	    this.els = {
	      dialog: this.shadowRoot.querySelector('fxos-dialog'),
	      submit: this.shadowRoot.querySelector('.submit'),
	      cancel: this.shadowRoot.querySelector('.cancel')
	    };

	    this.els.cancel.addEventListener('click', this.close.bind(this));
	    this.els.submit.addEventListener('click', this.close.bind(this));
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
	        <p><content></content></p>
	      </section>
	      <fieldset>
	        <button class="cancel">Cancel</button>
	        <button class="submit danger">Confirm</button>
	      </fieldset>
	    </fxos-dialog>

	    <style>

	    :host {
	      display: block;
	      position: fixed;
	      width: 100%;
	      height: 100%;
	      z-index: 999;

	      display: none;
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