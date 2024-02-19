(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.utils = {}));
})(this, (function (exports) { 'use strict';

	/*
	How it works:
	`this.#head` is an instance of `Node` which keeps track of its current value and nests another instance of `Node` that keeps the value that comes after it. When a value is provided to `.enqueue()`, the code needs to iterate through `this.#head`, going deeper and deeper to find the last value. However, iterating through every single item is slow. This problem is solved by saving a reference to the last value as `this.#tail` so that it can reference it to add a new value.
	*/

	class Node {
		value;
		next;

		constructor(value) {
			this.value = value;
		}
	}

	class Queue {
		#head;
		#tail;
		#size;

		constructor() {
			this.clear();
		}

		enqueue(value) {
			const node = new Node(value);

			if (this.#head) {
				this.#tail.next = node;
				this.#tail = node;
			} else {
				this.#head = node;
				this.#tail = node;
			}

			this.#size++;
		}

		dequeue() {
			const current = this.#head;
			if (!current) {
				return;
			}

			this.#head = this.#head.next;
			this.#size--;
			return current.value;
		}

		clear() {
			this.#head = undefined;
			this.#tail = undefined;
			this.#size = 0;
		}

		get size() {
			return this.#size;
		}

		* [Symbol.iterator]() {
			let current = this.#head;

			while (current) {
				yield current.value;
				current = current.next;
			}
		}
	}

	const AsyncResource = {
		bind(fn, _type, thisArg) {
			return fn.bind(thisArg);
		},
	};

	function pLimit(concurrency) {
		if (!((Number.isInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency > 0)) {
			throw new TypeError('Expected `concurrency` to be a number from 1 and up');
		}

		const queue = new Queue();
		let activeCount = 0;

		const next = () => {
			activeCount--;

			if (queue.size > 0) {
				queue.dequeue()();
			}
		};

		const run = async (function_, resolve, arguments_) => {
			activeCount++;

			const result = (async () => function_(...arguments_))();

			resolve(result);

			try {
				await result;
			} catch {}

			next();
		};

		const enqueue = (function_, resolve, arguments_) => {
			queue.enqueue(
				AsyncResource.bind(run.bind(undefined, function_, resolve, arguments_)),
			);

			(async () => {
				// This function needs to wait until the next microtask before comparing
				// `activeCount` to `concurrency`, because `activeCount` is updated asynchronously
				// when the run function is dequeued and called. The comparison in the if-statement
				// needs to happen asynchronously as well to get an up-to-date value for `activeCount`.
				await Promise.resolve();

				if (activeCount < concurrency && queue.size > 0) {
					queue.dequeue()();
				}
			})();
		};

		const generator = (function_, ...arguments_) => new Promise(resolve => {
			enqueue(function_, resolve, arguments_);
		});

		Object.defineProperties(generator, {
			activeCount: {
				get: () => activeCount,
			},
			pendingCount: {
				get: () => queue.size,
			},
			clearQueue: {
				value() {
					queue.clear();
				},
			},
		});

		return generator;
	}

	const VOID = Symbol("p-void");
	class PInstance extends Promise {
	  constructor(items = [], options) {
	    super(() => {
	    });
	    this.items = items;
	    this.options = options;
	    this.promises = /* @__PURE__ */ new Set();
	  }
	  get promise() {
	    var _a;
	    let batch;
	    const items = [...Array.from(this.items), ...Array.from(this.promises)];
	    if ((_a = this.options) == null ? void 0 : _a.concurrency) {
	      const limit = pLimit(this.options.concurrency);
	      batch = Promise.all(items.map((p2) => limit(() => p2)));
	    } else {
	      batch = Promise.all(items);
	    }
	    return batch.then((l) => l.filter((i) => i !== VOID));
	  }
	  add(...args) {
	    args.forEach((i) => {
	      this.promises.add(i);
	    });
	  }
	  map(fn) {
	    return new PInstance(
	      Array.from(this.items).map(async (i, idx) => {
	        const v = await i;
	        if (v === VOID)
	          return VOID;
	        return fn(v, idx);
	      }),
	      this.options
	    );
	  }
	  filter(fn) {
	    return new PInstance(
	      Array.from(this.items).map(async (i, idx) => {
	        const v = await i;
	        const r = await fn(v, idx);
	        if (!r)
	          return VOID;
	        return v;
	      }),
	      this.options
	    );
	  }
	  forEach(fn) {
	    return this.map(fn).then();
	  }
	  reduce(fn, initialValue) {
	    return this.promise.then((array) => array.reduce(fn, initialValue));
	  }
	  clear() {
	    this.promises.clear();
	  }
	  then(fn) {
	    const p2 = this.promise;
	    if (fn)
	      return p2.then(fn);
	    else
	      return p2;
	  }
	  catch(fn) {
	    return this.promise.catch(fn);
	  }
	  finally(fn) {
	    return this.promise.finally(fn);
	  }
	}
	function p(items, options) {
	  return new PInstance(items, options);
	}

	exports.p = p;

}));
