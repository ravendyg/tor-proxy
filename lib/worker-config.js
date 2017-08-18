const config = require('./config'); // a fallback
let masterConfig = {};

try {
  masterConfig = JSON.parse(process.env.config);
} catch (err) {/**/}

module.exports = Object.assign({}, config, masterConfig);
