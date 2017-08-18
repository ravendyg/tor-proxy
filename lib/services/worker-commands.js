'use strict';

/** @typedef {{counter: number, restartsLeft: number}} WorkerOptions */

const enums = require('../enums');

module.exports = function createWorkerCommands({cluster, logger}) {

  /**
   * @param {WorkerOptions} options
   * @param {{(worker: NodeJS.Cluster.Worker): void}} onlineCb
   * @param {{(): void}} onfflineCb
   */
  function startWorker(options, onlineCb, offlineCb) {
    let {counter, restartsLeft, config} = options;
    const worker = cluster.fork({
      COUNTER: counter,
      config: JSON.stringify(config)
    });

    worker.on('exit', code => {
      offlineCb();
      if (code === enums.exitCodes.RESTART) {
        // force restart to get a new IP or it was slow
        const newOptions = {
          counter, restartsLeft
        };
        startWorker(newOptions, onlineCb, offlineCb);
      } else if (code !== 0) {
        restartsLeft--;
        const newOptions = {
          counter, restartsLeft
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
