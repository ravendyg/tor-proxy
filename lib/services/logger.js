'use strict';

module.exports = function createLogger() {

  function log(...args) {
    console.log(...args);
  }

  function error(...args) {
    console.error(...args);
  }

  function debug(...args) {
    if (process.env.DEBUG) {
      console.log(...args);
    }
  }

  return {
    log,
    error,
    debug
  };
};
