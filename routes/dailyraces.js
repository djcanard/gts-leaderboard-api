const express = require('express');
const router = express.Router();
const utils = require('../data/utils');
const { FILE_DAILYRACES } = require('../data/constants');

let data;
utils.readAndWatchJsonFile(FILE_DAILYRACES, (obj, err) => {
  if (!err) {
    data = obj;
  }
});

router.get('/', function(req, res, next) {
  res.send(data);
});

module.exports = router;
