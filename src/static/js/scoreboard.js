const gameIDs = ['ce0d31', 'ce4ypr'];

const scoreboardGames = document.getElementsByClassName('scoreboard-games')[0];

const getAbbreviation = function getTeamAbbreviation(name) {
  const teamInfo = window.eloHistory.teams.filter(team => team.name === name);
  if (teamInfo) {
    return teamInfo[0].abbr;
  }
  console.error(`No abbreviation found for ${name}`);
  return name;
};

const printGame = function printParsedResponseToScoreboard(game, parent) {
  const { status, teams, gameID } = game;

  const gameDiv = document.createElement('div');
  gameDiv.classList.add('scoreboard-game');

  const teamsDiv = document.createElement('div');
  teamsDiv.classList.add('scoreboard-teams');

  teams.forEach((team, i) => {
    const teamDiv = document.createElement('div');
    teamDiv.classList.add('scoreboard-team');

    const teamNameDiv = document.createElement('div');
    teamNameDiv.classList.add('scoreboard-team-name');
    const teamName = document.createTextNode(team.name);
    teamNameDiv.appendChild(teamName);

    if (team.name === team.possession) {
      teamNameDiv.classList.add('is-possession');
    }

    const teamScoreDiv = document.createElement('div');
    teamScoreDiv.classList.add('scoreboard-team-score');
    const teamScore = document.createTextNode(team.score);
    teamScoreDiv.appendChild(teamScore);

    if (status.final) {
      teamScoreDiv.classList.add('is-final');

      if (team.score > teams[(i + 1) % 2].score) {
        teamScoreDiv.classList.add('is-win');
      } else {
        teamScoreDiv.classList.add('is-loss');
      }
    }

    teamDiv.appendChild(teamNameDiv);
    teamDiv.appendChild(teamScoreDiv);
    teamsDiv.appendChild(teamDiv);
  });

  gameDiv.appendChild(teamsDiv);

  const statusDiv = document.createElement('div');
  statusDiv.classList.add('scoreboard-status');
  const statusSpan = document.createElement('span');
  const statusText = document.createTextNode(status.final ? 'Final' : `${status.time} ${status.quarter}Q - ${status.down} & ${status.toGo} on ${getAbbreviation(status.whoseYardline)} ${status.yardline}`);
  statusSpan.appendChild(statusText);
  statusDiv.appendChild(statusSpan);
  gameDiv.appendChild(statusDiv);

  const streamLink = document.createElement('a');
  streamLink.classList.add('scoreboard-stream-link');
  streamLink.href = `https://reddit-stream.com/comments/${gameID}`;
  const streamSpan = document.createElement('span');
  const streamText = document.createTextNode('View on reddit-stream >');
  streamSpan.appendChild(streamText);
  streamLink.appendChild(streamSpan);
  gameDiv.appendChild(streamLink);

  parent.appendChild(gameDiv);
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

const emptyNode = function removeAllChildrenFromNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

emptyNode(scoreboardGames);

gameIDs.forEach((gameID) => {
  const url = `https://www.reddit.com/api/info.json?id=t3_${gameID}`;

  const request = new XMLHttpRequest();
  request.open('GET', url);
  request.onreadystatechange = function log() {
    if (request.readyState === 4 && request.status === 200) {
      const response = JSON.parse(request.response);
      printGame(parseResponse(response, gameID), scoreboardGames);
    }
  };
  request.send();
});
