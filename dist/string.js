(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.utils = {}));
})(this, (function (exports) { 'use strict';

  const toString = (v) => Object.prototype.toString.call(v);

  const isObject = (val) => toString(val) === "[object Object]";

  function slash(str) {
    return str.replace(/\\/g, "/");
  }
  function ensurePrefix(prefix, str) {
    if (!str.startsWith(prefix))
      return prefix + str;
    return str;
  }
  function ensureSuffix(suffix, str) {
    if (!str.endsWith(suffix))
      return str + suffix;
    return str;
  }
  function template(str, ...args) {
    const [firstArg, fallback] = args;
    if (isObject(firstArg)) {
      const vars = firstArg;
      return str.replace(/{([\w\d]+)}/g, (_, key) => vars[key] || ((typeof fallback === "function" ? fallback(key) : fallback) ?? key));
    } else {
      return str.replace(/{(\d+)}/g, (_, key) => {
        const index = Number(key);
        if (Number.isNaN(index))
          return key;
        return args[index];
      });
    }
  }
  const urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
  function randomStr(size = 16, dict = urlAlphabet) {
    let id = "";
    let i = size;
    const len = dict.length;
    while (i--)
      id += dict[Math.random() * len | 0];
    return id;
  }
  function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1).toLowerCase();
  }

  exports.capitalize = capitalize;
  exports.ensurePrefix = ensurePrefix;
  exports.ensureSuffix = ensureSuffix;
  exports.randomStr = randomStr;
  exports.slash = slash;
  exports.template = template;

}));
