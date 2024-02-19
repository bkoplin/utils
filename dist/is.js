(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.utils = {}));
})(this, (function (exports) { 'use strict';

  const toString = (v) => Object.prototype.toString.call(v);

  const isDef = (val) => typeof val !== "undefined";
  const isBoolean = (val) => typeof val === "boolean";
  const isFunction = (val) => typeof val === "function";
  const isNumber = (val) => typeof val === "number";
  const isString = (val) => typeof val === "string";
  const isObject = (val) => toString(val) === "[object Object]";
  const isUndefined = (val) => toString(val) === "[object Undefined]";
  const isNull = (val) => toString(val) === "[object Null]";
  const isRegExp = (val) => toString(val) === "[object RegExp]";
  const isDate = (val) => toString(val) === "[object Date]";
  const isWindow = (val) => typeof window !== "undefined" && toString(val) === "[object Window]";
  const isBrowser = typeof window !== "undefined";

  exports.isBoolean = isBoolean;
  exports.isBrowser = isBrowser;
  exports.isDate = isDate;
  exports.isDef = isDef;
  exports.isFunction = isFunction;
  exports.isNull = isNull;
  exports.isNumber = isNumber;
  exports.isObject = isObject;
  exports.isRegExp = isRegExp;
  exports.isString = isString;
  exports.isUndefined = isUndefined;
  exports.isWindow = isWindow;

}));
