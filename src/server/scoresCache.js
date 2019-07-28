/**
 * Interfaces with the cached scores file.
 */

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

/**
 * Reads the cached scores from the file.
 *
 * @param {string} cachePath - The path to the cached scores file.
 * @returns {Promise<{data: Array<Object>, message: string}, Error>}
 *  - A promise resolving to an object containing scores & age.
 */
const readCache = function readCachedScores(cachePath) {
  return new Promise((resolve, reject) => {
    // Read the file
    fs.readFile(cachePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const scores = JSON.parse(data);
        resolve({
          data: scores,
          message: `Got ${scores.length} games from cache.`,
        });
      }
    });
  });
};

/**
 * Writes the fetched scores to the cache file.
 *
 * @param {string} cachePath - The path to the cached scores file.
 * @param {Array<Object<string, any>>} scores
 *  - An array of JSON objects containing the fetched scores.
 * @returns {Promise<{data: Array<Object>, message: string}, Error>}
 *  - A promise resolving to an object containing useCache & age.
 */
const writeCache = function writeScoresToCacheFile(cachePath, scores) {
  return new Promise((resolve, reject) => {
    // Check if the cache directory exists - if not, create it
    mkdirp(path.dirname(cachePath), (mkdirpErr) => {
      if (mkdirpErr) {
        // If it couldn't create a missing directory
        reject(mkdirpErr);
      } else {
        // Write to the cache file
        fs.writeFile(
          cachePath,
          JSON.stringify(scores, null, 2),
          (writeErr) => {
            if (writeErr) {
              // If it couldn't write the file
              reject(writeErr);
            } else {
              // If it successfully wrote the file
              resolve({
                data: scores,
                message: `Wrote ${scores.length} scores to ${cachePath}.`,
              });
            }
          },
        );
      }
    });
  });
};


/**
 * Calculates the age of a file as a round number of seconds.
 *
 * @param {number} mtimeMs - The age of the file in milliseconds.
 * @returns {number} The age of the file in rounded seconds.
 */
const parseAge = function parseAgeOfFile(mtimeMs) {
  return Math.round((Date.now() - mtimeMs) / 1000, 0);
};

/**
 * Checks whether the cached scores file is older than the cutoff time.
 *
 * @param {string} cachePath - The path to the cached scores file.
 * @param {number} expiryTime - The age (in seconds) at which a cached score file expires.
 * @returns {Promise<{useCache: boolean, reason: string}, Error>}
 *  - A promise resolving to an object containing useCache & age.
 */
const checkCache = function checkAgeOfCachedScores(cachePath, expiryTime) {
  return new Promise((resolve, reject) => {
    // Check info about the file
    fs.stat(cachePath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // Cache does not exist, so don't use it
          resolve({
            useCache: false,
            reason: 'Cached file does not exist.',
          });
        } else {
          // Errors that we don't know what to do with
          reject(err);
        }
      } else {
        const age = parseAge(stats.mtimeMs);
        if (age >= expiryTime) {
          // Cache is older than the expiry time, so don't use it
          resolve({
            useCache: false,
            reason: `Cached file is ${age}s old.`,
          });
        } else {
          // Cache is younger than the expiry time, so use it
          resolve({
            useCache: true,
            reason: `Cached file is ${age}s old.`,
          });
        }
      }
    });
  });
};

module.exports = {
  checkCache,
  readCache,
  writeCache,
};
