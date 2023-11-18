'use strict';

const axios = require('axios');
const utils = require('./utils');
const C = require('./constants');
const packageJson = require('../package');

const users = utils.readJsonFileSync(C.FILE_USERS);

axios.defaults.timeout = 30000;
axios.defaults.transformResponse = [data => data]; // keep response as string to prevent string -> object -> string conversion

function getMeta() {
  console.info('Fetching meta');
  return fetchContent(C.FILE_META, new URL(C.URL_META));
}

function getLocalize() {
  console.info('Fetching localize');
  return fetchContent(C.FILE_LOCALIZE, new URL(C.URL_LOCALIZE));
}

function getTags() {
  console.info('Fetching tags');
  return fetchContent(C.FILE_TAGS, new URL(C.URL_TAGS));
}

function fetchContent(outputFile, url) {
  return axios.get(url.href).then(response => utils.writeFile(outputFile, response.data));
}

function getProfiles() {
  console.info("Getting profiles");
  return fetchProfiles().then(() => convertProfiles()).then(() => console.info("Getting profiles DONE"));
}

async function fetchProfiles() {
  const userNumbers = Object.keys(users);
  const requests = [];
  for (let i = 0; i < userNumbers.length; i++) {
    requests.push(fetchProfile(userNumbers[i]).catch(err => console.error("profile:", err.message)));
    await utils.sleep(C.SLEEP_MS);
  }

  return Promise.all(requests);
}

function fetchProfile(userNumber) {
  return axios.post(C.URL_PROFILE, {}, {
      params: {
        job: "1",
        user_no: userNumber
      }
    }).then(response => utils.writeFile(C.FILEPREFIX_PROFILE + '/' + userNumber + '.json', response.data));
}

function convertProfiles() {
  console.info("Converting profiles");
  const profiles = {};

  for (let userNumber in users) {
    const user = users[userNumber];
    const profile = utils.readJsonFileSync(C.FILEPREFIX_PROFILE + '/' + userNumber + '.json');
    profiles[userNumber] = {
      profile: profile.profile,
      user: {
        nick: user.nick,
        controller: user.controller
      }
    };
  }

  return utils.writeFile(C.FILE_PROFILES, JSON.stringify(profiles)).then(() => console.info("Converting profiles DONE", Object.keys(profiles).length));
}

function getAllCourseRecords() {
  console.info("Fetching all course records");
  const categories = getAllCategories();
  return fetchCourseRecords(categories).then(() => createCourseRanking(categories)).then(() => console.info("Fetching all course records DONE"));
}

function getDailyRaceCourseRecords() {
  console.info("Fetching daily course records");
  const categories = getDailyRaceCategories();
  const dailyRaceInfo = getDailyRaceInfo();
  return fetchCourseRecords(categories)
    .then(() => createCourseRanking(categories, dailyRaceInfo)).then(() => console.info("Fetching daily course records DONE"));;
}

function getAllCategories() {
  const categories = [];
  for (let i = 0; i <= C.CAR_CATEGORY_MAX; i++) {
    categories.push(i);
  }
  return categories;
}

function getDailyRaceCategories() {
  const dailyRaceEvents = utils.readJsonFileSync(C.FILE_DAILYRACES);
  const categories = [];
  for (let eventId in dailyRaceEvents) {
    const event = dailyRaceEvents[eventId];
    const categoryId = event.category_id;
    if (!categories.includes(categoryId)) {
      categories.push(categoryId);
    }
  }

  return categories;
}

function getDailyRaceInfo() {
  const dailyRaceEvents = utils.readJsonFileSync(C.FILE_DAILYRACES);
  const info = [];
  for (let eventId in dailyRaceEvents) {
    const event = dailyRaceEvents[eventId];
    info.push({
      course_id: event.course_id,
      category_id: event.category_id
    });
  }

  return info;
}

function filterContains(courseId, categoryId, filter) {
  for (let i = 0; i < filter.length; i++) {
    if (filter[i].category_id == categoryId && filter[i].course_id == courseId) {
      return true;
    }
  }
  return false;
}

async function fetchCourseRecords(categories) {
  const userNumbers = Object.keys(users);
  const requests = [];
  for (let i = 0; i < userNumbers.length; i++) {
    for (let j = 0; j < categories.length; j++) {
      requests.push(fetchCourseRecord(userNumbers[i], categories[j]).catch(err => console.error("courserecord:", err.message)));
      await utils.sleep(C.SLEEP_MS);
    }
  }

  return Promise.all(requests);
}

function fetchCourseRecord(userNumber, categoryId) {
  return axios.post(C.URL_COURSE_RECORD, {}, {
      params: {
        category_id: categoryId,
        course_id: "-1", // ignored
        is_category: "1",
        job: "1",
        user_no: userNumber
      }
    }).then(response => utils.writeFile(C.FILEPREFIX_COURSERECORD + '/' + userNumber + '-' + categoryId + '.json', response.data));
}

