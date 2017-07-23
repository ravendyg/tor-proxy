'use strict';

const {assert} = require('chai');
const http = require('http');
const request = require('request');
const config = require('../lib/config');

const createServer = require('../lib/services/server');

const server = createServer({http});

describe('server service', () => {

  before(done => {
    server.listen(config.WORKER_PORT, done);
  });

  it('returns an object with correct methods', () => {
    assert.isObject(server);
    assert.isFunction(server.addRoute);
    assert.isFunction(server.listen);
  });

  it('adds a route and executes it when method and url matches', done => {
    const method = 'GET';
    const url = '/some-path';

    const handler = (req, res) => {
      res.end('test');
    };
    server.addRoute(method, url, handler);

    request({
      url: 'http://localhost:' + config.WORKER_PORT + '/some-path',
      method
    }, (err, res, body) => {
      assert.equal(res.statusCode, 200);
      assert.equal(body, 'test');
      done();
    });
  });

  it('returns 404 when cannot find matching route', done => {
    const method = 'GET';

    request({
      url: 'http://localhost:' + config.WORKER_PORT,
      method
    }, (err, res) => {
      assert.equal(res.statusCode, 404);
      done();
    });
  });

  after(done => {
    server.close(done);
  });

});
