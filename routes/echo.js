/* global process */
'use strict';

var express = require('express');
var router = new express.Router();

var proxy = require('../lib/proxy');
const config = require('../lib/config');

router.get(
  '/',
  (req, res) => {
    if (config.AUTH_TOKEN && req.headers['x-auth-token'] === config.AUTH_TOKEN) {
      proxy.makeRequest(req.query.url, res);
    } else {
      res.status(400).send('bad request');
    }
  }
);



module.exports = router;
