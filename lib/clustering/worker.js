'use strict';

const http = require('http');
const app = require('../../app');

const proxy = require('../proxy');
const config = require('../config');

process.on('message', msg => {

    if (msg.type === 'run') {
      proxy.start(msg.id).then(() => {

        /**
         * Get port from environment and store in Express.
         */

        var port = normalizePort(config.PORT);
        app.set('port', port);

        /**
         * Create HTTP server.
         */

        var server = http.createServer(app);

        /**
         * Listen on provided port, on all network interfaces.
         */

        server.listen(port);
        server.on('error', onError);

        /**
         * Normalize a port into a number, string, or false.
         */

        function normalizePort(val) {
          var _port = parseInt(val, 10);

          if (isNaN(_port)) {
            // named pipe
            return val;
          }

          if (_port >= 0) {
            // port number
            return _port;
          }

          return false;
        }

        /**
         * Event listener for HTTP server "error" event.
         */

        function onError(error) {
          if (error.syscall !== 'listen') {
            throw error;
          }

          var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

          // handle specific listen errors with friendly messages
          switch (error.code) {
            case 'EACCES':
              console.error(bind + ' requires elevated privileges');
              process.exit(1);
              break;
            case 'EADDRINUSE':
              console.error(bind + ' is already in use');
              process.exit(1);
              break;
            default:
              throw error;
          }
        }
      });
    }
  });