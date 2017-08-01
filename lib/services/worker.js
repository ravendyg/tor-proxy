'use strict';

const enums = require('../enums');

module.exports = function createWorker({
  self, // an alias for process
  config, server, utils, messenger,
  spawn
}) {
  const counter = self.env.COUNTER;
  let exitCode = null;
  let activeRequests = 0;

  const torrcFile = utils.ensureInstanceInfoFile(counter);
  utils.ensureDataDir(counter);

  if (!self.send) {
    self.send = () => {};
  }

  /** connection */
  const connection = spawn('tor', ['-f', torrcFile], {cwd: global});

  connection.stdout.on(
    'data',
    data => {
      if (/Bootstrapped 100\%\: Done/.test(data.toString('utf8'))) {
        server.listen(config.WORKER_PORT, () => {
          self.send({
            type: 'listening-report',
            counter
          });
        });
      }
    }
  );

  connection.stderr.on(
    'data',
    error => {
      self.send({
        type: 'error-report',
        stack: error.stack
      });
      exitCode = enums.exitCodes.ERROR;
      tryToStop();
    }
  );
  /** connection */

  /** process */
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
  /** process */

  /** requests */
  messenger.on(enums.messageTypes.NEW_REQUEST, () => {
    activeRequests++;
  });
  messenger.on(enums.messageTypes.REQUEST_COMPLETED, () => {
    activeRequests--;
    if (exitCode !== null) {
      tryToStop();
    }
  });
  /** requests */

  function tryToStop() {
    if (activeRequests === 0) {
      self.exit(exitCode);
    }
  }
};
