(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.utils = {}));
})(this, (function (exports) { 'use strict';

  function batchInvoke(functions) {
    functions.forEach((fn) => fn && fn());
  }
  function invoke(fn) {
    return fn();
  }
  function tap(value, callback) {
    callback(value);
    return value;
  }

  exports.batchInvoke = batchInvoke;
  exports.invoke = invoke;
  exports.tap = tap;

}));
