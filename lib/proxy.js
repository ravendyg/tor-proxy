/// <reference path="../lib/index.d.ts" />
/* global root */

'use strict';
const request = require('request');
const agent = require('socks5-http-client/lib/Agent');

const config = require('./config');

const spawn = require('child_process').spawn;


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

    if ( index <= 0 || index > config.TOR_PORTS.length - 1 )
    {
      resolve({ error: 'index out of bound', connection: null });
      resolved = true;
    }

    var spawnTor = spawn('tor', ['-f', './tor/torrc.' + index], {cwd:root});
    // var spawnTor = spawn('pwd', [], {cwd:root});

    spawnTor.stdout.on(
      'data',
      data =>
      {
        console.log(
          data.toString('utf8')
        );
        if ( data.toString('utf8').match(/Bootstrapped 100%: Done/) && !resolved )
        {
          resolve({ error: null, connection: spawnTor });
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


function startService ()
{
  var torInstance = startTorInstance( 1 );
  torInstance
  .then(
    ({ err, connection }) =>
    {
      if ( err )
      {
        console.error( err );
      }
      else
      {
        console.log( connection );
      }
    }
  );
}
module.exports.startService = startService;


// url,
// 			{
// 				method: 'GET',
// 				encoding: null,
// 				followAllRedirects: true,
// 				agentClass: agent,
// 				agentOptions:
// 				{
// 					socksHost: '127.0.0.1',
// 					socksPort: 9050
// 				}
// 			},