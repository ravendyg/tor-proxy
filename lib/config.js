'use strict';

const path = require('path');

const config = {
  MASTER_PORT: 3014,
  WORKER_PORT: 3015,
  START_TOR_PORT: 9060,
  TOR_PORT_INCREMENT: 2,
  NUMBER_OF_TOR_INSTANCES: 5,
  RESTART_PERIOD: 1000 * 60 * 15,
  TOR_ACCEPTABLE_TIME: 5000,
  SPAWN_ATTEMPTS: 5,
  COUNTER_INTERVAL: 1000 * 60 * 5,  // every 5 min

  TOR_DIR: path.join(__dirname, '..', 'tor'),
};

try {
  const configExtension = require('./config.json');
  Object.assign(config, configExtension);
} catch (err) {
  // ignore
}



module.exports = config;

