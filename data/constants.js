'use strict';

module.exports = {
  URL_LOCALIZE: "https://www.gran-turismo.com/nl/gtsport/module/community/localize/",
  URL_META: "https://www.gran-turismo.com/nl/gtsport/module/community/meta/",
  URL_TAGS: "https://www.gran-turismo.com/nl/gtsport/module/community/tags/",
  URL_PROFILE: "https://www.gran-turismo.com/nl/api/gt7sp/profile/",
  URL_COURSE_RECORD: "https://www.gran-turismo.com/nl/api/gt7sp/course_record/",
  URL_EVENT: "https://www.gran-turismo.com/nl/api/gt7sp/event/",

  FILE_CARS: "./data/store/cars.json",
  FILE_CATEGORIES: "./data/store/categories.json",
  FILE_COURSERANKING: "./data/store/courseranking.json",
  FILE_COURSES: "./data/store/courses.json",
  FILE_PROFILES: "./data/store/profiles.json",
  FILE_USERS: "./data/store/users.json",
  FILE_DAILYRACES: "./data/store/dailyraces.json",

  FILE_LOCALIZE: "./data/raw/localize.json",
  FILE_META: "./data/raw/meta.json",
  FILE_TAGS: "./data/raw/tags.json",
  FILE_DAILYRACE_EVENTCALENDAR: "./data/raw/event/dailyrace_eventcalendar.json",

  FILEPREFIX_COURSERECORD: "./data/raw/course_record",
  FILEPREFIX_PROFILE: "./data/raw/profile",

  CAR_CATEGORY_MAX: 16,
  SLEEP_MS: 100 // prevent hammering servers
};
