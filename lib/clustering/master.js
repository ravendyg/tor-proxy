'use strict';

const cluster = require('cluster');
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const config = require('../config');
const utils = require('../utils');


const workers = {};


module.exports = function runMaster() {
  const rootDir = path.join(__dirname, '..');
  const torDir = path.join(rootDir, 'tor');
  const dataDir = path.join(torDir, 'data-dir');

  if (!fs.existsSync(torDir)) {
    fs.mkdirSync(torDir);
  }
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  const files = fs.readdirSync(torDir)
    .filter(e => /torrc\.[0-9]{1,2}/.test(e));
  for (let file of files) {
    fs.unlinkSync(path.join(torDir, file));
  }

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
      for (let i = 0; i < config.NUMBER_OF_TOR_INSTANCES; i++) {
        startWorker(i, config.SPAWN_ATTEMPTS);
      }

      let restarting = 0;
      setInterval(function restart() {
        workers[restarting].send({action: 'close', id: restarting});
        if (++restarting >= config.NUMBER_OF_TOR_INSTANCES) {
          restarting = 0;
        }
      }, config.RESTART_PERIOD);
    }
  });
}



function startWorker(id, restartsLeft) {
  const worker = cluster.fork();
  workers[id] = worker;

  worker.on('exit', code => {
    if (code !== 0) {
      restartsLeft--;
      if (restartsLeft > 0) {
        startWorker(id, restartsLeft);
      } else {
        console.error(id + ' exceeded restart limit');
      }
    }
  });

  worker.on('message', msg => {
    if (msg.action === 'close') {
      startWorker(msg.id, config.SPAWN_ATTEMPTS);
    }
  });

  worker.send({
    type: 'run',
    id
  });
}