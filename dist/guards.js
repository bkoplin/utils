(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.utils = {}));
})(this, (function (exports) { 'use strict';

  function notNullish(v) {
    return v != null;
  }
  function noNull(v) {
    return v !== null;
  }
  function notUndefined(v) {
    return v !== void 0;
  }
  function isTruthy(v) {
    return Boolean(v);
  }

  exports.isTruthy = isTruthy;
  exports.noNull = noNull;
  exports.notNullish = notNullish;
  exports.notUndefined = notUndefined;

}));
