'use strict';

const http = require('http');
const {spawn} = require('child_process');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
const request = require('request');
const agent = require('socks5-http-client/lib/Agent');
const agents = require('socks5-https-client/lib/Agent');
const pump = require('pump');
const URL = require('url');
const randomUa = require('random-ua');

const config = require('../config');

const createUtils = require('../utils');
const createAuth = require('../services/auth');
const createSerever = require('../services/server');
const createProxyRoute = require('../routes/proxy');
const createWorker = require('../services/worker');
const createLogger = require('../services/logger');
const messenger = new EventEmitter();
const utils = createUtils({config, path, fs});
const logger = createLogger();

const auth = createAuth({config});
const server = createSerever({http, config});
const proxyRoute = createProxyRoute({
  self: process, auth, utils,
  agent, agents, randomUa,
  request, pump, URL,
  logger, messenger
});

server.addRoute('get', '/proxy', proxyRoute);

createWorker({
  self: process,
  config, server, utils, messenger,
  spawn, logger
});

