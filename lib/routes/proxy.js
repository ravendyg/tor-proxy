'use strict';

const enums = require('../enums');

module.exports = function createProxyRoute({
  self, auth, utils,
  agent, agents, randomUa,
  request, pump, URL,
  logger, messenger
}) {
  return function use(req, res) {
    if (!auth.verify(req)) {
      utils.respond(res, 403);
    } else {
      let parsedUrl;
      messenger.emit(enums.messageTypes.NEW_REQUEST);
      try {
        parsedUrl = URL.parse(req.headers.url);
        delete req.headers.url;
        const agentClass = parsedUrl.protocol === 'https:' ? agents : agent;
        const _request = createRequest(parsedUrl, req.headers, agentClass);
        pump(_request, res, err => {
          messenger.emit(enums.messageTypes.REQUEST_COMPLETED);
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


  function createRequest(parsedUrl, headers, agentClass) {
    let port = utils.mapCounterToPort(self.env.COUNTER);
    if (!headers) {
      headers = {};
    }
    headers['user-agent'] = randomUa.generate();
    headers.host = parsedUrl.hostname;

    const _request = request(
      {
        url: parsedUrl.href,
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
