(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.utils = {}));
})(this, (function (exports) { 'use strict';

  function toArray(array) {
    array = array ?? [];
    return Array.isArray(array) ? array : [array];
  }
  function flattenArrayable(array) {
    return toArray(array).flat(1);
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }
  function sum(...args) {
    return flattenArrayable(args).reduce((a, b) => a + b, 0);
  }
  function lerp(min, max, t) {
    const interpolation = clamp(t, 0, 1);
    return min + (max - min) * interpolation;
  }
  function remap(n, inMin, inMax, outMin, outMax) {
    const interpolation = (n - inMin) / (inMax - inMin);
    return lerp(outMin, outMax, interpolation);
  }

  exports.clamp = clamp;
  exports.lerp = lerp;
  exports.remap = remap;
  exports.sum = sum;

}));
