'use strict';

const cluster = require('cluster');
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const config = require('../config');
const utils = require('../utils');

const {obeyCommand} = require('../command');


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
        const ids = getSortedIds();
        if (restarting >= ids.length) {
          restarting = 0;
        }
        const id = ids[restarting];
        workers[id].send({action: 'close', id});
        restarting++;
      }, config.RESTART_PERIOD);
    }
  });
}



function startWorker(id, restartsLeft, cb) {
  const worker = cluster.fork();
  workers[id] = worker;
  worker.on('exit', code => {
    if (code === 15) {
      // fresh start - it was to slow
      startWorker(id, config.SPAWN_ATTEMPTS);
      console.error(id + ' restart slow');
    } else if (code === 16) {
      startWorker(id, config.SPAWN_ATTEMPTS);
    } else if (code !== 0) {
        restartsLeft--;
      if (restartsLeft > 0) {
        startWorker(id, restartsLeft);
      } else {
        console.error(id + ' exceeded restart limit');
      }
    } else {
      delete workers[id];
      if (getSortedIds().length === 0) {
        process.exit(0);
      }
    }
  });

  if (cb) {
    worker.on('online', cb);
  }

  obeyCommand({worker, workers, addWorker});

  worker.send({
    type: 'run',
    id
  });
}

function addWorker(cb) {
  let i = 0;
  let ids = getSortedIds();
  while (ids[i] === i) {
    i++;
  }
  startWorker(i, config.SPAWN_ATTEMPTS, cb);
}

function getSortedIds() {
  const ids = Object.keys(workers).map(e => +e).sort((e1, e2) => e1 > e2 ? 1 : e1 < e2 ? -1 : 0);
  return ids;
}
