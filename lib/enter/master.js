'use strict';

const cluster = require('cluster');
const {exec, execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const config = require('../config');
const utils = require('../utils');
const logger = console;

const createWorkerCommands = require('../services/worker-commands');
const createMaster = require('../services/master');

const workerCommands = createWorkerCommands({
  config, cluster, logger
});

const master = createMaster({
  config, utils, logger,
  path, fs, exec, execSync,
  workerCommands
});

master.run();
