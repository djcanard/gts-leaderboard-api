'use strict';

const fs = require('fs');
const fsp = fs.promises;
const _EOL = require('os').EOL;

module.exports = {

  EOL: _EOL,

  /**
   * Write content to file.
   *
   * @param filename
   * @param content
   * @returns {Promise<void>}
   */
  writeFile: function (filename, content) {
    return fsp.writeFile(filename, content.trim());
  },

  /**
   * Make a copy of a file with timestamp
   *
   * @param filename
   * @returns {Promise<void>}
   */
  backupFile: function (filename) {
    if (!fs.existsSync(filename)) {
      throw new Error("File not found");
    }
    return fsp.copyFile(filename,filename + ".bak");
  },

  /**
   * Read file synchronously and parse as JSON content
   *
   * @param filename
   * @returns object
   */
  readJsonFileSync: function (filename) {
    if (!fs.existsSync(filename)) {
      throw new Error("File not found");
    }
    return JSON.parse(fs.readFileSync(filename, "utf8"));
  },

  /**
   * Read file async. Resolves to object
   * @param filename
   * @returns {Promise<unknown>}
   */
  readJsonFile: function (filename) {
    return fsp.readFile(filename, { encoding: "utf8" }).then(data => JSON.parse(data));
  },

  /**
   * Executes callback with object on each file change.
   * Callback will be executed immediately on calling this function
   * to get the initial file contents.
   * Callback signature: (object [, error])
   *
   * https://thisdavej.com/how-to-watch-for-files-changes-in-node-js/
   *
   * @param filename
   * @param callback
   */
  readAndWatchJsonFile: function(filename, callback) {
    const readFile = () => {
      return this.readJsonFile(filename)
        .then(obj => callback(obj))
        .catch(err => {
          console.error("watch error:", filename, err.message);
          callback(null, err)
        });
    };

    let fsWait = false;
    fs.watch(filename, (event, file) => {
      if (file) {
        if (fsWait) {
          return;
        }
        fsWait = setTimeout(() => {
          readFile().finally(() => { fsWait = false });
        }, 100);
      }
    });

    readFile();
  },

  /**
   * Should be used with await to function properly
   */
  sleep: function (millis) {
    return new Promise(function (resolve, reject) {
      setTimeout(() => resolve(), millis);
    });
  },

  /**
   * Reset time to 00:00:00.0
   */
  minTime: function(date) {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }
};
