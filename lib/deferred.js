/* --------------------
 * lock-queue module
 * Deferred promise
 * -------------------- */

// Modules
var Promise = require('bluebird');

// Exports

/**
 * Deferred constructor.
 *
 * `deferred.promise` is a promise in pending state which can be resolved or rejected
 * by calling `deferred.resolve()` or `deferred.reject()`.
 *
 * `deferred.follow()` instructs deferred promise to follow resolve/reject state of another promise.
 *
 * @returns {Object} - Deferred object
 * @returns {Promise} .promise
 * @returns {Function} .resolve
 * @returns {Function} .reject
 * @returns {Function} .follow
 */
function Deferred() {
	var self = this;

	this.promise = new Promise(function(resolve, reject) {
        self.resolve = resolve;
        self.reject = reject;
    });
}

module.exports = Deferred;

/**
 * Make deferred promise follow state of provided `promise`.
 * Deferred promise will resolve when `promise` resolves, reject when `promise` rejects.
 *
 * @param {Promise} - Promise to follow
 * @returns {Promise} - Input promise
 */
Deferred.prototype.follow = function(promise) {
    var self = this;

    promise.then(function(result) {
        self.resolve(result);
    }, function(err) {
        self.reject(err);
    });

    return promise;
};
