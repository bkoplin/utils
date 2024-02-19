(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.utils = {}));
})(this, (function (exports) { 'use strict';

  const toString = (v) => Object.prototype.toString.call(v);
  function getTypeName(v) {
    if (v === null)
      return "null";
    const type = toString(v).slice(8, -1).toLowerCase();
    return typeof v === "object" || typeof v === "function" ? type : typeof v;
  }

  function isDeepEqual(value1, value2) {
    const type1 = getTypeName(value1);
    const type2 = getTypeName(value2);
    if (type1 !== type2)
      return false;
    if (type1 === "array") {
      if (value1.length !== value2.length)
        return false;
      return value1.every((item, i) => {
        return isDeepEqual(item, value2[i]);
      });
    }
    if (type1 === "object") {
      const keyArr = Object.keys(value1);
      if (keyArr.length !== Object.keys(value2).length)
        return false;
      return keyArr.every((key) => {
        return isDeepEqual(value1[key], value2[key]);
      });
    }
    return Object.is(value1, value2);
  }

  exports.isDeepEqual = isDeepEqual;

}));
