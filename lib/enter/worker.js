'use strict';

const http = require('http');

const config = require('../config');

const createAuth = require('../services/auth');
const createSerever = require('../services/server');
const createProxyRoute = require('../routes/proxy');

const auth = createAuth({config});
const server = createSerever({http});
const proxyRoute = createProxyRoute({auth});

server.addRoute('get', '/proxy', proxyRoute);

server.listen(config.WORKER_PORT, () => {
  console.log('worker on ' + config.WORKER_PORT);
});
