const https = require('https');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const games = require('./games.json');

const fetchGameJson = function fetchGameJsonViaHttps(gameID) {
  return new Promise((resolve, reject) => {
    const url = `https://www.reddit.com/api/info.json?id=t3_${gameID}`;
    const request = https.get(url, (response) => {
      // Handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error(`Failed to load page, status code: ${response.statusCode}`));
      }
      // Temporary data holder
      const body = [];
      // Push chunks to the body array
      response.on('data', chunk => body.push(chunk));
      // Join chunks and resolve promise
      response.on('end', () => resolve({
        json: JSON.parse(body.join('')),
        gameID,
      }));
    });
    // Handle connection errors
    request.on('error', err => reject(err));
  });
};

const parseResponse = function parseJSONResponse(response, gameID) {
  const text = response.data.children[0].data.selftext;
  const regex = /[\s\S]*?Clock.*\n.*\n([0-9]+:[0-9]+)\|([0-9])\|(.+) &amp; ([0-9]+)\|([0-9]+) \[(.+?)\].+?\|\[(.+?)\][\s\S]*?Team.*\n.*\n\[(.+?)\].*?\*\*([0-9]+)\*\*\n\[(.+?)\].*?\*\*([0-9]+)\*\*\n/gm;

  const match = regex.exec(text);
  if (!match) {
    console.error('No regex match.', text);
    return false;
  }

  const final = text.includes('Game complete');
    
  return {
    teams: [
      {
        name: match[8],
        score: match[9],
      },
      {
        name: match[10],
        score: match[11],
      },
    ],
    status: {
      time: match[1],
      quarter: match[2],
      down: match[3],
      toGo: match[4],
      yardline: match[5],
      whoseYardline: match[6],
      possession: match[7],
      final,
    },
    gameID,
  };
};

const parseGames = function parseGames(responses) {
  return responses.map(response => parseResponse(response.json, response.gameID));
};

const fetchAllGames = async function fetchAllGames() {
  const requests = [];

  games.forEach((gameID) => {
    const request = fetchGameJson(gameID);
    requests.push(request);
  });

  try {
    const responses = await Promise.all(requests);
    return parseGames(responses);
  } catch (error) {
    return error;
  }
};

const writeCache = function writeScoresToCacheFile(cachePath, scores) {
  return new Promise((resolve, reject) => {
    mkdirp(path.dirname(cachePath), (mkdirpErr) => {
      if (mkdirpErr) {
        reject(mkdirpErr);
      } else {
        fs.writeFile(
          cachePath,
          JSON.stringify(scores, null, 2),
          (writeErr) => {
            if (writeErr) {
              reject(writeErr);
            } else {
              console.log(`Wrote to ${cachePath}.`);
              resolve();
            }
          },
        );
      }
    });
  });
};

const fetchAndWriteGames = async function fetchGamesAndWriteToCache(cachePath) {
  const responses = await fetchAllGames();
  return writeCache(cachePath, responses)
    .then(() => ({
      message: `Got ${responses.length} responses and wrote to cache.`,
      data: responses,
    }))
    .catch(error => error);
};

const readCache = function readCachedScores(cachePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(cachePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const scores = JSON.parse(data);
        resolve({
          message: `Got ${scores.length} games from cache.`,
          data: scores,
        });
      }
    });
  });
};

const checkCache = function checkAgeOfCachedScores(cachePath) {
  return new Promise((resolve, reject) => {
    fs.stat(cachePath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve(fetchAndWriteGames(cachePath));
        } else {
          reject(err);
        }
      } else if (Date.now() - stats.mtimeMs > 60000) {
        const age = Math.round((Date.now() - stats.mtimeMs) / 1000, 0);
        console.log(`Updating scores - cached file is ${age}s old.`);
        resolve(fetchAndWriteGames(cachePath));
      } else {
        const age = Math.round((Date.now() - stats.mtimeMs) / 1000, 0);
        console.log(`Using cache - cached file is ${age}s old.`);
        resolve(readCache(cachePath));
      }
    });
  });
};

module.exports = () => checkCache(path.join(__dirname, 'cache/scores.json'));
