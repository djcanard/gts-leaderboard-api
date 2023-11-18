'use strict';

const express = require('express');

module.exports = function(app, scheduler) {
  const router = express.Router();

  router.use('/reschedule/:name', function (req, res, next) {
    const name = req.params.name;
    scheduler.rescheduleJob(name);
    next();
  });

  router.use('/cancel/:name', function (req, res, next) {
    const name = req.params.name;
    scheduler.cancelJob(name);
    next();
  });

  router.use('/now/:name', function (req, res, next) {
    const name = req.params.name;
    scheduler.runNow(name);
    next();
  });

  router.get('/*', function (req, res, next) {
    res.render('scheduler', {title: 'Scheduler', jobs: app.locals.jobs, baseUrl: req.baseUrl });
  });

  return router;
};
