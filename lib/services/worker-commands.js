'use strict';

module.exports = function createWorkerCommands({config, cluster, logger}) {

  function mapCounterToPort(counter) {
    return config.START_TOR_PORT + counter * 2;
  }

  /**
   * @param {number} port
   * @param {number} restartsLeft
   * @param {{(): void}} onlineCb
   */
  function startWorker(position, restartsLeft, onlineCb) {
    const worker = cluster.fork();

    worker.on('exit', code => {
      if (code === 15) {
        // fresh start - it was to slow
        startWorker(position, config.SPAWN_ATTEMPTS);
        logger.error(position + ' restart slow');
      } else if (code === 16) {
        // force restart to get a new IP
        startWorker(position, config.SPAWN_ATTEMPTS);
      } else if (code !== 0) {
        restartsLeft--;
        if (restartsLeft > 0) {
          startWorker(position, restartsLeft);
        } else {
          logger.error(position + ' exceeded restart limit');
        }
      }
    });

    worker.on('online', () => {
      onlineCb(worker);
      // start server
      worker.send({type: 'run', port: mapCounterToPort(position)});
    });
  }

  return {
    startWorker
  };
};
