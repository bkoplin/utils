(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.utils = {}));
})(this, (function (exports) { 'use strict';

  function assert(condition, message) {
    if (!condition)
      throw new Error(message);
  }
  const toString = (v) => Object.prototype.toString.call(v);
  function getTypeName(v) {
    if (v === null)
      return "null";
    const type = toString(v).slice(8, -1).toLowerCase();
    return typeof v === "object" || typeof v === "function" ? type : typeof v;
  }
  function noop() {
  }

  exports.assert = assert;
  exports.getTypeName = getTypeName;
  exports.noop = noop;
  exports.toString = toString;

}));
