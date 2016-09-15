/// <reference path="../lib/index.d.ts" />
'use strict';

function create ( status, message )
{
  var err = new Error( message );
  err.status = status;

  return err;
}
module.exports.create = create;