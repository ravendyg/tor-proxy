'use strict';

module.exports = function createWorkerCommands({config, cluster, logger}) {

  /**
   * @param {number} port
   * @param {number} restartsLeft
   * @param {{(): void}} onlineCb
   */
  function startWorker(counter, restartsLeft, onlineCb) {
    const worker = cluster.fork({
      COUNTER: counter
    });

    worker.on('exit', code => {
      if (code === 15) {
        // fresh start - it was to slow
        startWorker(counter, config.SPAWN_ATTEMPTS);
        logger.error(counter + ' restart slow');
      } else if (code === 16) {
        // force restart to get a new IP
        startWorker(counter, config.SPAWN_ATTEMPTS);
      } else if (code !== 0) {
        restartsLeft--;
        if (restartsLeft > 0) {
          startWorker(counter, restartsLeft);
        } else {
          logger.error(counter + ' exceeded restart limit');
        }
      }
    });

    worker.on('online', () => {
      onlineCb(worker);
    });
  }

  return {
    startWorker
  };
};
