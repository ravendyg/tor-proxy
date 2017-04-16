'use strict';

const config = require('../lib/config');


module.exports = function verify(req, res, next) {
  console.log(req.headers);
  if (req.headers['x-auth-token'] === config.AUTH_TOKEN) {
    next();
  } else {
    console.log('bad request')
    res.status(400).send('bad request');
  }
};
