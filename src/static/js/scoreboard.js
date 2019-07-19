const scoreboardContainer = document.getElementsByClassName('scoreboard-container')[0];

const reloadScores = function reloadScoresWithPostRequest() {
  const request = new XMLHttpRequest();
  request.open('POST', '/reload-scores');
  request.onreadystatechange = function log() {
    if (request.readyState === 4 && request.status === 200) {
      scoreboardContainer.outerHTML = request.response;
    }
  };
  request.send();
};

setInterval(reloadScores, 60000);
