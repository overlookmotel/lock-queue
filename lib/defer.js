/* --------------------
 * lock-queue module
 * Deferred promise
 * -------------------- */

// Exports

/**
 * Deferred factory.
 *
 * `deferred.promise` is a promise in pending state which can be resolved or rejected
 * by calling `deferred.resolve()` or `deferred.reject()`.
 *
 * @returns {Object} - Deferred object
 * @returns {Promise} .promise
 * @returns {Function} .resolve
 * @returns {Function} .reject
 */
module.exports = function(promise) {
	var deferred = {};

	deferred.promise = new promise(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

	return deferred;
};
