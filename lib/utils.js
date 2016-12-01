'use strict';

function logDate()
{
  return (new Date()).toLocaleString();
}
module.exports.logDate = logDate;