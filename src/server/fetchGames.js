const https = require('https');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const games = require('./games.json');
const elo = require('./elo.json');

const getAbbreviation = function getTeamAbbreviation(name) {
  const teamInfo = elo.teams.filter(team => team.name === name);
  if (teamInfo.length) {
    return teamInfo[0].abbr;
  }
  console.error(`No abbreviation found for ${name}`);
  return name;
};

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

const fixEntities = function fixHtmlEntities(string) {
  return string.replace('&amp;', '&').replace('&amp;', '&').replace('&amp;', '&');
};

const calcTime = function calculateTimeElapsedFromTimeAndQuarter(time, quarter, final) {
  if (final) {
    return (28 * 60);
  }
  let minSec = time.split(':');
  minSec = minSec.map(num => parseInt(num, 10));
  const quarterInt = Math.min(4, parseInt(quarter, 10));
  const quarterSec = (quarterInt - 1) * (7 * 60);
  return quarterSec + ((7 * 60) - ((minSec[0] * 60) + minSec[1]));
};

const parseResponse = function parseJSONResponse(response, gameID) {
  const text = response.data.children[0].data.selftext;
  const regex = /[\s\S]*?Clock.*\n.*\n([0-9]+:[0-9]+)\|([0-9])\|(.+) &amp; ([0-9]+)\|(-?[0-9]+) \[(.+?)\].+?\|\[(.+?)\][\s\S]*?Team.*\n.*\n\[(.+?)\].*?\*\*([0-9]+)\*\*\n\[(.+?)\].*?\*\*([0-9]+)\*\*\n/gm;

  let match = regex.exec(text);
  if (!match) {
    console.error(`No regex match for game ${gameID}`);
    return false;
  }

  match = match.slice(1, 12);

  const [time,
    quarter,
    down,
    toGo,
    yardline,
    whoseYardline,
    possession,
    homeName,
    homeScore,
    awayName,
    awayScore] = match;

  const final = text.includes('Game complete');

  const timeElapsed = calcTime(time, quarter, final);

  const parsedJson = {
    teams: [
      {
        name: fixEntities(homeName),
        score: homeScore,
      },
      {
        name: fixEntities(awayName),
        score: awayScore,
      },
    ],
    status: {
      time,
      quarter,
      down,
      toGo,
      yardline,
      whoseYardline: getAbbreviation(fixEntities(whoseYardline)),
      possession,
      final,
    },
    gameID,
    timeElapsed,
  };
    
  return parsedJson;
};

const parseGames = function parseGames(responses) {
  const parsedResponses = responses.map(response => parseResponse(response.json, response.gameID))
    .filter(response => response);

  // Sort based on time elapsed, final last, 4q first
  return parsedResponses.sort((a, b) => {
    if (a.timeElapsed === 1680) {
      return 1;
    }
    if (b.timeElapsed === 1680) {
      return -1;
    }
    return b.timeElapsed - a.timeElapsed;
  });
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
    .catch(error => console.error(error));
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
      } else if (Date.now() - stats.mtimeMs >= 60000) {
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
