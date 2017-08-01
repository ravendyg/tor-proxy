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

const config = require('../config');

const createUtils = require('../utils');
const createAuth = require('../services/auth');
const createSerever = require('../services/server');
const createProxyRoute = require('../routes/proxy');
const createWorker = require('../services/worker');
const messenger = new EventEmitter();
const utils = createUtils({config, path, fs});

const auth = createAuth({config});
const server = createSerever({http});
const proxyRoute = createProxyRoute({
  process, auth, utils,
  agent, agents,
  request, pump, URL
});

server.addRoute('get', '/proxy', proxyRoute);

createWorker({
  self: process,
  config, server, utils, messenger,
  spawn
});