function getDailyRaceEvents() {
  console.info("Getting daily race events");
  return fetchDailyRaceEventCalendar().then(() => fetchDailyRaceEvents()).then(() => console.info("Getting daily race events DONE"));
}

function fetchDailyRaceEventCalendar() {
  return axios.post(C.URL_EVENT, {}, {
      params: {
        channel_id_csv: "1,2,3",
        job: 3
      }
    }).then(response => utils.writeFile(C.FILE_DAILYRACE_EVENTCALENDAR, response.data));
}

function fetchDailyRaceEvents() {
  const dailyRaceEventCalendar = utils.readJsonFileSync(C.FILE_DAILYRACE_EVENTCALENDAR);
  const eventCalendar = dailyRaceEventCalendar.event_calendar;

  const requests = [];
  const dailyRaceEvents = {};
  for (let i = 0; i < eventCalendar.length; i++) {
    const eventCalendarEntry = eventCalendar[i];
    const eventId = eventCalendarEntry.event_id;
    requests.push(fetchDailyRaceEvent(eventId)
      .then(dailyRaceEvent => {
        dailyRaceEvents[eventId] = dailyRaceEvent;
      })
      .catch(err => console.error("event:", err.message)));
  }

  return Promise.all(requests).then(() => utils.writeFile(C.FILE_DAILYRACES, JSON.stringify(dailyRaceEvents)));
}

function fetchDailyRaceEvent(eventId) {
  return axios.post(C.URL_EVENT, {}, {
    params: {
      event_id_csv: eventId,
      job: 1
    }
  }).then(response => {
    const events = JSON.parse(response.data);

    if (events.event.length > 0) {
      if (events.event.length > 1) {
        console.warn("events.event length? ", eventId, events.event.length);
      }
      const event = events.event[0];
      return convertDailyRaceEvent(event);
    } else {
      throw new Error("No events for event " + eventId);
    }
  });
}

function convertDailyRaceEvent(event) {
  if (event.value.length > 0) {
    if (event.value.length > 2) {
      console.warn("event.value length? ", event.event_id, event.value.length);
    }

    if (event.value[0].GameParameter.events.length === 0) {
      throw new Error("No GameParameter events for event " + event.event_id);
    }
    if (event.value[0].GameParameter.events.length > 1) {
      console.warn("GameParameter events length? ", event.event_id, event.value[0].GameParameter.events.length);
    }
    const gameParameterEvent = event.value[0].GameParameter.events[0];

    if (event.value[0].GameParameter.tracks.length === 0) {
      throw new Error("No GameParameter tracks for event " + event.event_id);
    }
    if (event.value[0].GameParameter.tracks.length > 1) {
      console.warn("GameParameter tracks length? ", event.event_id, event.value[0].GameParameter.tracks.length);
    }
    const gameParameterTrack = event.value[0].GameParameter.tracks[0];

    if (gameParameterEvent.regulation.car_category_types.length === 0) {
      throw new Error("No car_category_types for event " + event.event_id);
    }
    if (gameParameterEvent.regulation.car_category_types.length > 1) {
      console.warn("car_category_types length? ", event.event_id, gameParameterEvent.regulation.car_category_types.length);
    }

    const result = {};
    result.event_id = event.event_id;
    result.game_mode = gameParameterEvent.game_mode;
    result.event_type = gameParameterEvent.event_type;
    result.sports_mode = gameParameterEvent.sports_mode;
    result.board_id = gameParameterEvent.ranking.board_id;
    result.category_id = getCategoryIdByCode(gameParameterEvent.regulation.car_category_types[0]);
    result.course_id = getCourseIdByCode(gameParameterTrack.course_code);
    return result;
  } else {
    throw new Error("No values for event " + event.event_id);
  }
  return null;
}

