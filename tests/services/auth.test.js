'use strict';

const {assert} = require('chai');

const config = require('../../lib/config');
config.API_KEY = 'API_KEY';
const createAuth = require('../../lib/services/auth');

const auth = createAuth({config});
const req = {headers: {}};

describe('auth', () => {

    it('returns false if "x-auth-token" header is missing or wrong', () => {
        assert.isFalse(auth.verify(req));
        req.headers['x-auth-token'] = 'garbage';
        assert.isFalse(auth.verify(req));
    });

    it('returns true if "x-auth-token" header is correct', () => {
        req.headers['x-auth-token'] = config.API_KEY;
        assert.isTrue(auth.verify(req));
    });

    it('removes "x-auth-token"  header', () => {
        assert.isUndefined(req.headers['x-auth-token']);
    });

});
