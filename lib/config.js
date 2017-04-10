'use strict';

const config = {
  PORT: 3014,
  HOST: 'http://proxy.excur.info',
  START_TOR_PORT: 9060,
  TOR_PORT_INCREMENT: 2,
  NUMBER_OF_TOR_INSTANCES: 5,
  INSTANCES_USED_SIMULTANEOUSLY: 1,
  RESTART_PERIOD: 1000 * 60 * 15,
  TOR_TIMEOUT: 2000,
  SPAWN_ATTEMPTS: 2
};

try {
  const configExtension = require('./config.json');
  Object.assign(config, configExtension);
} catch (err) {
  // ignore
}



module.exports = config;

