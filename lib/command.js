'use strict';

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
      }
    }
  });
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

