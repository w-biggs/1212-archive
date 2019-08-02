const path = require('path');
const gameIDs = require('./gameIDs.json');
const gamesJSON = require('../static/js/games.json');
const eloJSON = require('../static/js/elo.json');
const { checkCacheAge, readCache, writeCache } = require('./scoresCache');
const { fetchGames } = require('./fetchGames');
const { parseGames } = require('./parseGames');

/**
 * Fetch games and write them to the cached file.
 *
 * @param {{
 *   seasons: Array<{
 *     seasonNo: number, weeks: Array<{
 *       weekNo: number, games: Array<string>
 *     }>
 *   }>
 * }} games - The list of gameIDs.
 * @param {string} cachePath - The path to the cached scores file.
 * @returns {Promise<{Object[], Error>}, Error>}
 *  - A promise resolving to an object containing scores & message.
 */
const fetchScoresAndWrite = async function fetchScoresAndWriteToCache(IDs, cachePath) {
  try {
    const rawGames = await fetchGames(IDs);
    const scores = parseGames(rawGames);
    return writeCache(cachePath, scores)
      .then(response => response)
      .catch(error => error);
  } catch (err) {
    return err;
  }
};

/**
 * Sorts the parsed scores by descending time elapsed in the game, but with final games last.
 *
 * @param {Object<string, any>} a - A parsed score.
 * @param {Object<string, any>} b - A parsed score.
 * @returns {number} - A number that .sort() uses to decide what order to put scores in.
 */
const sortScores = function sortScoresByTimeElapsed(a, b) {
  const [scoreA, scoreB] = [a, b].map(score => ({
    timeElapsed: score.status ? score.status.timeElapsed : 1680,
    lastUpdate: score.endTime_utc,
  }));
  if (scoreA.timeElapsed === scoreB.timeElapsed) {
    return scoreA.endTime_utc - scoreB.endTime_utc;
  }
  if (scoreA.timeElapsed === 1680) {
    return 1;
  }
  if (scoreB.timeElapsed === 1680) {
    return -1;
  }
  return scoreB.timeElapsed - scoreA.timeElapsed;
};

/**
 * Gets the games from game.json for the given season and week.
 *
 * @param {number} season - The season number.
 * @param {week} week - The week number.
 * @returns {Object<string,string|number|Object>[]|false} - The found games, or false if none
 * were found.
 */
const getWeekGames = function getGamesByWeekAndSeason(season, week) {
  const [seasonGames] = gamesJSON.seasons.filter(gameSeason => gameSeason.seasonNo === season);
  if (typeof seasonGames !== 'undefined') {
    const [weekGames] = seasonGames.weeks.filter(gameWeek => gameWeek.weekNo === week);
    if (typeof weekGames !== 'undefined') {
      return weekGames.games;
    }
  }
  return false;
};

/**
 * Checks whether an array of IDs includes games in games.json; return those if so, and return a
 * list of IDs whose games are <i>not</i> in games.json.
 *
 * @param {number} season - The season number.
 * @param {week} week - The week number.
 * @param {string[]} IDs - The array of IDs to check.
 * @returns {{games: Object<string,string|number|Object>[]|false, notFoundIDs: string[]}}
 */
const checkIDs = function checkIfIDsAreInGamesJSON(season, week, IDs) {
  // Fetch all the games for the given season + week.
  const weekGames = getWeekGames(season, week);
  if (weekGames) {
    // Gets all the games whose IDs are included in the given list of IDs.
    let notFoundIDs = [...IDs];
    const games = getWeekGames(season, week).filter((game) => {
      const included = IDs.includes(game.id);
      if (included) {
        notFoundIDs = notFoundIDs.filter(id => id !== game.id);
      }
      return included;
    });
    return {
      games: games.length ? games : false,
      notFoundIDs,
    };
  }
  console.error('Season or week not found when checking IDs. This should be impossible...');
  return {
    games: false,
    notFoundIDs: IDs,
  };
};

/**
 * Checks if gameIDs.json contains the given season and week, then either returns the week's
 * IDs, or false if it didn't contain that season/week.
 *
 * @param {number} season - The season number.
 * @param {number} week - The week number.
 * @returns {string[]|false} - An array of game IDs, or false if none were found.
 */
const getWeekIDs = function getIDsInWeek(season, week) {
  const [seasonIDs] = gameIDs.seasons.filter(gameSeason => gameSeason.seasonNo === season);
  if (typeof seasonIDs !== 'undefined') {
    const [weekIDs] = seasonIDs.weeks.filter(gameWeek => gameWeek.weekNo === week);
    if (typeof weekIDs !== 'undefined') {
      return weekIDs.games;
    }
  }
  return false;
};

/**
 * Get games from the cache, or if the cache is too old, fetch them, write them, and return those.
 *
 * @param {string} cachePath - The path to the cached scores file.
 * @param {string[]} IDs - The array of IDs to get games for.
 */
const getCachedGames = async function getGamesFromCache(cachePath, IDs) {
  try {
    const response = await checkCacheAge(cachePath, 60);
    /**
     * Someday check whether the cache contains all the IDs here - it doesn't matter currently, as
     * it gets reloaded whenever IDs are added + the project is built anyway.
     */
    if (response.useCache) {
      console.log(`Using cache. ${response.reason}`);
      return readCache(cachePath);
    }
    console.log(`Not using cache. ${response.reason}`);
    return fetchScoresAndWrite(IDs, cachePath);
  } catch (error) {
    return error;
  }
};

/**
 * Checks whether the requested season / week is in the game ID list.
 * If so, checks if those IDs are in the game list.
 * If any are not, it checks whether to use the cache or not, then returns either the cache
 * or fetch the games anew.
 * If they are, or if the season / week is not in the game ID list, it just grabs them from
 * the game list.
 *
 * @param {number} season - The season number.
 * @param {week} week - The week number.
 * @returns {Promise<{Object[], Error>}, Error>}
 *  - A promise resolving to an object containing scores & message.
 */
const getScores = async function getScoresForRequestedDayAndWeek(season, week) {
  try {
    const cachePath = path.join(__dirname, 'cache/scores.json');
    const IDs = getWeekIDs(season, week); // Look for season / week in IDs.
    if (IDs) {
      // IDs were found.
      const checked = checkIDs(season, week, IDs);
      const { games: finalGames } = checked;
      const { notFoundIDs: ongoingIDs } = checked;
      let games = finalGames;
      if (ongoingIDs.length) {
        // There are non-final games!
        const ongoingGames = await getCachedGames(cachePath, ongoingIDs);
        if (games) {
          games = games.concat(ongoingGames);
        } else {
          games = ongoingGames;
        }
      }
      console.log(`Got ${finalGames.length} final games and ${ongoingIDs.length} ongoing games.`);
      return games;
    }
    // No IDs were found.
    return getWeekGames(season, week); // return the games of the week from games.json.
  } catch (error) {
    return error;
  }
};

/**
 * Filters a list of scores by the teams' conferences.
 *
 * @param {Object[]} scores An array of scores to filter.
 * @param {string} fullConf The full name of the conference to filter by.
 */
const filterConfScores = function filterScoresByConference(scores, conf) {
  return scores.filter((score) => {
    const teams = [score.home, score.away];
    let inConf = false;
    for (let i = 0; i < teams.length; i += 1) {
      const team = teams[i];
      const teamInfo = eloJSON.teams.filter(teamJSON => teamJSON.name === team.name)[0];
      inConf = inConf || (teamInfo.conf === conf);
    }
    return inConf;
  });
};

module.exports = {
  getScores,
  sortScores,
  filterConfScores,
};
