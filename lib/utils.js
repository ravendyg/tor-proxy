'use strict';

module.exports = function createUtils({
  config, path, fs
}) {

  function logDate() {
    return (new Date()).toLocaleString();
  }

  function mapCounterToPort(counter) {
    return config.START_TOR_PORT + counter * 2;
  }

  function ensureInstanceInfoFile(_counter) {
    const counter = +_counter;
    const rcFilePath = path.join(config.TOR_DIR, 'torrc.' + (counter + 1));
    if (!fs.existsSync(rcFilePath)) {
      const port = mapCounterToPort(counter);
      const torrc =
        'SocksPort ' + port + '\n' +
        'ControlPort ' + (port + 1) + '\n' +
        'DataDirectory tor/data-dir/tor' + counter;

      fs.writeFileSync(rcFilePath, torrc, {encoding: 'utf8'});
    }
    return rcFilePath;
  }

  function ensureDataDir(counter) {
    const dataDir = path.join(config.TOR_DIR, 'data-dir');
    const torDataDir = path.join(dataDir, 'tor' + parseInt(counter));

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    if (!fs.existsSync(torDataDir)) {
      fs.mkdirSync(torDataDir);
    }
  }

  /**
   * @param {Server.Response} res
   * @param {string} code
   * @return {void}
   */
  function respond(res, code) {
    res.statusCode = code;
    res.end();
  }

  return {
    logDate,
    mapCounterToPort,
    ensureInstanceInfoFile,
    ensureDataDir,
    respond
  };
};
