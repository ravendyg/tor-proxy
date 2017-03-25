/* global process */
'use strict';

var express = require('express');
var router = new express.Router();
var proxy = require('../lib/proxy');
const utils = require('../lib/utils');
const config = require('../lib/config');

router.get(
  '/',
  (req, res) => {
    if (config.AUTH_TOKEN && req.headers['x-auth-token'] === config.AUTH_TOKEN) {
      let request = proxy.makeRequest(req.query.url);

      request.on('error', reqErrorHandler.bind(request, res));
      res.on('error', resErrorHandler);

      request.pipe(res);
    } else {
      res.status(400).send('bad request');
    }
  }
);

function reqErrorHandler(res, err) {
  console.error(utils.logDate(), err.message);
  console.error(utils.logDate(), this.href);
  res.status(500).send();
}

function resErrorHandler(err) {
  console.error(utils.logDate(), err);
  this.status(500).send();
}

module.exports = router;
