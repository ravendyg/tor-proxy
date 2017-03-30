/* global __dirname */
'use strict';

const fs = require('fs');
const path = require('path');

const request = require('request');
const agent = require('socks5-http-client/lib/Agent');
const Bluebird = require('bluebird');
const pump = require('pump');

const utils = require('./utils');

const spawn = require('child_process').spawn;
const exec = require('child_process').exec;

const EventEmitter = require('events');
const emitter = new EventEmitter();


const rootDir = path.join(__dirname, '..');
const torDir = path.join(rootDir, 'tor');
const dataDir = path.join(torDir, 'data-dir');

const config = {};

let instances = [];
const ports = [];

let requestQueue = [];

let running = false;


module.exports = {
  setupEnvironment,
  startService, stopService,
  makeRequest,
  on
};

function setupEnvironment(options) {
  Object.assign(config, options);

  if (!fs.existsSync(torDir)) {
    fs.mkdirSync(torDir);
  } else {
    const files = fs.readdirSync(torDir);
    for (let file of files) {
      if (/torrc\.[0-9]{1,}/.test(file)) {
        const _file = path.join(torDir, file);
        fs.unlinkSync(_file);
      }
    }
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  for (let i = 0; i < config.NUMBER_OF_TOR_INSTANCES; i++) {
    createInstanceInfoFile(i);
    createDataDir(i);
  }
}

function createInstanceInfoFile(counter) {
  const _counter = counter + 1;
  const rcFilePath = path.join(torDir, 'torrc.' + _counter);
  const port = config.START_TOR_PORT + counter * 2;
  ports.push(port);
  const torrc =
  'SocksPort ' + port + '\n' +
  'ControlPort ' + (config.START_TOR_PORT + (counter * 2 + 1)) + '\n' +
  'DataDirectory tor/data-dir/tor' + _counter;

  fs.writeFileSync(rcFilePath, torrc, {encoding: 'utf8'});
}

function createDataDir(counter) {
  const _dataDir = path.join(dataDir, 'tor' + (counter + 1));
  if (!fs.existsSync(_dataDir)) {
    fs.mkdirSync(_dataDir);
  }
}

/**
 * start new tor instance
 * @index: number
 */
function startTorInstance(index) {
  function main(resolve) {
    var resolved = false;

    if (index <= 0 || index > ports.length) {
      resolve({ error: 'index out of bound', connection: null });
      resolved = true;
    }

    var spawnTor = spawn('tor', ['-f', './tor/torrc.' + index], {cwd: global});

    spawnTor.stdout.on(
      'data',
      data => {
        if (data.toString('utf8').match(/Bootstrapped 100%: Done/) && !resolved) {
          resolve({ error: null, connection: spawnTor, id: index });
        }
      }
    );

    spawnTor.stdout.on(
      'error',
      error => {
        if (!resolved) {
          resolve({ error, connection: null });
        }
        spawnTor.kill('SIGNINT');
      }
    );
  }

  return new Bluebird(main);
}

function addTorInstance({ err, connection, id }) {
  if (err) {
    console.error(utils.logDate(), err);
  } else {
    instances.push({
      id,
      connection,
      port: ports[id - 1]
    });
    if (instances.length === 1) {
      // can continue to work
      emitter.emit('available');
      for (let {url, res} of requestQueue) {
        makeRequest(url, res);
      }
    }
  }
}

/**
 * start entire proxy service
 */
function startService() {
  running = true;
  exec('ps aux | grep ./tor/torrc.', function cb(err, stdout, stderr) {
    if (err) {
      console.error(utils.logDate(), err);
    } else if (stderr) {
      console.error(utils.logDate(), stderr);
    } else {
      let tasks = stdout.split('\n');
      let torInstances =
        tasks
        .filter(e => e.match(/\.\/tor\/torrc\.[0-9]/))
        .map(e => e.match(/\S+/g)[1])
        ;
      for (let instance of torInstances) {
        exec('kill -9 ' + instance);
      }
      setTimeout(
        () => {
          for (let i = 0; i < ports.length; i++) {
            startTorInstance(i + 1)
            .then(addTorInstance);
          }

          setInterval(
            () => { // restart one proxy
              let proxy;
              [proxy, ...instances] = instances;

              proxy.connection.kill('SIGINT');

              startTorInstance(proxy.id)
              .then(addTorInstance);
            },
            config.RESTART_PERIOD
          );
        }
      );
    }
  });
}

function stopService() {
  running = false;
  while (instances.length > 0) {
    instances.pop().connection.kill('SIGINT');
  }
  return 'stoped';
}

/**
 * provide a proxy to the requested url
 */
function makeRequest(url, res) {
  if (!running) {
    return 'stoped';
  }

  if (instances.length === 0) {
    requestQueue.push({url, res});
    return null;
  }

  const requests = [];

  const used = instances.shift();
  instances.push(used);

  const _request = createRequest(url, used);
  requests.push(_request);

  const timeoutId = setRequestTimeout(url, res, requests);

  waitForRequest(_request, res, requests, timeoutId);

  return null;
}

function createRequest(url, proxy) {
  return request(
    {
      url,
      method: 'GET',
      encoding: null,
      followAllRedirects: true,
      agentClass: agent,
      agentOptions:
      {
        socksHost: '127.0.0.1',
        socksPort: proxy.port
      }
    }
  );
}



function waitForRequest(_request, res, requests, timeoutId) {
  _request.on('response', (response) => {

    for (let req of requests) {
      if (req !== _request) {
        req.abort();
      }
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const headers = response.toJSON().headers;
    for (let headerName of Object.keys(headers)) {
      res.setHeader(headerName, headers[headerName]);
    }

    response.on('error', reqErrorHandler.bind(response, res));
    res.on('error', resErrorHandler);
    pump(response, res);
  });
}

function setRequestTimeout(url, res, requests) {
  return setTimeout(() => {
    for (let i = 0; i < config.INSTANCES_USED_SIMULTANEOUSLY - 1; i++) {
      let used = instances.shift();
      instances.push(used);

      const _request = createRequest(url, used);
      requests.push(_request);
      waitForRequest(_request, res, requests);
    }
  }, config.TOR_TIMEOUT);
}

function reqErrorHandler(res, err) {
  console.error(utils.logDate(), err.message);
  console.error(utils.logDate(), this.href);
  res.status(500).send();
}

function resErrorHandler(err) {
  console.error(utils.logDate(), err);
  this.status(500).send();
}

function on(event, cb) {
  emitter.on(event, cb);
  return function unsubscribe() {
    emitter.removeListener(event, cb);
  }
}