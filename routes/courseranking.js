const express = require('express');
const router = express.Router();
const utils = require('../data/utils');
const { FILE_COURSERANKING } = require('../data/constants');

let data;
utils.readAndWatchJsonFile(FILE_COURSERANKING, (obj, err) => {
  if (!err) {
    data = obj;
  }
});

router.get('/', function(req, res, next) {
  res.send(data);
});

module.exports = router;
