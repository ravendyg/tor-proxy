'use strict';

module.exports = function createProxyRoute({
  self, auth, utils,
  agent, agents,
  request, pump, URL,
  logger
}) {
  return function use(req, res) {
    if (!auth.verify(req)) {
      utils.respond(res, 403);
    } else {
      let parsedUrl;
      try {
        parsedUrl = URL.parse(req.headers.url);
        delete req.headers.url;
        const agentClass = parsedUrl.protocol === 'https:' ? agents : agent;

        const _request = createRequest(parsedUrl.href, req.headers, agentClass);
        pump(_request, res, err => {
          if (err) {
            logger.error(err);
            utils.respond(res, 500);
          }
        });
      } catch (err) {
        logger.error(err);
        utils.respond(res, 400);
      }
    }
  };


  function createRequest(url, headers, agentClass) {
    let port = utils.mapCounterToPort(self.env.COUNTER);
    if (!headers) {
      headers = {};
    }
    headers['user-agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.110 Safari/537.36';
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
