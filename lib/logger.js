'use strict';

const utils = require('./utils');

module.exports = {
  log(val) {
    console.log(utils.logDate(), val);
  },
  error(val) {
    console.error(utils.logDate(), val);
  }
};
