'use strict';

/** @typedef {{counter: number, restartsLeft: number, timeToLive: number, RESTART_PERIOD: number}} WorkerOptions */

module.exports = function createWorkerCommands({config, cluster, logger}) {

  /**
   * @param {WorkerOptions} options
   * @param {{(worker: NodeJS.Cluster.Worker): void}} onlineCb
   * @param {{(): void}} onfflineCb
   */
  function startWorker(options, onlineCb, offlineCb) {
    let {counter, restartsLeft, timeToLive, RESTART_PERIOD} = options;

    const worker = cluster.fork({
      COUNTER: counter
    });

    worker.on('exit', code => {
      offlineCb();

      if (code === 15) {
        // fresh start - it was to slow
        const newOptions = {
          counter, restartsLeft,
          timeToLive: RESTART_PERIOD, RESTART_PERIOD
        };
        startWorker(newOptions, onlineCb, offlineCb);
        logger.error(counter + ' restart slow');
      } else if (code === 16) {
        // force restart to get a new IP
        const newOptions = {
          counter, restartsLeft,
          timeToLive: RESTART_PERIOD, RESTART_PERIOD
        };
        startWorker(newOptions, onlineCb, offlineCb);
      } else if (code !== 0) {
        restartsLeft--;
        const newOptions = {
          counter, restartsLeft,
          timeToLive: RESTART_PERIOD, RESTART_PERIOD
        };
        if (restartsLeft > 0) {
          startWorker(newOptions, onlineCb, offlineCb);
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
