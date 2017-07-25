'use strict';

module.exports = function createProxyRoute({
  auth
}) {

  return function use(req, res) {
    res.end('q');
  };
};
