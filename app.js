'use strict';

var express = require('express');

var bodyParser = require('body-parser');

const echo = require('./routes/echo');

const config = require('./lib/config');

var app = express();


app.use(bodyParser.json());


app.use('/echo', echo);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
app.use(
  function (err, req, res, next) {
    res.status(err.status || 500);
    if (err.status !== 404) {
      console.log((new Date()).toLocaleString());
      console.error(err);
    }

    res
    .status(err.status)
    .json({
      message: err.message,
    });
  }
);


module.exports = app;



// services
const proxy = require('./lib/proxy');
const proxySettings = {
  NUMBER_OF_TOR_INSTANCES: config.NUMBER_OF_TOR_INSTANCES,
  START_TOR_PORT: config.START_TOR_PORT,
  RESTART_PERIOD: config.RESTART_PERIOD,
  INSTANCES_USED_SIMULTANEOUSLY: config.INSTANCES_USED_SIMULTANEOUSLY,
  TOR_TIMEOUT: config.TOR_TIMEOUT
};
proxy.setupEnvironment(proxySettings);
proxy.startService();