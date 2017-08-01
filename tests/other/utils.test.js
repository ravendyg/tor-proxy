'use strict';

const sinon = require('sinon');
const {assert} = require('chai');
const path = require('path');

const config = require('../../lib/config');
const createUtils = require('../../lib/utils');

const deps = {
  config, path,
  fs: {
    existsSync: sinon.stub(),
    writeFileSync: sinon.stub(),
    mkdirSync: sinon.stub()
  }
};
const utils = createUtils(deps);

describe('utils', () => {

  it('returns an object with correct methods', () => {
    assert.isObject(utils);
    assert.isFunction(utils.logDate);
    assert.isFunction(utils.mapCounterToPort);
    assert.isFunction(utils.ensureInstanceInfoFile);
    assert.isFunction(utils.ensureDataDir);
  });

  describe('ensureInstanceInfoFile', () => {

    const counter = 2;
    const filePath = path.join(config.TOR_DIR, 'torrc.3');
    const torrc =
        'SocksPort ' + utils.mapCounterToPort(counter) + '\n' +
        'ControlPort ' + (utils.mapCounterToPort(counter) + 1) + '\n' +
        'DataDirectory tor/data-dir/tor' + counter;

    it('checks file existence', () => {
      deps.fs.existsSync.reset();
      deps.fs.existsSync.returns(true);

      utils.ensureInstanceInfoFile(counter);
      sinon.assert.calledWith(deps.fs.existsSync, filePath);
    });

    it('creates file if does not exist', () => {
      deps.fs.existsSync.reset();
      deps.fs.existsSync.returns(false);
      deps.fs.writeFileSync.resetHistory();

      utils.ensureInstanceInfoFile(counter);
      sinon.assert.calledWith(deps.fs.writeFileSync, filePath, torrc, sinon.match({encoding: 'utf8'}));
    });

    it('returns path to file', () => {
      const file = utils.ensureInstanceInfoFile(counter);
      assert.equal(file, filePath);
    });

  });

});
