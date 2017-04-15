'use strict';

module.exports = {
  handleCommand,
  obeyCommand
};

function handleCommand({command, res}) {
  switch (command.action) {
    case 'count workers':
      let handler = {};
      handler.foo = createCountHandler(res, handler);
      process.on('message', handler.foo);
      const message = {
        type: 'command',
        command
      };
      process.send(message);
    break;
  }
}

function obeyCommand({worker, workers}) {
  worker.on('message', msg => {
    if (msg.type === 'command') {
      switch (msg.command.action) {
        case 'count workers':
          const message = {
            type: 'count',
            value: Object.keys(workers).length
          };
          worker.send(message);
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
