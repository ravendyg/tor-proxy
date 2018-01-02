'use strict';

const enums = require('../enums');

module.exports = function createWorker({
  self, // an alias for process
  config, server, utils,
  spawn, logger
}) {
  const counter = self.env.COUNTER;

  const torrcFile = utils.ensureInstanceInfoFile(counter);
  utils.ensureDataDir(counter);

  if (!self.send) {
    self.send = () => {};
  }

  /** connection */
  const connection = spawn('tor', ['-f', torrcFile]);

  connection.stdout.on(
    'data',
    data => {
      if (/Bootstrapped 100\%\: Done/.test(data.toString('utf8'))) {
        server.listen(config.PROXY_WORKER_PORT, () => {
          logger.log(`Worker ${counter} on port ${config.PROXY_WORKER_PORT}`);
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
      tryToStop(enums.exitCodes.ERROR);
    }
  );
  /** connection */

  /** process */
  self.on('exit', () => {
    logger.debug('kill tor ' + process.env.COUNTER);
    connection.kill('SIGINT');
  });

  self.on('message', msg => {
    switch (msg.type) {

      case enums.messageTypes.RESTART_WORKER: {
        server && server.close(() => {
          tryToStop(enums.exitCodes.RESTART);
        });
        break;
      }

      case enums.messageTypes.STOP_WORKER: {
        server && server.close(() => {
          tryToStop(enums.exitCodes.STOP);
        });
        break;
      }

    }
  });
  /** /process */


  /**
   * @param {number} exitCode
   */
  function tryToStop(exitCode) {
    self.exit(exitCode);
  }
};
