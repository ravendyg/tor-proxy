/// <reference path="../lib/index.d.ts" />
'use strict';

var express = require('express');
var router = express.Router();
var proxy = require('../lib/proxy');
var errServ = require('../lib/error');

router.get(
  '/',
  ( req, webRes, next ) =>
  {
    // console.log(req.headers['x-real-ip'] || req.ip );
    if ( req.query.url && req.headers['x-real-ip'] && req.headers['x-real-ip'].match('192.168.1') ||
        req.ip.match('127.0.0.1') || req.ip.match('192.168') || req.ip.match('::1')
    )
    {
      proxy.makeRequest( req.query.url ).pipe( webRes );
    }
    else
    {
      next( errServ.create(400, 'bad request') );
    }
  }
);

module.exports = router;
