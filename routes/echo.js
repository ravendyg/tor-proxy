/// <reference path="../lib/index.d.ts" />
'use strict';

var express = require('express');
var router = express.Router();
var proxy = require('../lib/proxy');
var errServ = require('../lib/error');
const utils = require('../utils');

router.get(
  '/',
  ( req, webRes, next ) =>
  {
    // console.log(req.headers['x-real-ip'] || req.ip );
    if ( req.query.url && req.headers['x-real-ip'] && req.headers['x-real-ip'].match('192.168.1') ||
        req.ip.match('127.0.0.1') || req.ip.match('192.168') || req.ip.match('::1')
    )
    {
      let request = proxy.makeRequest( req.query.url );

      request.on('error', reqErrorHandler.bind(request, webRes) );
      webRes.on('error', resErrorHandler );

      request.pipe(webRes);
    }
    else
    {
      next( errServ.create(400, 'bad request') );
    }
  }
);

function reqErrorHandler(res, err)
{
  console.error(utils.logDate(), err.message);
  console.error(utils.logDate(), this.href);
  res.status(500).send();
}

function resErrorHandler(err)
{
  console.error(utils.logDate(), err);
  this.status(500).send();
}

module.exports = router;
