'use strict';

const express = require('express');
const router = new express.Router();

const verify = require('../lib/auth');
const {handleCommand} = require('../lib/command');
const logger = require('../lib/logger');

/**
 * all requests will be received by a random worker
 * therefore all commands should be passed up to the master as messages
 *
 * COMMAND FORMAT
 *  {
 *    action: enum('count workers', add worker', 'remove worker'),
 *    payload?: any
 *  }
 */


router.route('/').post(
  verify,
  (req, res) => {
    const command = req.body;
    if (command) {
      logger.log('received command: ' + JSON.stringify(command));
      handleCommand({command, res});
    } else {
      res.status(400).send();
    }
  }
);



module.exports = router;
