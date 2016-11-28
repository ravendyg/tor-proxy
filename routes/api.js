'use strict';

var express = require('express');
var router = express.Router();
var proxy = require('../lib/proxy');

router.get(
  '/wiki',
  (req,res) =>
  {
    let wiki = proxy.makeRequest( 'http://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=' + req.query.search );

    wiki.on('error', reqErrorHandler.bind(wiki, res) );
    res.on('error', resErrorHandler );

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    wiki.pipe(res);
  }
);

module.exports = router;

function reqErrorHandler(res, err)
{
  console.error(err.message);
  console.error(this.href);
  res.status(500).send();
}

function resErrorHandler(err)
{
  console.error(err);
  this.status(500).send();
}