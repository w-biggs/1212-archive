/**
 * Fetches games from the Reddit API.
 */

const https = require('https');

/**
 * Fetch the JSON of a single game.
 *
 * @param {string} gameID - The ID of the game whose JSON we want to fetch.
 * @returns {Promise<{json: Object<string,any>, gameID: string}>}
 *  - A promise that resolves to an object containing the JSON and the game's ID.
 */
const fetchGameJson = function fetchGameJsonViaHttps(gameID) {
  return new Promise((resolve, reject) => {
    // The reddit API URL that returns the info we need.
    const url = `https://www.reddit.com/api/info.json?id=t3_${gameID}`;
    // Send a request to the API
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

/**
 * Fetch the scores for all games together.
 *
 * @param {{
 *  seasons: Array<{
 *    seasonNo: number, weeks: Array<{
 *      weekNo: number, games: Array<string>
 *    }>
 *  }>
 * }} games - The list of gameIDs.
 * @return {Array<Object<string,any>>} - An array of game JSONs.
 */
const fetchGames = async function fetchAllGamesFromGames(gameIDs) {
  const requests = [];

  try {
    gameIDs.forEach((gameID) => {
      const request = fetchGameJson(gameID);
      requests.push(request);
    });

    return await Promise.all(requests);
  } catch (error) {
    return error;
  }
};

module.exports = {
  fetchGames,
};
