'use strict';

const asser = require('chai').assert;
const sinon = require('sinon');
const {EventEmitter} = require('events');

const config = require('../../lib/config');
const createWorkerCommands = require('../../lib/services/worker-commands');

let workers = [], worker;

const cluster = {
  fork: sinon.stub().callsFake(() => {
    const _worker = Object.assign(
      new EventEmitter(),
      {
        send: sinon.stub()
      }
    );
    workers.push(_worker);
    return _worker;
  })
};

const logger = {
  log: sinon.stub(),
  error: sinon.stub()
};

const deps = {
  config,
  cluster,
  logger
};

let workerCommands;

describe('worker commands service', () => {

  beforeEach(() => {
    workers = [];
    workerCommands = createWorkerCommands(deps);
  });

  it('returns an object with correct methods', () => {
    asser.isObject(workerCommands);
    asser.isFunction(workerCommands.startWorker);
  });

  it('forks', () => {
    const options = {
      counter: 0,
      restartsLeft: config.SPAWN_ATTEMPTS,
      timeToLive: config.RESTART_PERIOD,
      RESTART_PERIOD: config.RESTART_PERIOD
    };
    workerCommands.startWorker(options, () => {}, () => {});
    sinon.assert.calledWith(cluster.fork, sinon.match({
        COUNTER: 0
    }));
  });

  it('executes onlineCb callback on "online"', () => {
    const cb = sinon.stub();
    const options = {
      counter: 0,
      restartsLeft: config.SPAWN_ATTEMPTS,
      timeToLive: config.RESTART_PERIOD,
      RESTART_PERIOD: config.RESTART_PERIOD
    };
    workerCommands.startWorker(options, cb, () => {});
    worker = workers[0];
    worker.send.reset();
    worker.emit('online');
    sinon.assert.called(cb);
  });

  it('executes offlineCb callback on "exit"', () => {
    const cb = sinon.stub();
    const options = {
      counter: 0,
      restartsLeft: config.SPAWN_ATTEMPTS,
      timeToLive: config.RESTART_PERIOD,
      RESTART_PERIOD: config.RESTART_PERIOD
    };
    workerCommands.startWorker(options, () => {}, cb);
    worker = workers[0];
    worker.send.reset();
    worker.emit('exit', 15);
    sinon.assert.called(cb);
  });

  it('restarts on slow exit and logs an error', () => {
    const options = {
      counter: 0,
      restartsLeft: config.SPAWN_ATTEMPTS,
      timeToLive: config.RESTART_PERIOD,
      RESTART_PERIOD: config.RESTART_PERIOD
    };
    workerCommands.startWorker(options, () => {}, () => {});
    worker = workers[0];
    worker.send.reset();
    cluster.fork.resetHistory();
    worker.emit('exit', 15);
    sinon.assert.called(cluster.fork);
    sinon.assert.calledWith(logger.error, '0 restart slow');
  });

  it('restarts on restart without a log', () => {
    const options = {
      counter: 0,
      restartsLeft: config.SPAWN_ATTEMPTS,
      timeToLive: config.RESTART_PERIOD,
      RESTART_PERIOD: config.RESTART_PERIOD
    };
    workerCommands.startWorker(options, () => {}, () => {});
    worker = workers[0];
    worker.send.reset();
    cluster.fork.resetHistory();
    logger.error.resetHistory();
    logger.log.resetHistory();
    worker.emit('exit', 16);
    sinon.assert.called(cluster.fork);
    sinon.assert.notCalled(logger.error);
    sinon.assert.notCalled(logger.log);
  });

});
