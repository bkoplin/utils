(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.utils = {}));
})(this, (function (exports) { 'use strict';

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function toArray(array) {
    array = array ?? [];
    return Array.isArray(array) ? array : [array];
  }
  function flattenArrayable(array) {
    return toArray(array).flat(1);
  }
  function mergeArrayable(...args) {
    return args.flatMap((i) => toArray(i));
  }
  function partition(array, ...filters) {
    const result = Array.from({ length: filters.length + 1 }).fill(null).map(() => []);
    array.forEach((e, idx, arr) => {
      let i = 0;
      for (const filter of filters) {
        if (filter(e, idx, arr)) {
          result[i].push(e);
          return;
        }
        i += 1;
      }
      result[i].push(e);
    });
    return result;
  }
  function uniq(array) {
    return Array.from(new Set(array));
  }
  function uniqueBy(array, equalFn) {
    return array.reduce((acc, cur) => {
      const index = acc.findIndex((item) => equalFn(cur, item));
      if (index === -1)
        acc.push(cur);
      return acc;
    }, []);
  }
  function last(array) {
    return at(array, -1);
  }
  function remove(array, value) {
    if (!array)
      return false;
    const index = array.indexOf(value);
    if (index >= 0) {
      array.splice(index, 1);
      return true;
    }
    return false;
  }
  function at(array, index) {
    const len = array.length;
    if (!len)
      return void 0;
    if (index < 0)
      index += len;
    return array[index];
  }
  function range(...args) {
    let start, stop, step;
    if (args.length === 1) {
      start = 0;
      step = 1;
      [stop] = args;
    } else {
      [start, stop, step = 1] = args;
    }
    const arr = [];
    let current = start;
    while (current < stop) {
      arr.push(current);
      current += step || 1;
    }
    return arr;
  }
  function move(arr, from, to) {
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    return arr;
  }
  function clampArrayRange(n, arr) {
    return clamp(n, 0, arr.length - 1);
  }
  function sample(arr, quantity) {
    return Array.from({ length: quantity }, (_) => arr[Math.round(Math.random() * (arr.length - 1))]);
  }
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  exports.at = at;
  exports.clampArrayRange = clampArrayRange;
  exports.flattenArrayable = flattenArrayable;
  exports.last = last;
  exports.mergeArrayable = mergeArrayable;
  exports.move = move;
  exports.partition = partition;
  exports.range = range;
  exports.remove = remove;
  exports.sample = sample;
  exports.shuffle = shuffle;
  exports.toArray = toArray;
  exports.uniq = uniq;
  exports.uniqueBy = uniqueBy;

}));
