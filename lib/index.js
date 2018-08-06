/* --------------------
 * lock-queue module
 *
 * A `Locker` is a queue where items in the queue can either require an exclusive
 * or non-exclusive lock.
 *
 * Items in the queue are executed in the order that they are added.
 * Items requiring a non-exclusive lock run concurrently.
 *
 * When the next item in the queue requires an exclusive lock, all currently running
 * items are awaited before the exclusive item begins execution.
 * All other items are then held in the queue until the exclusive-lock function has finished.
 * When the exclusive-lock function has finished, the rest of the queue begins processing again.
 * -------------------- */

// Modules
var promisify = require('promisify-any');

// Imports
var defer = require('./defer');

// Exports

/**
 * Locker constructor
 */
function Locker(promise) {
    if (!(this instanceof Locker)) return new Locker();

    this.locked = false; // Whether any process has an exclusive lock at present
    this.busy = false; // Whether any processes are currently running or waiting
    this.running = 0; // Number of processes currently running
    this.queue = []; // Queue of jobs awaiting lock release
	this.promise = promise || Promise // the promise to use
}

module.exports = Locker;

/**
 * Run `fn` when a non-exclusive lock becomes available (or immediately if no pending locks)
 *
 * `fn` is run with this context `ctx`. i.e. `fn.call(ctx)`
 * Returns a Promise which resolves/rejects when `fn` completes execution.
 *
 * @param {Function} fn - Function to queue
 * @param {*} [ctx] - `this` context to run function with
 * @returns {Promise} - Promise which resolves/rejects with eventual outcome of `fn()`
 */
Locker.prototype.run = function(fn, ctx) {
    return joinQueue.call(this, fn, ctx, false);
};

/**
 * Run `fn` when an exclusive lock becomes available (or immediately if no pending locks)
 *
 * All other jobs are queued up until `fn` resolves/rejects
 * Returns a Promise which resolves/rejects when `fn` completes execution.
 *
 * @param {Function} fn - Function to queue
 * @param {*} [ctx] - `this` context to run function with
 * @returns {Promise} - Promise which resolves/rejects with eventual outcome of `fn()`
 */
Locker.prototype.lock = function(fn, ctx) {
    return joinQueue.call(this, fn, ctx, true);
};

/**
 * Add process to the queue and run queue
 *
 * @param {Function} fn - Function to queue
 * @param {*} [ctx] - `this` context to run function with
 * @param {boolean} - `true` if function requires an exclusive lock
 * @returns {Promise} - Promise which resolves/rejects with eventual outcome of `fn()`
 */
function joinQueue(fn, ctx, exclusive) {
    // Promisify `fn`
    fn = promisify(fn, 0);

    // Add into queue
    var deferred = defer(this.promise);
    this.queue.push({fn: fn, ctx: ctx, deferred: deferred, exclusive: exclusive});

    // Run queue
    runQueue.call(this);

    // Return deferred promise
    return deferred.promise;
}

/**
 * Run queue
 * @returns {undefined}
 */
function runQueue() {
    // Flag whether locker is busy (i.e. has current or pending processes)
    this.busy = (this.running || this.queue.length);

    // Run all items in queue until item requiring exclusive lock
    while (true) {
        var again = runNext.call(this);
		if (!again) return;
    }
}

/**
 * Run next item in queue
 * @returns {boolean} - `true` if was able to run an item, `false` if not
 */
function runNext() {
	if (this.locked) return false;

    var item = this.queue[0];
    if (!item) return false;

    if (item.exclusive) {
        if (this.running) return false;
        this.locked = true;
    }

    this.queue.shift();

    this.running++;

	var self = this;
	item.fn.call(item.ctx).then(function(res) {
		runDone.call(self, item, true, res);
	}, function(err) {
		runDone.call(self, item, false, err);
	});

	return true;
}

/**
 * Run complete.
 * Update state, resolve deferred promise, and run queue again.
 * @param {Object} - Queue item
 * @param {boolean} - `true` if function resolved, `false` if rejected
 * @param {*} - Result of function (resolve value or reject reason)
 * @returns {undefined}
 */
function runDone(item, resolved, res) {
	// Adjust state of lock
	this.running--;
	if (this.locked) this.locked = false;

	// Resolve/reject promise
	item.deferred[resolved ? 'resolve' : 'reject'](res);

	// Run queue again
	runQueue.call(this);
}
