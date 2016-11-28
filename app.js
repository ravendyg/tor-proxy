/// <reference path="./lib/index.d.ts" />
/* global __dirname */
'use strict';

var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// var routes = require('./routes/index');
const echo = require('./routes/echo');
const apiRoute = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', routes);
app.use('/echo', echo);
app.use('/api', apiRoute);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next( err );
});

// error handlers
app.use(
  function(err, req, res, next)
  {
    res.status(err.status || 500);
    if ( err.status !== 404 )
    {
      console.log( (new Date()).toLocaleString() );
      console.error(err);
    }

    res
    .status( err.status )
    .json({
      message: err.message,
    });
  }
);


module.exports = app;


// services
const proxy = require('./lib/proxy');
proxy.startService();