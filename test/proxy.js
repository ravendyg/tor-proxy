/* global before, describe, it */
'use strict';

const chai = require('chai');
const assert = chai.assert;
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const config = require('../lib/config');
Object.assign(config, {NUMBER_OF_TOR_INSTANCES: 2});
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
})