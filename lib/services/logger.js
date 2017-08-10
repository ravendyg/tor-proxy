'use strict';

module.exports = function createLogger() {

  function log(...args) {
    console.log(...args);
  }

  function error(...args) {
    console.error(...args);
  }

  return {
    log,
    error
  };
};
