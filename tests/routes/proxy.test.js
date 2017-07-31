'use strict';

const
    assert = require('chai').assert,
    sinon = require('sinon'),
    path = require('path'),
    fs = require('fs'),

    config = require('../../lib/config'),
    createProxyRoute = require('../../lib/routes/proxy'),
    utils = require('../../lib/utils')({config, fs, path}),
    self = {
        env: {
            COUNTER: 2
        }
    },
    auth = {
        verify: sinon.stub()
    },
    url = 'http://somedomain.com/?serf=ere',
    urls = 'https://somedomain.com/?werwe=err',
    agent = {},
    agents = {},
    request = sinon.stub(),
    pump = sinon.stub(),
    createReq = () => ({
        headers: {
            url,
            'x-auth-token': 'x-auth-token'
        }
    }),
    res = {
        statusCode: 200,
        end: sinon.stub()
    },
    URL = require('url'),
    proxyRoute = createProxyRoute({
        self, auth, utils,
        agent, agents,
        request, pump, URL
    })
    ;

describe('proxy route', () => {

    describe('authorithation', () => {

        it('verifies credentials', () => {
            auth.verify.resetHistory();

            const req = createReq();
            proxyRoute(req, res);
            sinon.assert.calledWith(auth.verify, req);
        });

        it('sends 403 if not authorized', () => {
            auth.verify.reset();
            auth.verify.returns(false);
            res.statusCode = 200;
            res.end.resetHistory();

            const req = createReq();
            proxyRoute(req, res);

            assert.equal(403, res.statusCode);
            sinon.assert.calledOnce(res.end);
        });

    });

    describe('proxy request', () => {

        before(() => {
            auth.verify.returns(true);
        });

        it('sends 400 if url is not valid', () => {
            res.statusCode = 200;
            res.end.resetHistory();

            const req = createReq();
            delete req.headers.url;
            proxyRoute(req, res);

            assert.equal(400, res.statusCode);
            sinon.assert.calledOnce(res.end);
        });

        it('creates a GET request to provided url', () => {
            request.resetHistory();

            const req = createReq();
            proxyRoute(req, res);

            sinon.assert.calledOnce(request);
            const args = request.getCall(0).args;
            assert.equal(args[0].url, url);
            assert.equal(args[0].method, 'GET');
        });

        it('uses http agent', () => {
            request.resetHistory();

            const req = createReq();
            proxyRoute(req, res);

            sinon.assert.calledOnce(request);
            const args = request.getCall(0).args;
            assert.equal(args[0].agentClass, agent);
        });

        it('uses https agent', () => {
            request.resetHistory();

            const req = createReq();
            req.headers.url = urls;
            proxyRoute(req, res);

            sinon.assert.calledOnce(request);
            const args = request.getCall(0).args;
            assert.equal(args[0].agentClass, agents);
        });

    });

});
