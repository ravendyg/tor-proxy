'use strict';

module.exports = function createAuth({config}) {
  function verify(req) {
    return req.headers['x-auth-token'] === config.AUTH_TOKEN;
  }

  return {
    verify
  };
};
