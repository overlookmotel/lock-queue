/* --------------------
 * lock-queue module
 * Deferred promise
 * -------------------- */

// modules
var Promise = require('bluebird');

// exports

/*
 * Create a deferred promise
 *
 * Returns unresolved promise with methods `.resolve()` + `.reject()`
 * which can be called to resolve or reject the promise.
 * Also has `.follow()` method (see below).
 */
module.exports = function() {
    var resolve, reject;
    var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });

    promise.resolve = resolve;
    promise.reject = reject;
    promise.follow = follow;

    return promise;
};

/*
 * `.follow()` method
 * Make deferred promise follow state of provided `promise`
 *
 * Deferred promise will resolve when `promise` resolves, reject when `promise` rejects.
 */
function follow(promise) {
    var self = this;

    promise.then(function(result) {
        self.resolve(result);
    }, function(err) {
        self.reject(err);
    });

    return promise;
}
