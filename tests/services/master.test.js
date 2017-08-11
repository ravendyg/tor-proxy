'use strict';

const asser = require('chai').assert;
const sinon = require('sinon');
const path = require('path');

const config = require('../../lib/config');
const utils = require('../../lib/utils');
const createMasterService = require('../../lib/services/master');

config.NUMBER_OF_TOR_INSTANCES = 3;

const fs = {
  existsSync: sinon.stub(),
  mkdirSync: sinon.stub()
};
const exec = sinon.stub();
const execSync = sinon.stub();
const workerCommands = {
  startWorker: sinon.stub()
};
const self = {
  env: {}
};

const deps = {
  self, config, utils,
  path, fs, exec, execSync,
  workerCommands
};

let masterService;

describe('master service', () => {

  beforeEach(() => {
    masterService = createMasterService(deps);
  });

  it('returns an object with correct methods', () => {
    asser.isObject(masterService);
    asser.isFunction(masterService.run);
    asser.isFunction(masterService.killAll);
  });

  it('rejects if already running', done => {
    masterService.run();
    masterService.run()
    .then(() => {
      done(new Error('shoulf hasve thrown'));
    })
    .catch(err => {
      asser.equal(err.message, 'Already running');
      done();
    });
  });

  it('checks that tor directory exists, if does nothing', () => {
    fs.existsSync.reset();
    fs.mkdirSync.reset();
    fs.existsSync.returns(true);
    masterService.run();
    sinon.assert.notCalled(fs.mkdirSync);
  });

  it('checks that tor directory exists, if not creates it', () => {
    fs.existsSync.reset();
    fs.mkdirSync.reset();
    fs.existsSync.returns(false);
    masterService.run();
    sinon.assert.calledWith(fs.mkdirSync, config.TOR_DIR);
    sinon.assert.calledWith(fs.mkdirSync, path.join(config.TOR_DIR, 'data-dir'));
  });

  it('gets a list of tor instances running', done => {
    exec.callsFake((command, cb) => {
      cb(null, '', '');
    });
    masterService.run()
    .then(() => {
      sinon.assert.calledWith(exec, 'ps aux | grep ./tor/torrc.');
      done();
    })
    .catch(done);
  });

  it('kills tor instances with a number in it\'s name and does not touch without a number', done => {
    const psResponse =
      'me        8213  0.0  0.0  12788   992 pts/3    S+   11:35   0:00 grep ./tor/torrc.' + '\n' +
      'me        8513  0.0  0.0  12788   992 pts/3    S+   11:35   0:00 grep ./tor/torrc.1' + '\n' +
      'me        1213  0.0  0.0  12788   992 pts/3    S+   11:35   0:00 grep ./tor/torrc.4' + '\n'
      ;
    exec.reset();
    exec.callsFake((command, cb) => {
      cb(null, psResponse, '');
    });
    execSync.reset();
    masterService.run()
    .then(() => {
      sinon.assert.calledWith(execSync, 'kill -9 8513');
      sinon.assert.calledWith(execSync, 'kill -9 1213');
      done();
    })
    .catch(done);
  });

  it('creates workers', done => {
    workerCommands.startWorker.resetHistory();
    masterService.run()
    .then(() => {
      const options = {
        counter: 0,
        restartsLeft: config.SPAWN_ATTEMPTS,
        timeToLive: config.RESTART_PERIOD,
        RESTART_PERIOD: config.RESTART_PERIOD
      };
      sinon.assert.calledWith(workerCommands.startWorker, sinon.match(options));
      options.counter = 1;
      sinon.assert.calledWith(workerCommands.startWorker, sinon.match(options));
      options.counter = 2;
      sinon.assert.calledWith(workerCommands.startWorker, sinon.match(options));
      done();
    })
    .catch(done);
  });

  it('uses env.INSTANCE (if provided) to determine number of workers', done => {
    workerCommands.startWorker.resetHistory();
    self.env = {
      INSTANCE: 2
    };
    // reset new process
    masterService = createMasterService(deps);
    masterService.run()
    .then(() => {
      sinon.assert.calledTwice(workerCommands.startWorker);
      done();
    })
    .catch(done);
  });

});
