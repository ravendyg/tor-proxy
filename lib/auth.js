'use strict';

const config = require('../lib/config');


module.exports = function verify(req, res, next) {
  if (req.headers['x-auth-token'] === config.AUTH_TOKEN) {
    next();
  } else {
    res.status(400).send('bad request');
  }
};
