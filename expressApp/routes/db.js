var express = require('express');
var router = express.Router();

var getDb = require('../db');
/* GET users listing. */
router.get('/', async function(req, res, next) {
  try {
    const db = await getDb();
    const connObject = await db.connect();
    connObject.done();
    res.send('db connected succesfully');
  } catch(e) {
    res.send('db connection not set up yet', 500);
  }
});

module.exports = router;
