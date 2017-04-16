'use strict';

const request = require('request');
const pump = require('pump');

const logger = require('./logger');
const {getAvailableMirrors} = require('./mirror');



module.exports = function isRedirectRequired(req, res, next) {
  if (!req.headers.redirected) {
    const
      availableMirrors = getAvailableMirrors(),
      mirror = Math.floor(Math.random() * availableMirrors.length),
      baseUrl = availableMirrors[mirror]
      ;
    if (baseUrl !== 'meself') {
      const
        url = baseUrl + 'echo?url=' + req.query.url;
      logger.log('redirect to ' + url);
      const headers = Object.assign({}, req.headers, {redirected: true});

      const _request = request({
        url,
        method: 'GET',
        headers,
        encoding: null,
        followAllRedirects: true
      });

      _request.on('response', (response) => {
        const headersInt = response.toJSON().headers;
        for (let headerName of Object.keys(headersInt)) {
          res.setHeader(headerName, headersInt[headerName]);
        }

        response.on('error', reqErrorHandler.bind(response, res));
        res.on('error', resErrorHandler);
        pump(response, res, () => {});
      });

      _request.on('error', () => {
        // handle localy
        logger.log('redirect to ' + baseUrl + 'failed');
        next();
      });

      return;
    }
  }

  next();
};

function reqErrorHandler(res, err) {
  logger.error(err.message);
  logger.error(this.href);
  res.status(500).send();
}

function resErrorHandler(err) {
  logger.error(err);
  this.status(500).send();
}
