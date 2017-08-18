#!/usr/bin/env node

const cluster = require('cluster');

if (cluster.isMaster) {
  const program = require('commander');
  const pjson = require('./package.json');
  const parseint = val => parseInt(val);

  program
    .version(pjson.version)
    .option(
      '--workers <number>',
      'number of worker processes - default: 2',
      parseint,
      2
    )
    .option(
      '--restart-period <number>',
      'restart period in minutes - default: 30',
      parseint,
      30
    )
    .option(
      '--timeout <number>',
      'connection timeout in seconds - default: 120',
      parseint,
      120
    )
    .option(
      '--start-port <number>',
      'start tor port (incremented by 2) - default: 9060',
      parseint,
      9060
    )
    .option(
      '--restart-attempts <number>',
      'restart attempts - default: 5',
      parseint,
      5
    )
    .option(
      '--master-port <number>',
      'master port - default: 3014',
      parseint,
      3014
    )
    .option(
      '--worker-port <number>',
      'worker port - default: 3015',
      parseint,
      3015
    )
    .parse(process.argv)
    ;

  const configOverride = {};
console.log(program)
  if (program.workers) {
    configOverride.NUMBER_OF_TOR_INSTANCES = program.workers;
  }
  if (program.restart) {
    configOverride.RESTART_PERIOD = program.restart * 60 * 1000;
  }
  if (program.timeout) {
    configOverride.KEEP_ALIVE_TIMEOUT = program.timeout * 1000;
  }
  if (program.startPort) {
    configOverride.START_TOR_PORT = program.startPrt;
  }
  if (program.restart) {
    configOverride.SPAWN_ATTEMPTS = program.restart;
  }
  if (program.masterPort) {
    configOverride.MASTER_PORT = program.masterPort;
  }
  if (program.workerPort) {
    configOverride.WORKER_PORT = program.workerPort;
  }

  require('./lib/enter/master')(configOverride);
} else {
  require('./lib/enter/worker');
}


