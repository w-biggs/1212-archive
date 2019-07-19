const reloadScores = function reloadScoresWithPostRequest() {
  const scoreboardContainer = document.getElementsByClassName('scoreboard-container')[0];

  const request = new XMLHttpRequest();
  request.open('POST', '/reload-scores');
  request.onreadystatechange = function log() {
    if (request.readyState === 4 && request.status === 200) {
      const scoreboardTemplate = document.createElement('template');
      scoreboardTemplate.innerHTML = request.response.trim();
      scoreboardContainer.parentNode.replaceChild(
        scoreboardTemplate.content.firstChild,
        scoreboardContainer,
      );
    }
  };
  request.send();
};

reloadScores();

setInterval(reloadScores, 60000);

let expandText = '';

document.addEventListener('click', (event) => {
  if (event.target.parentNode.classList.contains('scoreboard-expand')) {
    const scoreboardGames = document.getElementsByClassName('scoreboard-games')[0];
    const scoreboardExpand = scoreboardGames.getElementsByClassName('scoreboard-expand')[0];
    const scoreboardExpandButton = scoreboardExpand.getElementsByTagName('button')[0];
    expandText = expandText || scoreboardExpandButton.innerText;
    const { collapseText } = scoreboardExpandButton.dataset;

    if (scoreboardGames.classList.contains('is-collapsed')) {
      scoreboardGames.classList.remove('is-collapsed');
      scoreboardExpandButton.innerText = collapseText;
    } else {
      scoreboardGames.classList.add('is-collapsed');
      scoreboardExpandButton.innerText = expandText;
    }
  }
});