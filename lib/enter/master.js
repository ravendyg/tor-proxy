'use strict';

const cluster = require('cluster');
const {exec, execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const baseConfig = require('../config');

const createUtils = require('../utils');
const createWorkerCommands = require('../services/worker-commands');
const createMaster = require('../services/master');
const createLogger = require('../services/logger');
const logger = createLogger();



module.exports = configOverride => {

  const config = Object.assign({}, baseConfig, configOverride);

  const utils = createUtils({config, path, fs});

  const workerCommands = createWorkerCommands({
    config, cluster, logger
  });

  const master = createMaster({
    config, utils, logger,
    path, fs, exec, execSync,
    workerCommands
  });

  master.run();
};

