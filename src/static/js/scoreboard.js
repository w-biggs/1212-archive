const { debounce } = require('./vendor/underscore.min');

const checkOverflow = function checkIfScoresAreOverflowingAndShowButton() {
  const scoreboardGamesContainer = document.getElementsByClassName('scoreboard-games')[0];
  const scoreboardGames = document.getElementsByClassName('scoreboard-game');
  const gameCount = scoreboardGames.length;

  const contWidth = scoreboardGamesContainer.getBoundingClientRect().width;

  const gameStyle = getComputedStyle(scoreboardGames[0]);
  const gameWidth = scoreboardGames[0].getBoundingClientRect().width
    + parseInt(gameStyle.marginLeft, 10)
    + parseInt(gameStyle.marginRight, 10);

  if (gameCount > 10) { // More than 10 games
    return true;
  }
  if (gameCount > 8 && (gameWidth * 5) > contWidth) { // overflowing two rows of 4
    return true;
  }
  if (gameCount > 6 && (gameWidth * 4) > contWidth) { // overflowing two rows of 3
    return true;
  }
  if (gameCount > 4 && (gameWidth * 3) > contWidth) { // overflowing two rows of 2
    return true;
  }
  if (gameCount > 2 && (gameWidth * 2) > contWidth) { // overflowing two rows of 1
    return true;
  }

  return false;
};

const checkShowButton = function checkIfExpandScoreboardButtonShouldShow() {
  const overflow = checkOverflow();

  if (overflow) {
    document.body.classList.add('scoreboard-is-overflowing');
  } else {
    document.body.classList.remove('scoreboard-is-overflowing');
  }
};

const reloadScores = function reloadScoresWithPostRequest() {
  const scoreboardContainer = document.getElementsByClassName('scoreboard-container')[0];

  const request = new XMLHttpRequest();
  request.open('POST', '/reload-scores');
  request.onreadystatechange = function log() {
    if (request.readyState === 4 && request.status === 200) {
      const placeholderDiv = document.createElement('div');
      placeholderDiv.innerHTML = request.response.trim();
      scoreboardContainer.parentNode.replaceChild(
        placeholderDiv.firstChild,
        scoreboardContainer,
      );
      checkShowButton();
    }
  };
  request.send();
};

const setMaxHeight = function setMaxHeightOfCollapsedScoreboard() {
  const scoreboardGame = document.getElementsByClassName('scoreboard-game')[0];

  const gameHeight = scoreboardGame.getBoundingClientRect().height;
  const gameStyle = getComputedStyle(scoreboardGame);

  const maxHeight = (gameHeight
    + parseInt(gameStyle.marginTop, 10)
    + parseInt(gameStyle.marginBottom, 10))
    * 2;

  const styleEl = document.createElement('style');
  styleEl.appendChild(document.createTextNode(`body.scoreboard-is-collapsed .scoreboard-games{ max-height: ${maxHeight.toFixed(2)}px }`));

  document.getElementsByTagName('head')[0].appendChild(styleEl);
};

const clickListener = function addScoreboardExpandButtonClickListener() {
  let expandText = '';

  document.addEventListener('click', (event) => {
    if (event.target.parentNode.classList.contains('scoreboard-expand')) {
      const scoreboardExpand = document.getElementsByClassName('scoreboard-expand')[0];
      const scoreboardExpandButton = scoreboardExpand.getElementsByTagName('button')[0];
      expandText = expandText || scoreboardExpandButton.innerText;
      const { collapseText } = scoreboardExpandButton.dataset;
  
      if (scoreboardExpandButton.getAttribute('aria-expanded') === 'true') {
        document.body.classList.add('scoreboard-is-collapsed');
        scoreboardExpandButton.innerText = expandText;
        scoreboardExpandButton.setAttribute('aria-expanded', 'false');
      } else {
        document.body.classList.remove('scoreboard-is-collapsed');
        scoreboardExpandButton.innerText = collapseText;
        scoreboardExpandButton.setAttribute('aria-expanded', 'true');
      }
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  reloadScores();
  setInterval(reloadScores, 60000);

  setMaxHeight();

  checkShowButton();

  clickListener();
});

window.addEventListener('resize', () => {
  debounce(checkShowButton, 300);
});
