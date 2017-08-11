'use strict';

const workers = [];

module.exports = function createMaster({
  self, config, utils, logger,
  path, fs, exec, execSync,
  workerCommands
}) {

  let running = false;
  let numberOfInstances = self.env.INSTANCE || config.NUMBER_OF_TOR_INSTANCES;

  function run() {
    if (running) {
      return Promise.reject(new Error('Already running'));
    } else {
      running = true;
      ensureTorDirExists();
      return killAll()
      .then(() => {
        for (let i = 0; i < numberOfInstances; i++) {
          workerCommands.startWorker(i, config.SPAWN_ATTEMPTS, worker => {
            workers[i] = worker;
          });
        }
      });
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
