'use strict';

var express = require('express');

var bodyParser = require('body-parser');

const echo = require('./routes/echo');
const command = require('./routes/command');
const logger = require('./lib/logger');


var app = express();
app.disable('x-powered-by');

app.use(bodyParser.json());

app.use('/echo', echo);
app.use('/command', command);

// catch 404 and forward to error handler
app.use(function (req, res) {
  res.sendStatus(400);
});

// error handlers
app.use(
  function (err, req, res, next) {
    if (err.status !== 404) {
      logger.error('error');
      console.error(err.stack || err);
    }

    res.sendStatus(err.status || 500);
  }
);


module.exports = app;