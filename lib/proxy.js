'use strict';

const fs = require('fs');
const path = require('path');



const spawn = require('child_process').spawn;

const EventEmitter = require('events');
const emitter = new EventEmitter();

const rootDir = path.join(__dirname, '..');
const torDir = path.join(rootDir, 'tor');
const dataDir = path.join(torDir, 'data-dir');

const config = require('./config');
const logger = require('./logger');

let port, counter, _counter;


module.exports = {
  start,
  makeRequest, on
};


function start(id) {
  counter = id;
  _counter = counter + 1;
  port = config.START_TOR_PORT + counter * 2;

  createInstanceInfoFile();
  createDataDir();

  return startTorInstance();
}


function createInstanceInfoFile() {
  const rcFilePath = path.join(torDir, 'torrc.' + _counter);
  const torrc =
  'SocksPort ' + port + '\n' +
  'ControlPort ' + (config.START_TOR_PORT + (counter * 2 + 1)) + '\n' +
  'DataDirectory tor/data-dir/tor' + _counter;

  fs.writeFileSync(rcFilePath, torrc, {encoding: 'utf8'});
}

function createDataDir() {
  const _dataDir = path.join(dataDir, 'tor' + (counter + 1));
  if (!fs.existsSync(_dataDir)) {
    fs.mkdirSync(_dataDir);
  }
}

/**
 * start new tor instance
 */
function startTorInstance() {
  function main(resolve) {
    var resolved = false;

    var connection = spawn('tor', ['-f', './tor/torrc.' + _counter], {cwd: global});

    connection.stdout.on(
      'data',
      data => {
        if (data.toString('utf8').match(/Bootstrapped 100%: Done/) && !resolved) {
          resolve(null);
        }
      }
    );

    connection.stdout.on(
      'error',
      error => {
        if (!resolved) {
          resolve(error);
        }
        connection.kill('SIGINT');
      }
    );

    process.on('exit', () => {
      connection.kill('SIGINT');
    });

    process.on('message', msg => {
      if (msg.action === 'close') {
        process.exit(16);
      }
    });
  }

  return new Bluebird(main);
}

/**
 * provide a proxy to the requested url
 */
function makeRequest(url, res) {
  let startTsp = new Date();

  process.send({
    type: 'count'
  });

  const _request = createRequest(url);

  _request.on('response', (response) => {
    const headers = response.toJSON().headers;
    for (let headerName of Object.keys(headers)) {
      res.setHeader(headerName, headers[headerName]);
    }

    response.on('error', reqErrorHandler.bind(response, res));
    res.on('error', resErrorHandler);
    pump(response, res, () => {
      console.log(startTsp.toLocaleString() + ' - ' + url + ' - ' + response.statusCode);

      if (Date.now() - startTsp.getTime() > config.TOR_ACCEPTABLE_TIME) {
        process.exit(15);
      }
    });
  });
}

function createRequest(url, headers) {
  if (!headers) {
    headers = {};
  }
  const _request = request(
    {
      url,
      method: 'GET',
      headers,
      encoding: null,
      followAllRedirects: true,
      agentClass: /^https/.test(url) ? agents : agent,
      agentOptions:
      {
        socksHost: '127.0.0.1',
        socksPort: port
      }
    }
  );

  return _request;
}


function reqErrorHandler(res, err) {
  logger.error(err.message);
  logger.error(this.href);
  res.status(500).send();
}

function resErrorHandler(err) {
  logger.error(err);
  this.status(500).send();
}

function on(event, cb) {
  emitter.on(event, cb);
  return function unsubscribe() {
    emitter.removeListener(event, cb);
  }
}
