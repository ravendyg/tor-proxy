'use strict';

const config = require('./config');

let counter = 0;

module.exports = {
  count
};

setInterval(() => {
  console.log(counter + ' requests in the last ' + config.COUNTER_INTERVAL / 1000 + ' seconds');
  counter = 0;
}, config.COUNTER_INTERVAL);

function count() {
  counter++;
}
