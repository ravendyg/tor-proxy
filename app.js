'use strict';

var express = require('express');

var bodyParser = require('body-parser');

const test = require('./routes/test');
const echo = require('./routes/echo');

const config = require('./lib/config');


var app = express();

app.use(bodyParser.json());


app.use('/test', test);
app.use('/echo', echo);

// catch 404 and forward to error handler
app.use(function (req, res) {
  res.status(400).send();
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