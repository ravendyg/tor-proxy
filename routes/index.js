var express = require('express');
var router = express.Router();

const errSrev = require('../lib/error');

/* GET home page. */
router.route('/').get(
  function(req, res, next)
  {
    next(
      errSrev.create( 500, 'not implemented')
    );
  }
);


module.exports = router;
