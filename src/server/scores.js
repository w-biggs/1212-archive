const gamesJson = require('./games.json');
const { checkCache, readCache, writeCache } = require('./scoresCache');
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
 * @param {number} season - The season to fetch scores for.
 * @param {number} week - The week to fetch scores for.
 * @returns {Promise<{data: Array<Object>, message: string}, Error>}
 *  - A promise resolving to an object containing scores & message.
 */
const fetchScoresAndWrite = async function fetchScoresAndWriteToCache(
  games, cachePath, season, week,
) {
  try {
    const rawGames = await fetchGames(games, season, week);
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
 * @param {Array<Object<string, any>>} scores
 *  - An array of JSON objects containing the parsed scores.
 * @returns {Array<Object<string, any>>}
 *  - An array of JSON objects containing the sorted, parsed scores.
 */
const sortScores = function sortScoresByTimeElapsed(scoreA, scoreB) {
  if (scoreA.timeElapsed === scoreB.timeElapsed) {
    return scoreB.lastUpdate - scoreA.lastUpdate;
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
 * Checks whether to use the cache or not, then returns either the cache or anewly fetched
 * scores JSON.
 *
 * @param {string} cachePath - The path to the cached scores file.
 * @returns {Promise<{data: Array<Object>, message: string}, Error>}
 *  - A promise resolving to an object containing scores & message.
 */
const getScores = async function getScoresFromJson(cachePath, season, week) {
  try {
    const res = await checkCache(cachePath, 60);
    if (res.useCache) {
      console.log(`Using cache. ${res.reason}`);
      return readCache(cachePath);
    }
    console.log(`Not using cache. ${res.reason}`);
    return fetchScoresAndWrite(gamesJson, cachePath, season, week);
  } catch (error) {
    return error;
  }
};

module.exports = {
  getScores,
  sortScores,
};
