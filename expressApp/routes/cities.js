var express = require('express');
var router = express.Router();

var getDb = require('../db');
/* GET cities listing. */
router.get('/', async function(req, res, next) {
  try {
    const db = await getDb();
    const cities = await db.any('SELECT * FROM cities');
    res.json(cities);
  } catch(e) {
    res.send('error in getting data', 500);
  }
});

router.post('/', async function(req, res, next) {
  try {
    if (req.body?.city) {
      const db = await getDb();
      const city = await db.one('INSERT INTO cities(name) VALUES($1) RETURNING name', [req.body.city]);
      res.json(city);
    }
  } catch(e) {
    res.status(500).send('error in creating data');
  }
});

router.delete('/', async function(req, res, next) {
  try {    
    // Delete all
    const db = await getDb();
    const deletedCities = await db.any('DELETE FROM cities RETURNING name', [req.body.city]);
    res.json(deletedCities);
  } catch(e) {
    res.status(500).send('error in deleting data');
  }
});

module.exports = router;
