'use strict';

module.exports = function createWorker({
  self, // an alias for process
  config, server, utils,
  spawn,
}) {

  function startTorInstance(counter) {
    return new Promise((resolve, reject) => {
      var connection = spawn('tor', ['-f', './tor/torrc.' + counter], {cwd: global});
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
          connection.kill('SIGINT');
          self.exit(1);
        }
      );

      self.on('exit', () => {
        connection.kill('SIGINT');
      });

      self.on('message', msg => {
        if (msg.type === 'close') {
          self.exit(16);
        }
      });
    });
  }

  self.on('message', msg => {
    switch (msg.type) {
      case 'run': {
        utils.ensureInstanceInfoFile(msg.counter);
        utils.ensureDataDir(msg.counter);

        startTorInstance(msg.counter)
        .then(() => {
          server.listen(config.WORKER_PORT, () => {
            self.send({
              type: 'listening-report',
              counter: msg.counter
            });
          });
        })
        .catch(() => {});
      }
    }
  });
};
