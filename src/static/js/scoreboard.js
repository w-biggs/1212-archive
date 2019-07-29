const { debounce } = require('./vendor/underscore.min');

/**
 * Fetch the latest scores.
 *
 * @param {function} callback - A callback to fire once scores are written.
 */
const reloadScores = function reloadScoresWithPostRequest(callback) {
  const scoreboard = document.getElementsByClassName('scoreboard-games')[0];

  const request = new XMLHttpRequest();
  request.open('POST', '/reload-scores');
  request.onreadystatechange = function log() {
    if (request.readyState === 4 && request.status === 200) {
      const placeholderDiv = document.createElement('div');
      placeholderDiv.innerHTML = request.response.trim();
      scoreboard.parentNode.replaceChild(
        placeholderDiv.firstChild,
        scoreboard,
      );
      callback();
    }
  };
  request.send();
};

/**
 * Sets the max height property of the scoreboard when collapsed.
 *
 * @returns {number} - The max height of the collapsed scoreboard.
 */
const setMaxHeight = function setMaxHeightOfCollapsedScoreboard() {
  const scoreboardGame = document.getElementsByClassName('scoreboard-game')[0];

  // The height of a game in the scoreboard.
  const gameHeight = scoreboardGame.getBoundingClientRect().height;
  const gameStyle = getComputedStyle(scoreboardGame);

  // Height + margins, *2 (two rows)
  const maxHeight = (gameHeight
    + parseInt(gameStyle.marginTop, 10)
    + parseInt(gameStyle.marginBottom, 10))
    * 2;

  const styleEl = document.createElement('style');
  styleEl.appendChild(document.createTextNode(`body.scoreboard-is-collapsed .scoreboard-games{ max-height: ${maxHeight.toFixed(2)}px }`));

  document.getElementsByTagName('head')[0].appendChild(styleEl);

  return maxHeight;
};
/**
 * Check whether the "show more" button should be visible.
 *
 * @param {number} maxHeight - The max height of a collapsed scoreboard.
 */
const checkShowButton = function checkIfExpandScoreboardButtonShouldShow(maxHeight) {
  const scoreboard = document.getElementsByClassName('scoreboard-games')[0];

  if (scoreboard.scrollHeight > maxHeight) {
    document.body.classList.add('scoreboard-is-overflowing');
  } else {
    document.body.classList.remove('scoreboard-is-overflowing');
  }
};

/**
 * Expands the scoreboard.
 *
 * @param {HTMLElement} buttonElement - The button that was clicked.
 */
const expandScoreboard = function expandScoreboard(buttonElement) {
  const { collapseText } = buttonElement.dataset;

  document.body.classList.remove('scoreboard-is-collapsed');
  const buttonText = buttonElement.firstChild;
  buttonText.nodeValue = collapseText;
  buttonElement.setAttribute('aria-expanded', 'true');
};

/**
 * Collapses the scoreboard.
 *
 * @param {HTMLElement} buttonElement - The button that was clicked.
 */
const collapseScoreboard = function collapseScoreboard(buttonElement) {
  const { expandText } = buttonElement.dataset;

  document.body.classList.add('scoreboard-is-collapsed');
  const buttonText = buttonElement.firstChild;
  buttonText.nodeValue = expandText;
  buttonElement.setAttribute('aria-expanded', 'false');
};

const clickListener = function addScoreboardExpandButtonClickListener() {
  /**
   * Since the button may be dynamically loaded, you have to attach the listener
   * to the whole document.
   */
  document.addEventListener('click', (event) => {
    // If parent element is the expand button container
    if (event.target.parentNode.classList.contains('scoreboard-expand')) {
      const buttonElement = event.target;

      if (buttonElement.getAttribute('aria-expanded') === 'false') {
        expandScoreboard(buttonElement);
      } else {
        collapseScoreboard(buttonElement);
      }
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  // Set the max height of the scoreboard to two rows.
  const maxHeight = setMaxHeight();

  // Fetch scores at first load, then reload them every 60 seconds.
  reloadScores(() => {
    checkShowButton(maxHeight);
  });

  setInterval(() => {
    reloadScores(() => {
      checkShowButton(maxHeight);
    });
  }, 60000);

  // Listen for clicks of the "show more" button.
  clickListener();

  window.addEventListener('resize', () => {
    debounce(() => {
      checkShowButton(maxHeight);
    }, 300);
  });
});
