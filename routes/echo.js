/* global process */
'use strict';

var express = require('express');
var router = new express.Router();
var proxy = require('../lib/proxy');
var errServ = require('../lib/error');
const utils = require('../lib/utils');
const config = require('../lib/config');

const authToken = process.env.AUTH_TOKEN || config.AUTH;

router.get(
  '/',
  (req, webRes, next) => {
    if (authToken && req.headers['x-auth-token'] === authToken) {
      let request = proxy.makeRequest(req.query.url);

      request.on('error', reqErrorHandler.bind(request, webRes));
      webRes.on('error', resErrorHandler);

      request.pipe(webRes);
    } else {
      next(errServ.create(400, 'bad request'));
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
