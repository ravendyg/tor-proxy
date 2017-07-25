'use strict';

const http = require('http');
const {spawn} = require('child_process');
const path = require('path');
const fs = require('fs');

const config = require('../config');

const createUtils = require('../utils');
const createAuth = require('../services/auth');
const createSerever = require('../services/server');
const createProxyRoute = require('../routes/proxy');
const createWorker = require('../services/worker');

const auth = createAuth({config});
const server = createSerever({http});
const proxyRoute = createProxyRoute({auth});
const utils = createUtils({config, path, fs});

server.addRoute('get', '/proxy', proxyRoute);

createWorker({
  self: process,
  config, server, utils,
  spawn
});

