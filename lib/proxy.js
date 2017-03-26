/* global __dirname */
'use strict';

const fs = require('fs');
const path = require('path');

const request = require('request');
const agent = require('socks5-http-client/lib/Agent');

const config = require('./config');
const utils = require('./utils');

const spawn = require('child_process').spawn;
const exec = require('child_process').exec;


const rootDir = path.join(__dirname, '..');
const torDir = path.join(rootDir, 'tor');
const dataDir = path.join(torDir, 'data-dir');

let instances = [];
const ports = [];


module.exports = {
  setupEnvironment,
  startService,
  makeRequest,
};

function setupEnvironment() {
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
          console.log(index + ': ' + data.toString('utf8'));
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

  return new Promise (main);
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
  }
}

/**
 * start entire proxy service
 */
function startService() {
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

/**
 * provide a proxy to the requested url
 */
function makeRequest(url) {
  let i = Math.floor(Math.random() * instances.length);

  let proxy = instances[i];
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
