'use strict';

const {getAvailableMirrors, verifyMirror} = require('./mirror');

module.exports = {
  handleCommand,
  obeyCommand
};

function handleCommand({command, res}) {
  let handler = {};
  let message;

  switch (command.action) {
    case 'count workers':
      handler.foo = createCountHandler(res, handler);
      process.on('message', handler.foo);
      message = {
        type: 'command',
        command
      };
      process.send(message);
    break;

    case 'add worker':
      handler.foo = createCountHandler(res, handler);
      process.on('message', handler.foo);
      message = {
        type: 'command',
        command
      };
      process.send(message);
    break;

    case 'remove worker':
      process.on('message', createRemoveHandler(res));
      message = {
        type: 'command',
        command: {
          action: 'count workers'
        }
      };
      process.send(message);
    break;

    case 'get mirrors':
      res.json({
        mirrors: getAvailableMirrors()
      });
    break;

    case 'add mirror':
      if (!verifyMirror(command.payload)) {
        res.status(400).send();
        break;
      }
      message = {
        type: 'command',
        command: {
          action: 'add mirror',
          payload: command.payload
        }
      };
      process.send(message);
      res.sendStatus(204);
    break;

    case 'remove mirror':
      message = {
        type: 'command',
        command: {
          action: 'remove mirror',
          payload: command.payload
        }
      };
      process.send(message);
      res.sendStatus(204);
    break;
  }
}

function obeyCommand({worker, workers, addWorker}) {
  let message;

  worker.on('message', msg => {
    if (msg.type === 'command') {
      switch (msg.command.action) {
        case 'count workers':
          message = {
            type: 'count',
            value: Object.keys(workers).length
          };
          worker.send(message);
        break;

        case 'add worker':
          addWorker(()=> {
            message = {
              type: 'count',
              value: Object.keys(workers).length
            };
            worker.send(message);
          });
        break;

        case 'add mirror':
          message = {
            type: 'add mirror',
            payload: msg.command.payload
          }
          broadcast(workers, message);
        break;

        case 'remove mirror':
          message = {
            type: 'remove mirror',
            payload: msg.command.payload
          }
          broadcast(workers, message);
        break;
      }
    }
  });
}


function broadcast(workers, msg) {
  for (let key of Object.keys(workers)) {
    workers[key].send(msg);
  }
}


function createCountHandler(res, handler) {
  return function handleCount(message) {
    if (message.type === 'count') {
      res.json({
        count: message.value
      });
      process.removeListener('message', handler.foo);
    }
  };
}

function createRemoveHandler(res) {
  return function handleCount(message) {
    if (message.type === 'count') {
      res.json({
        count: message.value - 1
      });
      process.exit(0);
    }
  };
}

