'use strict';

const
  path = require('path'),
  globalConfig = require('/etc/project-config.d/config.json'),
  config = {
    TOR_PORT_INCREMENT: 2,
    TOR_ACCEPTABLE_TIME: 5000,

    /** those are duplicated in index.js */
    NUMBER_OF_TOR_INSTANCES: 2,
    RESTART_PERIOD: 1000 * 60 * 30,
    KEEP_ALIVE_TIMEOUT: 2 * 60 * 1000,  // should be the same as default?
    START_TOR_PORT: 9060,
    SPAWN_ATTEMPTS: 5,
    /** */

    PROXY_MASTER_PORT: globalConfig.PORTS.PROXY_MASTER_PORT,
    PROXY_WORKER_PORT: globalConfig.PORTS.PROXY_WORKER_PORT,

    TOR_DIR: path.join(__dirname, '..', 'tor'),
  };

try {
  const configExtension = require('./config.json');
  Object.assign(config, configExtension);
} catch (err) {
  // ignore
}

module.exports = config;

