(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.utils = {}));
})(this, (function (exports) { 'use strict';

  function notNullish(v) {
    return v != null;
  }

  const toString = (v) => Object.prototype.toString.call(v);

  const isObject = (val) => toString(val) === "[object Object]";

  function objectMap(obj, fn) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => fn(k, v)).filter(notNullish)
    );
  }
  function isKeyOf(obj, k) {
    return k in obj;
  }
  function objectKeys(obj) {
    return Object.keys(obj);
  }
  function objectEntries(obj) {
    return Object.entries(obj);
  }
  function deepMerge(target, ...sources) {
    if (!sources.length)
      return target;
    const source = sources.shift();
    if (source === void 0)
      return target;
    if (isMergableObject(target) && isMergableObject(source)) {
      objectKeys(source).forEach((key) => {
        if (key === "__proto__" || key === "constructor" || key === "prototype")
          return;
        if (isMergableObject(source[key])) {
          if (!target[key])
            target[key] = {};
          if (isMergableObject(target[key])) {
            deepMerge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        } else {
          target[key] = source[key];
        }
      });
    }
    return deepMerge(target, ...sources);
  }
  function deepMergeWithArray(target, ...sources) {
    if (!sources.length)
      return target;
    const source = sources.shift();
    if (source === void 0)
      return target;
    if (Array.isArray(target) && Array.isArray(source))
      target.push(...source);
    if (isMergableObject(target) && isMergableObject(source)) {
      objectKeys(source).forEach((key) => {
        if (key === "__proto__" || key === "constructor" || key === "prototype")
          return;
        if (Array.isArray(source[key])) {
          if (!target[key])
            target[key] = [];
          deepMergeWithArray(target[key], source[key]);
        } else if (isMergableObject(source[key])) {
          if (!target[key])
            target[key] = {};
          deepMergeWithArray(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      });
    }
    return deepMergeWithArray(target, ...sources);
  }
  function isMergableObject(item) {
    return isObject(item) && !Array.isArray(item);
  }
  function objectPick(obj, keys, omitUndefined = false) {
    return keys.reduce((n, k) => {
      if (k in obj) {
        if (!omitUndefined || obj[k] !== void 0)
          n[k] = obj[k];
      }
      return n;
    }, {});
  }
  function clearUndefined(obj) {
    Object.keys(obj).forEach((key) => obj[key] === void 0 ? delete obj[key] : {});
    return obj;
  }
  function hasOwnProperty(obj, v) {
    if (obj == null)
      return false;
    return Object.prototype.hasOwnProperty.call(obj, v);
  }

  exports.clearUndefined = clearUndefined;
  exports.deepMerge = deepMerge;
  exports.deepMergeWithArray = deepMergeWithArray;
  exports.hasOwnProperty = hasOwnProperty;
  exports.isKeyOf = isKeyOf;
  exports.objectEntries = objectEntries;
  exports.objectKeys = objectKeys;
  exports.objectMap = objectMap;
  exports.objectPick = objectPick;

}));
