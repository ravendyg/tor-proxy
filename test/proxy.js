/* global describe, it */
'use strict';

const chai = require('chai');
const assert = chai.assert;
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const http = require('http');
const Bluebird = require('bluebird');

const instancesCount = 2;

const config = require('../lib/config');
Object.assign(config, {NUMBER_OF_TOR_INSTANCES: instancesCount});
const proxy = require('../lib/proxy');

describe('proxy', function testProxy() {
  it('start and emit "available"', function startProxy(done) {
    this.timeout(5000);

    proxy.setupEnvironment(config);
    const unsubscribe = proxy.on('available', function availableHandler() {
      unsubscribe();
      done();
    });
    proxy.startService();
  });

  it('make a request', function makeRequest(done) {
    this.timeout(5000);

    makeTestRequest(config.PORT)
    .then(function (server) {
      server.close();
      done();
    });
  });

  it('make more requests then tor instance available', function makeRequest(done) {
    this.timeout(5000);

    const calls = [];
    for (let port = 3000; port <= 3000 + instancesCount; port++) {
      calls.push(makeTestRequest(port));
    }

    Bluebird.all(calls)
    .then(function (servers) {
      for (let server of servers) {
        server.close();
      }
      done();
    })
    .catch(console.error);

  });

  it('stop service', function stopProxy(done) {
    this.timeout(5000);
    assert.equal(proxy.stopService(), 'stoped');

    makeTestRequest(config.PORT)
    .catch(function (err) {
        assert.equal(err, 'stoped');
        done();
    });
  });

  it('start and store requests before available', function startProxy(done) {
    this.timeout(10000);

    const unsubscribe = proxy.on('available', function availableHandler() {
      unsubscribe();
    });
    proxy.startService();

    makeTestRequest(config.PORT)
    .then(function (server) {
      server.close();
      done();
    });
  });
})


function makeTestRequest(port) {
  return new Bluebird(function (resolve, reject) {
    let done = false;
    const server = http.createServer(function (req, res) {
      const result = proxy.makeRequest('http://ngs.ru', res);
      if (result) {
        done = true;
        server.close();
        reject(result);
      }
    });

    server.listen(port);

    chai.request('http://localhost:' + port)
      .get('/echo?url=' + encodeURI('http://ngs.ru'))
      .set('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36')
      .set('content-type', 'application/json; charset=utf-8')
      .end(function responseHandler(err, res) {
        if (!done) {
          assert.isNull(err);
          assert.equal(res.status, 200);
          const re = new RegExp('https://ngs.ru/static/img/sharingImg/sharingLogo.png');
          assert.isTrue(re.test(res.text));
          done = true;
          resolve(server);
        }
      });
  });
}
