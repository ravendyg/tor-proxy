'use strict';

const messageTypes = {
    RESTART_WORKER: 'restart-worker',
    STOP_WORKER: 'stop-worker'
};

const exitCodes = {
    OK: 0,
    ERROR: 1,
    RESTART: 2,
    STOP: 16
};

module.exports = {
    messageTypes,
    exitCodes
};
