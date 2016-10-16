/* --------------------
 * lock-queue module
 * -------------------- */

// modules
var promisify = require('promisify-any');

// imports
var Deferred = require('./deferred');

// exports

/*
 * Locker constructor
 */
function Locker() {
    if (!(this instanceof Locker)) return new Locker();

    this.locked = false; // whether any process has an exclusive lock at present
    this.busy = false; // whether any processes are currently running or waiting
    this.running = 0; // number of processes currently running
    this.queue = []; // queue of jobs awaiting lock release
}

module.exports = Locker;

/*
 * Run `fn` when a non-exclusive lock becomes available (or immediately if no pending locks)
 *
 * `fn` is run with this context `ctx`. i.e. `fn.call(ctx)`
 * Returns a Promise which resolves/rejects when `fn` completes execution.
 */
Locker.prototype.run = function(fn, ctx) {
    return joinQueue.call(this, fn, ctx, false);
};

/*
 * Run `fn` when an exclusive lock becomes available (or immediately if no pending locks)
 *
 * All other jobs are queued up until `fn` resolves/rejects
 * Returns a Promise which resolves/rejects when `fn` completes execution.
 */
Locker.prototype.lock = function(fn, ctx) {
    return joinQueue.call(this, fn, ctx, true);
};

/*
 * export defer function to create deferred Promise
 */
Locker.defer = defer;

/*
 * Add process to the queue and run queue
 */
function joinQueue(fn, ctx, exclusive) {
    // promisify `fn`
    fn = promisify(fn, 0);

    // add into queue
    var deferred = new Deferred();
    this.queue.push({fn: fn, ctx: ctx, deferred: deferred, exclusive: exclusive});

    // run queue
    runQueue.call(this);

    // return deferred promise
    return deferred.promise;
}

/*
 * Run queue
 */
function runQueue() {
    // flag whether locker is busy (i.e. has current or pending processes)
    this.busy = (this.running || this.queue.length);

    // run all items in queue until item requiring exclusive lock
    while (!this.locked) {
        var item = this.queue[0];
        if (!item) break;

        if (item.exclusive) {
            if (this.running) break;
            this.locked = true;
        }

        this.queue.shift();

        this.running++;

        var promise = item.fn.call(item.ctx);
        item.deferred.follow(promise);

        promise.catch(function() {}).then(function() {
            this.running--;

            if (this.locked) this.locked = false;
            runQueue.call(this);
        }.bind(this));
    }
}
