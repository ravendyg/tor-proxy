'use strict';

const enums = require('../enums');

const workers = [];

module.exports = function createMaster({
  config, utils, logger,
  path, fs, exec, execSync,
  workerCommands
}) {

  let running = false;
  let nextToDie = 0;
  let numberOfInstances = config.NUMBER_OF_TOR_INSTANCES;
  const RESTART_PERIOD = config.RESTART_PERIOD;

  function run() {
    if (running) {
      return Promise.reject(new Error('Already running'));
    } else {
      running = true;
      ensureTorDirExists();
      return killAll()
      .then(() => {
        for (let counter = 0; counter < numberOfInstances; counter++) {
          const options = {
            counter,
            restartsLeft: config.SPAWN_ATTEMPTS,
            RESTART_PERIOD
          };
          workerCommands.startWorker(
            options,
            worker => {
              workers[counter] = worker;
            },
            () => {
              workers[counter] = null;
            }
          );
        }

        setInterval(restart, RESTART_PERIOD);
      });
    }
  }

  function restart() {
    if (workers.length) {
      nextToDie = (nextToDie + 1) % workers.length;
      const worker = workers[nextToDie];
      if (worker) {
        worker.send({
          type: enums.messageTypes.RESTART_WORKER
        });
      } else {
        restart();
      }
    }
  }

  function ensureTorDirExists() {
    if (!fs.existsSync(config.TOR_DIR)) {
      fs.mkdirSync(config.TOR_DIR);
    }
    const dataDir = path.join(config.TOR_DIR, 'data-dir');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
  }

  function killAll() {
    return new Promise((resolve, reject) => {
      exec('ps aux | grep ./tor/torrc.', function cb(err, stdout, stderr) {
        if (err) {
          reject(err);
        } else if (stderr) {
          logger.error(utils.logDate(), stderr);
          resolve();
        } else {
          let tasks = stdout.split('\n');
          let torInstances =
            tasks
            .filter(e => e.match(/\.\/tor\/torrc\.[0-9]{1,2}/))
            .map(e => e.match(/\S+/g)[1])
            ;
          for (let instance of torInstances) {
            execSync('kill -9 ' + instance);
          }
          resolve();
        }
      });
    });
  }

  return {
    run,
    killAll
  };
};
