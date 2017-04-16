/* global process */
'use strict';

const express = require('express');
const router = new express.Router();

const verify = require('../lib/auth');
const isRedirectRequired = require('../lib/balancer');
const proxy = require('../lib/proxy');

router.route('/').get(
  verify,
  isRedirectRequired,
  (req, res) => {
    proxy.makeRequest(req.query.url, res);
  }
);



module.exports = router;
