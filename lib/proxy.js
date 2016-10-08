/// <reference path="../lib/index.d.ts" />

'use strict';
const request = require('request');
const agent = require('socks5-http-client/lib/Agent');

const config = require('./config');

const spawn = require('child_process').spawn;

var instances = [];


/**
 * start new tor instance
 * 5 available
 *
 * @index: number
 */
function startTorInstance ( index )
{
  function main ( resolve )
  {
    var resolved = false;

    if ( index <= 0 || index > config.TOR_PORTS.length )
    {
      resolve({ error: 'index out of bound', connection: null });
      resolved = true;
    }

    var spawnTor = spawn('tor', ['-f', './tor/torrc.' + index], {cwd: global});

    spawnTor.stdout.on(
      'data',
      data =>
      {
        // console.log(
        //   index + ': ' + data.toString('utf8')
        // );
        if ( data.toString('utf8').match(/Bootstrapped 100%: Done/) && !resolved )
        {
          console.log( index + ': ' + data.toString('utf8') );
          resolve({ error: null, connection: spawnTor, id: index });
        }
      }
    );

    spawnTor.stdout.on(
      'error',
      error =>
      {
        if ( !resolved )
        {
          resolve({ error, connection: null });
        }
        spawnTor.kill('SIGNINT');
      }
    );
  }

  return new Promise ( main );
}

function addTorInstance({ err, connection, id })
{
  if ( err )
  {
    console.error( err );
  }
  else
  {
    instances.push({
      id,
      connection,
      port: config.TOR_PORTS[id-1]
    });
  }
}

/**
 * start entire proxy service
 */
function startService ()
{
  for ( let i = 0; i < config.TOR_PORTS.length; i++ )
  {
    startTorInstance( i+1 )
    .then( addTorInstance );
  }

  setInterval(
    () =>
    { // restart one proxy
      let proxy = instances[0];
      instances = instances.slice(1);
      proxy.connection.kill('SIGINT');
      startTorInstance( proxy.id )
      .then( addTorInstance );
    },
    config.RESTART_PERIOD
  );
}
module.exports.startService = startService;

/**
 * provide a proxy to the requested url
 */
function makeRequest( url )
{
  let i = Math.floor( Math.random() * instances.length );

  let proxy = instances[i];
  return request(
    {
      url,
      method: 'GET',
      encoding: null,
      followAllRedirects: true,
      agentClass: agent,
      agentOptions:
      {
        socksHost: '127.0.0.1',
        socksPort: proxy.port
      }
    }
  );
}
module.exports.makeRequest = makeRequest;
