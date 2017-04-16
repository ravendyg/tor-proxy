'use strict';

module.exports = {
  getAvailableMirrors,
  verifyMirror
};

let availableMirrors = ['meself'];

function getAvailableMirrors() {
  return availableMirrors.slice(0);
};

function verifyMirror(mirror) {
  return mirror && /https?\:\/\/.*/.test(mirror);
}

process.on('message', msg => {
  switch (msg.type) {
    case 'add mirror':
      if (!availableMirrors.find(e => e === msg.payload)) {
        availableMirrors.push(msg.payload);
      }
    break;

    case 'remove mirror':
      if (msg.payload !== 'meself') {
        availableMirrors = availableMirrors.filter(e => e !== msg.payload);
      }
    break;
  }
});
