'use strict';

const messageTypes = {
    RESTART_WORKER: 'restart-worker',
    STOP_WORKER: 'stop-worker',
    NEW_REQUEST: 'new-request',
    REQUEST_COMPLETED: 'request-completed'
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
