const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/import', (req, res, next) => {
  res.render('import', { title: 'Import Tool' });
});

module.exports = router;
