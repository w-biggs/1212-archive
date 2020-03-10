const path = require('path');
const express = require('express');
const compression = require('compression');
const ejs = require('ejs');
const stats = require('./static/js/stats.json');
const elo = require('./static/js/elo.json');
const pn = require('./static/js/pn.json');
const wPn = require('./static/js/wpn.json');
const games = require('./static/js/games.json');
const { getScores, sortScores, filterConfScores } = require('./server/scores');

const app = express();

/* gzip */
app.use(compression());

/* Views */
app.set('views', path.join(__dirname, 'views'));

/* Static assets */
app.use(express.static(path.join(__dirname, 'static')));

/* Live reload */
if (app.get('env') === 'development') {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  app.use(require('connect-livereload')({
    port: 35729,
  }));
}

/* EJS */
app.engine('html', ejs.renderFile);
app.set('view engine', 'ejs');

/* Data */
const data = {
  env: app.get('env'),
  teams: elo.teams,
  pn,
  wPn,
  season: 2,
  week: 18,
};

// List of conferences.
const confs = [
  { conf: 'Big Sky', fullConf: 'Big Sky' },
  { conf: 'MVC', fullConf: 'Missouri Valley Conference' },
  { conf: 'Atlantic Sun', fullConf: 'Atlantic Sun' },
  { conf: 'Southland', fullConf: 'Southland' },
  { conf: 'Ivy League', fullConf: 'Ivy League' },
  { conf: 'DIC', fullConf: 'Delta Intercollegiate' },
  { conf: 'Colonial', fullConf: 'Colonial' },
  { conf: 'Mid-Atlantic', fullConf: 'Mid-Atlantic' },
  { conf: 'CFC', fullConf: 'Carolina Football Conference' },
  { conf: 'America East', fullConf: 'America East' },
];

/* Routes */
app.get('/', (req, res) => {
  res.render('pages/index', { ...data, url: req.url });
});

app.get('/scores', (req, res) => {
  res.redirect(`/scores/${data.season}/${data.week}/`);
});

app.get('/standings', (req, res) => {
  res.render('pages/standings', { ...data, url: req.url, stats });
});

app.get('/stats', (req, res) => {
  res.render('pages/stats', { ...data, url: req.url, stats });
});

app.get('/scores/:season/:week/:conf?/', (req, res) => {
  let { season, week, conf } = req.params;
  // Ensure values are valid integers
  [season, week] = [season, week].map(val => parseInt(val, 10));
  if (Number.isNaN(season) || Number.isNaN(week)) {
    return res.status(404).send('404... how did you get here?');
  }
  
  if (conf) {
    conf = decodeURI(conf);
    if (!confs.filter(conference => conference.conf === conf).length) {
      return res.redirect(`/scores/${season}/${week}/`);
    }
  }

  // Redirect to last season/week if requested season/week don't exist.
  let redirect = false;
  let [gameSeason] = games.seasons.filter(filterSeason => filterSeason.seasonNo === season);
  if (typeof gameSeason === 'undefined') {
    season = games.seasons[games.seasons.length - 1].seasonNo;
    [gameSeason] = games.seasons.filter(filterSeason => filterSeason.seasonNo === season);
    redirect = true;
  }
  let [gameWeek] = gameSeason.weeks.filter(filterWeek => filterWeek.weekNo === week);
  if (typeof gameWeek === 'undefined') {
    week = gameSeason.weeks[gameSeason.weeks.length - 1].weekNo;
    [gameWeek] = gameSeason.weeks.filter(filterWeek => filterWeek.weekNo === week);
    redirect = true;
  }
  if (redirect) {
    return res.redirect(`/scores/${season}/${week}/`);
  }

  // Get the requested games.
  let filteredGames = [];
  return getScores(season, week)
    .then((response) => {
      filteredGames = response;
      if (conf) {
        filteredGames = filterConfScores(filteredGames, conf);
      }
      filteredGames = filteredGames.sort(sortScores);
    })
    .catch(error => console.error(error))
    .then(() => res.render('pages/scores', {
      ...data,
      seasons: elo.seasons,
      confs,
      games: {
        json: filteredGames,
        season,
        week,
      },
      url: req.url,
    }));
});

app.post('/reload-scoreboard', (req, res) => {
  const scoreData = {};
  getScores(data.season, data.week)
    .then((response) => {
      scoreData.scores = response.sort(sortScores);
    })
    .catch(error => console.error(error))
    .then(() => res.render('partials/scoreboard-games', scoreData));
});

/* Serve */
const PORT = process.env.PORT || 1212;
app.listen(PORT, () => {
  console.log(`App is listening to ${PORT}...`);
  console.log(`env: ${app.get('env')}`);
  console.log('Press Ctrl+C to quit.');
});
