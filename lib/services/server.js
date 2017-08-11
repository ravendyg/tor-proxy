'use strict';

module.exports = function createServer({
  http, config
}) {
  const routes = [];
  const server = http.createServer((req, res) => {
    for (let route of routes) {
      if (route.method === req.method.toLowerCase() && route.url.test(req.url)) {
        route.handler(req, res);
        return;
      }
    }
    res.statusCode = 404;
    res.end();
  });

  server.setTimeout(config.KEEP_ALIVE_TIMEOUT);

  function addRoute(method, url, handler) {
    routes.push({method: method.toLowerCase(), url: new RegExp(url), handler});
  }

  function listen(port, cb) {
    server.listen(port, cb || (() => {}));
  }

  function close(cb) {
    server.close(cb || (() => {}));
  }

  return {
    addRoute,
    listen,
    close
  };
};
