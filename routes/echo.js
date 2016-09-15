/// <reference path="../lib/index.d.ts" />
'use strict';

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get(
  '/',
  ( req, webRes ) =>
  {
    webRes.json( { status: 'accepted' });

    console.log(req.headers['x-real-ip']);
  }
);

module.exports = router;
