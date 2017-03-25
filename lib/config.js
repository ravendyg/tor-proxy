'use strict';

const config = {
  PORT: 3014,
  START_TOR_PORT: 9060,
  TOR_PORT_INCREMENT: 2,
  NUMBER_OF_TOR_INSTANCES: 5,
  RESTART_PERIOD: 1000 * 60 * 60,
};

try {
  const configExtension = require('./config.json');
  Object.assign(config, configExtension);
} catch (err) {
  // ignore
}



module.exports = config;

