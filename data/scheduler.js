'use strict';

const datafetcher = require('../data/datafetcher');
const utils = require('../data/utils');
const schedule = require('node-schedule');

module.exports = function (app) {

  // *    *    *    *    *    *
  // ┬    ┬    ┬    ┬    ┬    ┬
  // │    │    │    │    │    │
  // │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
  // │    │    │    │    └───── month (1 - 12)
  // │    │    │    └────────── day of month (1 - 31)
  // │    │    └─────────────── hour (0 - 23)
  // │    └──────────────────── minute (0 - 59)
  // └───────────────────────── second (0 -

  const jobDefinitions = require('../data/store/jobdefinitions');

  // start jobs

  async function jobLocalize(fireDate) {
    await datafetcher.getLocalize();
  }

  async function jobMeta(fireDate) {
    await datafetcher.getMeta();
  }

  async function jobTags(fireDate) {
    await datafetcher.getTags();
  }

  async function jobConvertCars(fireDate) {
    await datafetcher.convertCars();
  }

  async function jobConvertCategories(fireDate) {
    await datafetcher.convertCategories();
  }

  async function jobConvertCourses(fireDate) {
    await datafetcher.convertCourses();
  }

  async function jobProfiles(fireDate) {
    await datafetcher.getProfiles();
  }

  async function jobDailyRaceEvents(fireDate) {
    await datafetcher.getDailyRaceEvents();
  }

  async function jobAllCourseRecords(fireDate) {
    await datafetcher.getAllCourseRecords();
  }

  async function jobDailyRaceCourseRecords(fireDate) {
    await datafetcher.getDailyRaceCourseRecords();
  }

  async function jobTest(fireDate) {
    await utils.writeFile("./data/raw/test.json", JSON.stringify({ fireDate: fireDate.toLocaleString() }));
  }

  // end jobs

  function init() {
    app.locals.jobs = jobDefinitions;

    if (process.env.NODE_ENV !== "development") {
      scheduleJobs();
    } else {
      console.info("Not scheduling jobs for NODE_ENV=development");
    }
  }

  function scheduleJobs() {
    for (let name in jobDefinitions) {
      scheduleJob(jobDefinitions[name]);
    }
  }

  function scheduleJob(jobDefinition) {
    if (jobDefinition.hasOwnProperty("enabled") && !jobDefinition.enabled) {
      console.info("job not scheduled:", jobDefinition.name);
    } else {
      jobDefinition.count = 0;
      const job = doScheduleJob(toJobSpec(jobDefinition), decorateJobFunction.bind(this, jobDefinition.name, eval(jobDefinition.fn)));
      jobDefinition.job = job;

      console.info("job scheduled:", jobDefinition.name, job.nextInvocation().toDate().toLocaleString());
    }
  }

  function rescheduleJob(name) {
    const jobDefinition = jobDefinitions[name];
    if(jobDefinition.job === null) {
      scheduleJob(jobDefinition);
      return;
    }
    const success = jobDefinition.job.reschedule(toJobSpec(jobDefinition));
    if (!success) {
      console.error("Could not reschedule job:", name);
    } else {
      console.info("Job rescheduled:", jobDefinition.job.nextInvocation().toDate().toLocaleString());
    }
  }

  function cancelJob(name) {
    const canceled = jobDefinitions[name].job.cancel();
    if (!canceled) {
      console.error("Could not cancel job:", name);
    } else {
      console.info("Job cancelled:", name);
    }
  }

  async function runNow(name) {
    try {
      await eval(jobDefinitions[name].fn)(new Date());
    } catch (err) {
      console.error(name, err.message);
    }
  }

  async function decorateJobFunction(name, fn) {
    const jobDefinition = jobDefinitions[name];
    if (!jobDefinition.running) {
      jobDefinition.running = true;
      jobDefinition.count++;

      const start = new Date().getTime();
      try {
        await fn(arguments[2]);
      } catch (err) {
        console.error("Error running job '%s': code: %s, %s%s", name, err.code, err.message, utils.EOL, err.stack);
        jobDefinition.lastError = err.message;
      }
      const end = new Date();

      jobDefinition.lastEnded = end;
      jobDefinition.lastDuration = (end.getTime() - start);
      if (!jobDefinition.maxDuration || jobDefinition.lastDuration > jobDefinition.maxDuration) {
        jobDefinition.maxDuration = jobDefinition.lastDuration;
      }
      jobDefinition.running = false;
    } else {
      console.warn("Skipping already running job '%s'", name);
    }
  }

  function toJobSpec(jobDefinition) {
    const startTime = new Date();
    const endTime = new Date().setFullYear(startTime.getFullYear() + 1);

    return {
      startTime: startTime,
      endTime: endTime,
      rule: jobDefinition.rule
    }
  }

  function doScheduleJob(jobSpec, fn) {
    return schedule.scheduleJob(jobSpec, fn);
  }

  return {
    init: init,
    rescheduleJob: rescheduleJob,
    cancelJob: cancelJob,
    runNow: runNow,
  }
};