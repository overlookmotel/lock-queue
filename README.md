# lock-queue.js

# Simple locking mechanism to serialize (queue) access to a resource

## Current status

[![NPM version](https://img.shields.io/npm/v/lock-queue.svg)](https://www.npmjs.com/package/lock-queue)
[![Build Status](https://img.shields.io/travis/overlookmotel/lock-queue/master.svg)](http://travis-ci.org/overlookmotel/lock-queue)
[![Dependency Status](https://img.shields.io/david/overlookmotel/lock-queue.svg)](https://david-dm.org/overlookmotel/lock-queue)
[![Dev dependency Status](https://img.shields.io/david/dev/overlookmotel/lock-queue.svg)](https://david-dm.org/overlookmotel/lock-queue)
[![Coverage Status](https://img.shields.io/coveralls/overlookmotel/lock-queue/master.svg)](https://coveralls.io/r/overlookmotel/lock-queue)

## Usage

A `Locker` is a queue where items in the queue can either require an exclusive or non-exclusive lock on some resource.

Items are provided as promise-returning functions.

### Creating a Locker

```js
var Locker = require('lock-queue');

var locker = new Locker();
```

### Adding an item to the queue

```js
var promise = locker.run(fn, ctx);
```

* `fn` is the function to be executed
* `ctx` is the `this` context to execute the function with
* Return value is a Promise which will resolve/reject with the value/reason that the function resolves/rejects with

### Adding an item to the queue which requires an exclusive lock

```js
var promise = locker.lock(fn, ctx);
```

### Execution order

* Items in the queue are executed in the order that they are added.
* Items requiring a non-exclusive lock run concurrently.
* When the next item in the queue requires an exclusive lock, all currently running items are awaited before the exclusive item begins execution.
* All other items are then held in the queue until the exclusive-lock function has finished.
* When the exclusive-lock function has finished, the rest of the queue begins processing again.

### Example

```js
var Locker = require('lock-queue');
var locker = new Locker();

// Non-exclusive lock functions
locker.run(function A() {
	console.log('A start');
	return Promise.resolve();
}).then(function() {
	console.log('A finish');
});

locker.run(function B() {
	console.log('B start');
	return Promise.resolve();
}).then(function() {
	console.log('B finish');
});

// EXCLUSIVE lock functions
locker.lock(function C() {
	console.log('C start');
	return Promise.resolve();
}).then(function() {
	console.log('C finish');
});

locker.lock(function D() {
	console.log('D start');
	return Promise.resolve();
}).then(function() {
	console.log('D finish');
});

// More non-exclusive functions
locker.run(function E() {
	console.log('E start');
	return Promise.resolve();
}).then(function() {
	console.log('E finish');
});

locker.run(function F() {
	console.log('F start');
	return Promise.resolve();
}).then(function() {
	console.log('F finish');
});
```

This outputs:

```
A start
B start
A finish
B finish
C start
C finish
D start
D finish
E start
F start
E finish
F finish
```

`A` and `B` run concurrently as neither requires an exclusive lock.
`C` (exclusive) does not begin execution until both `A` and `B` have finished.
`D` (exclusive) does not begin execution until `C` has finished.
`E` and `F` do not begin execution until after `D` has finished.
`E` and `F` run concurrently as neither requires an exclusive lock.

## Tests

Use `npm test` to run the tests. Use `npm run cover` to check coverage.

## Changelog

See [changelog.md](https://github.com/overlookmotel/lock-queue/blob/master/changelog.md)

## Issues

If you discover a bug, please raise an issue on Github. https://github.com/overlookmotel/lock-queue/issues

## Contribution

Pull requests are very welcome. Please:

* ensure all tests pass before submitting PR
* add an entry to changelog
* add tests for new features
* document new functionality/API additions in README
