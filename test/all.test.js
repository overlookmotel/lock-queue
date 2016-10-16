/* --------------------
 * lock-queue module
 * Tests
 * ------------------*/

// Modules
var chai = require('chai'),
	expect = chai.expect,
	Promise = require('bluebird'),
	Locker = require('../lib/');

// Init
chai.config.includeStack = true;

// Tests

/* jshint expr: true */
/* global describe, it, beforeEach */

describe('Locker', function() {
	beforeEach(function() {
		this.l = new Locker();
	});

	describe('starts with', function() {
		it('`.busy` == false', function() {
			expect(this.l.busy).to.be.false;
		});

		it('`.locked` == false', function() {
			expect(this.l.locked).to.be.false;
		});

		it('`.running` == 0', function() {
			expect(this.l.running).to.equal(0);
		});

		it('empty queue', function() {
			expect(this.l.queue).to.be.an.array;
			expect(this.l.queue).to.have.length(0);
		});
	});

	describe('concurrency', function() {
		it('non-exclusive items run concurrently', function() {
			var l = this.l;
			var order = [];

			var a = l.run(function() {
				order.push('A');
				return Promise.resolve().then(function() { order.push('A2'); });
			});

			var b = l.run(function() {
				order.push('B');
				return Promise.resolve().then(function() { order.push('B2'); });
			});

			var c = l.run(function() {
				order.push('C');
				return Promise.resolve().then(function() { order.push('C2'); });
			});

			return Promise.all([a, b, c]).then(function() {
				expect(order).to.deep.equal(['A', 'B', 'C', 'A2', 'B2', 'C2']);
			});
		});

		it('exclusive items block non-exclusive', function() {
			var l = this.l;
			var order = [];

			var a = l.lock(function() {
				order.push('A');
				return Promise.resolve().then(function() { order.push('A2'); });
			});

			var b = l.run(function() {
				order.push('B');
				return Promise.resolve().then(function() { order.push('B2'); });
			});

			var c = l.run(function() {
				order.push('C');
				return Promise.resolve().then(function() { order.push('C2'); });
			});

			return Promise.all([a, b, c]).then(function() {
				expect(order).to.deep.equal(['A', 'A2', 'B', 'C', 'B2', 'C2']);
			});
		});

		it('exclusive items await non-exclusive items', function() {
			var l = this.l;
			var order = [];

			var a = l.run(function() {
				order.push('A');
				return Promise.resolve().then(function() { order.push('A2'); });
			});

			var b = l.run(function() {
				order.push('B');
				return Promise.resolve().then(function() { order.push('B2'); });
			});

			var c = l.lock(function() {
				order.push('C');
				return Promise.resolve().then(function() { order.push('C2'); });
			});

			return Promise.all([a, b, c]).then(function() {
				expect(order).to.deep.equal(['A', 'B', 'A2', 'B2', 'C', 'C2']);
			});
		});

		it('exclusive items block other exclusive items', function() {
			var l = this.l;
			var order = [];

			var a = l.lock(function() {
				order.push('A');
				return Promise.resolve().then(function() { order.push('A2'); });
			});

			var b = l.lock(function() {
				order.push('B');
				return Promise.resolve().then(function() { order.push('B2'); });
			});

			var c = l.lock(function() {
				order.push('C');
				return Promise.resolve().then(function() { order.push('C2'); });
			});

			return Promise.all([a, b, c]).then(function() {
				expect(order).to.deep.equal(['A', 'A2', 'B', 'B2', 'C', 'C2']);
			});
		});
	});

	describe('execution timing', function() {
		it('non-exclusive lock items run synchronously', function() {
			var l = this.l;
			var order = [];

			var a = l.run(function() {
				order.push('A');
			});

			var b = l.run(function() {
				order.push('B');
			});

			var c = l.run(function() {
				order.push('C');
			});

			order.push('end');

			return Promise.all([a, b, c]).then(function() {
				expect(order).to.deep.equal(['A', 'B', 'C', 'end']);
			});
		});

		it('exclusive lock items run asynchronously', function() {
			var l = this.l;
			var order = [];

			var a = l.run(function() {
				order.push('A');
			});

			var b = l.run(function() {
				order.push('B');
			});

			var c = l.lock(function() {
				order.push('C');
			});

			order.push('end');

			return Promise.all([a, b, c]).then(function() {
				expect(order).to.deep.equal(['A', 'B', 'end', 'C']);
			});
		});
	});
});
