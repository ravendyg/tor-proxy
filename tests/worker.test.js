'use strict';

const sinon = require('sinon');
const {EventEmitter} = require('events');

const config = require('../lib/config');
const createWorker = require('../lib/services/worker');

const enums = require('../lib/enums');

const utils = {
  ensureInstanceInfoFile: sinon.stub(),
  ensureDataDir: sinon.stub()
};
const server = {
  listen: sinon.stub(),
  close: sinon.stub().callsFake(cb => {
    cb();
  })
};
const spawn = sinon.stub();

const counter = 3;
let self, connection;

describe.only('worker', () => {

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
    createWorker({
      self,
      config, server, utils,
      spawn
    });
    sinon.assert.calledWith(self.on, 'message');
  });

  it('starts tor insance with given counter', () => {
    spawn.resetHistory();

    createWorker({
      self,
      config, server, utils,
      spawn
    });

    sinon.assert.calledWith(spawn, 'tor', ['-f', './tor/torrc.' + counter], {cwd: global});
  });

  it('exits on STOP_WORKER message with STOP code', () => {
    spawn.resetHistory();
    spawn.returns(connection);

    createWorker({
      self,
      config, server, utils,
      spawn
    });

    sinon.assert.notCalled(self.exit);
    self.emit('message', {type: enums.messageTypes.STOP_WORKER});
    sinon.assert.calledWith(self.exit, enums.exitCodes.STOP);
  });

  it('kills connection on "exit"', () => {
    spawn.resetHistory();
    spawn.returns(connection);

    createWorker({
      self,
      config, server, utils,
      spawn
    });

    self.emit('exit');
    sinon.assert.calledWith(connection.kill, 'SIGINT');
  });

  it('kills connection on exit', () => {
    spawn.resetHistory();
    spawn.returns(connection);

    createWorker({
      self,
      config, server, utils,
      spawn
    });

    const error = new Error('test');

    connection.stderr.emit('data', error);
    sinon.assert.calledWith(connection.kill, 'SIGINT');
  });

  it('reports connection error to the master and exits with ERROR code', () => {
    spawn.resetHistory();
    spawn.returns(connection);

    createWorker({
      self,
      config, server, utils,
      spawn
    });

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

    createWorker({
      self,
      config, server, utils,
      spawn
    });

    connection.stdout.emit('data', 'some data');
    sinon.assert.notCalled(server.listen);
  });

  it('starts server on "Done"', done => {
    server.listen.resetHistory();
    server.listen.returns(connection);
    spawn.resetHistory();
    spawn.returns(connection);

    createWorker({
      self,
      config, server, utils,
      spawn
    });

    connection.stdout.emit('data', new Buffer('sdf sdfBootstrapped 100%: Done sdfsdf'));
    setTimeout(() => {
      let error;
      try {
        sinon.assert.calledWith(server.listen, config.WORKER_PORT);
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
