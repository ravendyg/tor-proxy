'use strict';

const enums = require('../enums');

module.exports = function createWorker({
  self, // an alias for process
  config, server, utils,
  spawn
}) {

  const counter = self.env.COUNTER;
  let exitCode = null;
  let activeConnections = 0;

  utils.ensureInstanceInfoFile(counter);
  utils.ensureDataDir(counter);

  startTorInstance(counter)
  .then(() => {
    server.listen(config.WORKER_PORT, () => {
      self.send({
        type: 'listening-report',
        counter
      });
    });
  })
  .catch(() => {});

  function startTorInstance(num) {
    return new Promise((resolve, reject) => {
      var connection = spawn('tor', ['-f', './tor/torrc.' + num], {cwd: global});
      connection.stdout.on(
        'data',
        data => {
          if (/Bootstrapped 100\%\: Done/.test(data.toString('utf8'))) {
            resolve();
          }
        }
      );

      connection.stderr.on(
        'data',
        error => {
          reject();
          self.send({
            type: 'error-report',
            stack: error.stack
          });
          exitCode = enums.exitCodes.ERROR;
          tryToStop();
        }
      );

      self.on('exit', () => {
        connection.kill('SIGINT');
      });

      self.on('message', msg => {
        switch (msg.type) {

          case enums.messageTypes.RESTART_WORKER: {
            server && server.close(() => {
              exitCode = enums.exitCodes.RESTART;
              tryToStop();
            });
            break;
          }

          case enums.messageTypes.STOP_WORKER: {
            server && server.close(() => {
              exitCode = enums.exitCodes.STOP;
              tryToStop();
            });
            break;
          }

        }
      });

    });
  }

  function tryToStop() {
    activeConnections === 0 && self.exit(exitCode);
  }
};