function createCourseRanking(categories, filterData) {
  console.info('Creating course record ranking');

  const minDate = new Date(2019, 0, 1, 0, 0, 0, 0);
  const updateTime = new Date();
  const courseRanking = {};
  const courseUpdateTime = {};

  const userNumbers = Object.keys(users);

  for (let i = 0; i < userNumbers.length; i++) {
    for (let c = 0; c < categories.length; c++) {
      const categoryId = categories[c];
      let courseRecords = null;
      try {
        courseRecords = utils.readJsonFileSync(C.FILEPREFIX_COURSERECORD + '/' + userNumbers[i] + '-' + categoryId + '.json').course_record;
      } catch (e) {
        console.warn("course_record", e.message);
      }

      if (courseRecords) {
        for (let j = 0; j < courseRecords.length; j++) {
          const courseRecord = courseRecords[j];
          const updateTime = new Date(courseRecord.update_time);

          if (updateTime >= minDate) {
            const courseId = courseRecord.course_id;
            if (!filterData || filterData && filterContains(courseId, categoryId, filterData)) {
              if (!courseRanking.hasOwnProperty(courseId)) {
                courseRanking[courseId] = {};
              }

              if (!courseRanking[courseId].hasOwnProperty((categoryId))) {
                courseRanking[courseId][categoryId] = [];
              }

              courseRanking[courseId][categoryId].push(courseRecord);

              const time = updateTime.getTime();
              if (!courseUpdateTime.hasOwnProperty(courseId)) {
                courseUpdateTime[courseId] = time;
              } else {
                courseUpdateTime[courseId] = Math.max(time, courseUpdateTime[courseId]);
              }
            }
          }
        }
      }
    }
  }

  const sortedCourseIds = sortCourseIdsByDate(courseUpdateTime);
  sortCourseRankingByResult(courseRanking);

  const courseRankingInfo = {
    updateTime: updateTime,
    courseIds: sortedCourseIds,
    courseRanking: courseRanking
  };
  return utils.writeFile(C.FILE_COURSERANKING, JSON.stringify(courseRankingInfo))
    .then(() => console.info('Creating course record ranking DONE'));
}

function sortCourseIdsByDate(courseUpdateTime) {
  const courseIds = Object.keys(courseUpdateTime);

  courseIds.sort((a, b) => {
    const dateA = utils.minTime(new Date(courseUpdateTime[a]));
    const dateB = utils.minTime(new Date(courseUpdateTime[b]));

    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;
    return 0;
  });

  return courseIds;
}

function sortCourseRankingByResult(courseRanking) {
  for (let courseId in courseRanking) {
    for (let categoryId in courseRanking[courseId]) {
      courseRanking[courseId][categoryId].sort((a, b) => (Number(a.result) > Number(b.result)) ? 1 : -1);
    }
  }
}

function convertCars() {
  console.info("Converting cars");

  const meta = utils.readJsonFileSync(C.FILE_META);
  const tags = utils.readJsonFileSync(C.FILE_TAGS);

  const cars = {};
  for (let carNumber in meta.car) {
    const carMeta = meta.car[carNumber];
    cars[carMeta.code] = tags.car_name_en[carMeta.tag];
  }

  return utils.writeFile(C.FILE_CARS, JSON.stringify(cars)).then(() => console.info("Converting cars DONE"));
}

function convertCourses() {
  console.info("Converting courses");

  const meta = utils.readJsonFileSync(C.FILE_META);
  const localize = utils.readJsonFileSync(C.FILE_LOCALIZE);

  const courses = {};
  for (let courseCounter in meta.course) {
    const courseMeta = meta.course[courseCounter];
    const courseIndex = courseMeta.index;

    if (typeof courseIndex !== 'undefined') {
      courses[courseIndex] = localize["gt7sp.game.COMMON.CourseName." + courseMeta.code];
    } else {
      console.warn('Course index is undefined for counter/code:', courseCounter, courseMeta.code);
    }
  }

  return utils.writeFile(C.FILE_COURSES, JSON.stringify(courses)).then(() => console.info("Converting courses DONE"));
}

function convertCategories() {
  console.info("Converting categories");

  const meta = utils.readJsonFileSync(C.FILE_META);
  const localize = utils.readJsonFileSync(C.FILE_LOCALIZE);

  const categories = {};
  for (let categoryNumber in meta.car_category) {
    const categoryMeta = meta.car_category[categoryNumber];
    categories[categoryNumber] = localize["gt7sp.game.COMMON.CarClassName.Label_" + categoryMeta.code];
  }

  return utils.writeFile(C.FILE_CATEGORIES, JSON.stringify(categories)).then(() => console.info("Converting categories DONE"));;
}

function getCourseIdByCode(courseCode) {
  const meta = utils.readJsonFileSync(C.FILE_META);

  for (let courseCounter in meta.course) {
    const courseMeta = meta.course[courseCounter];
    if (courseMeta.code === courseCode) {
      return String(courseMeta.index);
    }
  }

  return null;
}

function getCategoryIdByCode(categoryCode) {
  const meta = utils.readJsonFileSync(C.FILE_META);

  for (let categoryNumber in meta.car_category) {
    const categoryMeta = meta.car_category[categoryNumber];
    if (categoryMeta.code === categoryCode) {
      return categoryNumber;
    }
  }
  return null;
}

module.exports = {
  getMeta: getMeta,
  getLocalize: getLocalize,
  getTags: getTags,
  getProfiles: getProfiles,
  getAllCourseRecords: getAllCourseRecords,
  getDailyRaceCourseRecords: getDailyRaceCourseRecords,
  getDailyRaceEvents: getDailyRaceEvents,
  convertCars: convertCars,
  convertCategories: convertCategories,
  convertCourses: convertCourses,
};
