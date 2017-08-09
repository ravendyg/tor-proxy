'use strict';

module.exports = function createAuth({config}) {

  function verify(req) {
    const authorized = req.headers['x-auth-token'] === config.API_KEY;
    delete req.headers['x-auth-token'];
    return authorized;
  }

  return {
    verify
  };
};
