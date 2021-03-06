# Changelog

## 0.1.0

* Initial release

## 0.2.0

* Erroneous release - no changes

## 0.3.0

* Export `defer` function

## 1.0.0

* Fix: `.busy` starts as `false`
* `Deferred` object used internally converted to class with `.promise` attribute
* `defer` not exported
* `Locker` constructor is named function
* Refactor: Use Bluebird `.bind()` method
* Update `bluebird` dependency to latest v2.x release
* Update dev dependencies
* Tests
* Replace `Makefile` with npm scripts
* Travis CI runs on Node v6
* Travis CI runs on all branches (to enable `greenkeeper.io`)
* Git ignore `.DS_Store`
* Code comments
* README
* Update license

## 1.0.1

* Fix: Release lock before promise resolved
