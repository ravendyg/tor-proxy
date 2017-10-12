'use strict';

const sinon = require('sinon');
const {EventEmitter} = require('events');

const config = require('../../lib/config');
const createWorker = require('../../lib/services/worker');

const enums = require('../../lib/enums');

const counter = 3;
const torrcFile = './tor/torrc.' + counter;
const utils = {
  ensureInstanceInfoFile: sinon.stub().returns(torrcFile),
  ensureDataDir: sinon.stub()
};
const server = {
  listen: sinon.stub(),
  close: sinon.stub()
};
const spawn = sinon.stub().returns({
  stdout: new EventEmitter(),
  stderr: new EventEmitter(),
});
const logger = {
  log: sinon.stub(),
  error: sinon.stub(),
  debug: sinon.stub()
};

let self, connection;

describe('worker', () => {

  function _createWorker(deps = {}) {
    createWorker(Object.assign({
      self,
      config, server, utils,
      spawn, logger
    }, deps));
  }

  beforeEach(() => {
    self = new EventEmitter();
    Object.assign(self, {
      exit: sinon.stub().callsFake(() => {
        self.emit('exit');
      }),
      send: sinon.stub(),
      env: {
        COUNTER: counter
      }
    });

    connection = new EventEmitter();
    Object.assign(connection, {
      kill: sinon.stub(),
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
  });

  it('subscribes to "message"', () => {
    spawn.resetHistory();
    spawn.returns(connection);

    self = {
      on: sinon.stub(),
      env: {
        COUNTER: counter
      }
    };

    _createWorker();

    sinon.assert.calledWith(self.on, 'message');
  });

  it('starts tor insance with given counter', () => {
    spawn.resetHistory();

    _createWorker();

    sinon.assert.calledWith(spawn, 'tor', ['-f', torrcFile], {cwd: global});
  });


  it('does not exit on RESTART_WORKER message until all request were completed', () => {
    spawn.resetHistory();
    spawn.returns(connection);
    server.close.resetHistory();

    _createWorker();

    self.emit('message', {type: enums.messageTypes.RESTART_WORKER});
    sinon.assert.calledOnce(server.close);
    sinon.assert.notCalled(self.exit);
    server.close.getCall(0).args[0]();
    sinon.assert.calledOnce(self.exit);
  });

  it('stops server and exits on RESTART_WORKER message with RESTART code', () => {
    spawn.resetHistory();
    spawn.returns(connection);
    server.close.resetHistory();

    _createWorker();

    sinon.assert.notCalled(self.exit);
    self.emit('message', {type: enums.messageTypes.RESTART_WORKER});
    server.close.getCall(0).args[0]();
    sinon.assert.calledOnce(server.close);
    sinon.assert.calledWith(self.exit, enums.exitCodes.RESTART);
  });

  it('stops server and exits on STOP_WORKER message with STOP code', () => {
    spawn.resetHistory();
    spawn.returns(connection);
    server.close.resetHistory();

    _createWorker();

    sinon.assert.notCalled(self.exit);
    self.emit('message', {type: enums.messageTypes.STOP_WORKER});
    server.close.getCall(0).args[0]();
    sinon.assert.calledOnce(server.close);
    sinon.assert.calledWith(self.exit, enums.exitCodes.STOP);
  });

  it('kills connection on exit', () => {
    spawn.resetHistory();
    spawn.returns(connection);

    _createWorker();

    const error = new Error('test');

    connection.stderr.emit('data', error);
    sinon.assert.calledWith(connection.kill, 'SIGINT');
  });

  it('reports connection error to the master and exits with ERROR code', () => {
    spawn.resetHistory();
    spawn.returns(connection);

    _createWorker();

    const error = new Error('test');

    connection.stderr.emit('data', error);
    sinon.assert.calledWith(self.send, sinon.match({
      type: 'error-report',
      stack: error.stack
    }));
    sinon.assert.calledWith(self.exit, enums.exitCodes.ERROR);
  });

  it('does nothing on random data', () => {
    server.listen.resetHistory();
    server.listen.returns(connection);

    _createWorker();

    connection.stdout.emit('data', 'some data');
    sinon.assert.notCalled(server.listen);
  });

  it('starts server on "Done"', done => {
    server.listen.resetHistory();
    server.listen.returns(connection);
    spawn.resetHistory();
    spawn.returns(connection);

    _createWorker();

    connection.stdout.emit('data', new Buffer('sdf sdfBootstrapped 100%: Done sdfsdf'));
    setTimeout(() => {
      let error;
      try {
        sinon.assert.calledWith(server.listen, config.PROXY_WORKER_PORT);
        server.listen.getCall(0).args[1]();
        sinon.assert.calledWith(self.send, sinon.match({
          type: 'listening-report',
          counter
        }));
      } catch (err) {
        error = err;
      }
      done(error);
    }, 10);
  });

});
