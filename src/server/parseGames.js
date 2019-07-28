/**
 * Parses the JSON returned by the Reddit API into the info we want.
 */

const elo = require('../static/js/elo.json');

/**
 * Get a team's abbreviation from the Elo JSON file.
 *
 * @param {string} name - The name of the team to get the abbreviation for.
 * @returns {string} - The team's abbreviation, or its name if no abbreviation was found.
 */
const getAbbreviation = function getTeamAbbreviation(name) {
  const teamInfo = elo.teams.filter(team => team.name === name);
  if (teamInfo.length) {
    return teamInfo[0].abbr;
  }
  console.error(`No abbreviation found for ${name}`);
  return name;
};

/**
 * Replace all &amp; html entities.
 *
 * @param {string} string - A string that potentially has &amp; entities.
 * @return {string} - A string with any &amp; entities replaced with &.
 */
const fixEntities = function fixHtmlEntities(string) {
  let replacedString = string;
  while (replacedString.includes('&amp;')) {
    replacedString = replacedString.replace('&amp;', '&');
  }
  return replacedString;
};

/**
 * Calculates the amount of time elapsed in the game.
 *
 * @param {string} time - The current time remaining in the quarter in mm:ss format.
 * @param {string} quarter - The current quarter in #Q format.
 * @param {boolean} final - Whether the game is final or not.
 * @returns {number} - The number of seconds elapsed in the current game.
 */
const calcTime = function calculateTimeElapsedFromTimeAndQuarter(time, quarter, final) {
  // A finished game contains 4 quarters of 7 minutes each.
  if (final) {
    return (4 * 7 * 60);
  }

  // Split minutes and seconds into an array.
  const minSec = time.split(':');
  // Make both values integers in the minSec array.
  const intMinSec = minSec.map(num => parseInt(num, 10));
  // Get the quarter number.
  const quarterInt = parseInt(quarter, 10);
  // Get the number of seconds played in the previous quarters.
  const quarterSec = (quarterInt - 1) * (7 * 60);
  // Add the quarter seconds to the seconds played in the current quarter.
  return quarterSec + ((7 * 60) - ((intMinSec[0] * 60) + intMinSec[1]));
};

/**
 * Parses the regex matches into the score object.
 *
 * @param {Array<string>} match - The regex exec match array containing the info.
 * @param {string} gameID - The game's ID.
 * @return {Object<string, any>} - The parsed score.
 */
const parseMatches = function parseRegexMatches(match, gameID) {
  if (!match) {
    return new Error(`No regex match for game ${gameID}`);
  }

  /**
   * May not know whose yardline it is; if we do, set it and remove it from the array to
   * make the array same for both cases.
   */
  const whoseYardline = match.length === 12 ? match[6] : '';
  const normalizedMatch = match.length === 12 ? match.filter((val, index) => index !== 6) : match;

  const [
    fullText,
    time,
    quarter,
    down,
    toGo,
    yardline,
    possession,
    homeName,
    homeScore,
    awayName,
    awayScore,
  ] = normalizedMatch;
  
  const final = fullText.includes('Game complete');

  const timeElapsed = calcTime(time, quarter, final);

  return {
    teams: [
      {
        name: fixEntities(homeName), // Fix &amp;s
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
      whoseYardline: whoseYardline ? getAbbreviation(fixEntities(whoseYardline)) : '',
      possession,
      final,
    },
    gameID,
    timeElapsed,
  };
};

/**
 * Parse a single game's JSON into the info we need.
 *
 * @param {Object<string, any>} response - The game's raw JSON.
 * @param {string} gameID - The ID of the game.
 * @returns {Object<string, any>} - The parsed score.
 */
const parseGame = function parseRawGameJSON(response, gameID) {
  // The raw text of the game's Reddit post
  const text = response.data.children[0].data.selftext;
  // The regex that will grab all the necessary info. Scary!!
  const regex = /[\s\S]*?Clock.*\n.*\n([0-9]+:[0-9]+)\|([0-9])\|(.+) &amp; ([0-9]+)\|(-?[0-9]+)(?: \[(.+?)\])?.*?\|\[(.+?)\][\s\S]*?Team.*\n.*\n\[(.+?)\].*?\*\*([0-9]+)\*\*\n\[(.+?)\].*?\*\*([0-9]+)\*\*[\s\S]*/gm;

  const match = regex.exec(text);

  return parseMatches(match, gameID);
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
  if (scoreA.timeElapsed === 1680) {
    return 1;
  }
  if (scoreB.timeElapsed === 1680) {
    return -1;
  }
  return scoreB.timeElapsed - scoreA.timeElapsed;
};

/**
 * Parses the raw game JSONs and sorts the scores by time elapsed.
 *
 * @param {Array<Object<string, any>>} games - The raw game JSONs.
 * @return {Array<Object<string, any>>}
 *  - An array of JSON objects containing the sorted, parsed scores.
 */
const parseGames = function parseRawGameJsons(games) {
  // Parses all games, then filters out any failed ones
  const parsedResponses = games.map(game => parseGame(game.json, game.gameID))
    .filter(game => game);

  // Sort the scores before returning them.
  return parsedResponses.sort(sortScores);
};

module.exports = {
  parseGames,
};
