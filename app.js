/* global __dirname */
'use strict';

var express = require('express');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// var routes = require('./routes/index');
const echo = require('./routes/echo');
const apiRoute = require('./routes/api');

var app = express();


app.use(bodyParser.json());
app.use(cookieParser());

// app.use('/', routes);
app.use('/echo', echo);
app.use('/api', apiRoute);

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
proxy.setupEnvironment();
proxy.startService();