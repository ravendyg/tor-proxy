'use strict';

module.exports = function createProxyRoute({
  self, auth, utils,
  agent, agents,
  request, pump, URL
}) {

  return function use(req, res) {
    if (!auth.verify(req)) {
      res.statusCode = 403;
      res.end();
    } else {
      let parsedUrl;
      try {
        parsedUrl = URL.parse(req.headers.url);
        delete req.headers['x-auth-token'];
        delete req.headers.url;
        const agentClass = parsedUrl.protocol === 'https:' ? agents : agent;
        pump(
          createRequest(
            parsedUrl.href,
            req.headers,
            agentClass
          ),
          res,
          () => {}
        );
      res.end();
      } catch (err) {
        res.statusCode = 400;
        res.end();
      }
    }
  };


  function createRequest(url, headers, agentClass) {
    let port = utils.mapCounterToPort(self.env.COUNTER);
    if (!headers) {
      headers = {};
    }
    const _request = request(
      {
        url,
        method: 'GET',
        headers,
        encoding: null,
        followAllRedirects: true,
        agentClass,
        agentOptions:
        {
          socksHost: '127.0.0.1',
          socksPort: port
        }
      }
    );

    return _request;
  }
};
