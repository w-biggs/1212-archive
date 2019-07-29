const path = require('path');
const express = require('express');
const compression = require('compression');
const ejs = require('ejs');
const elo = require('./static/js/elo.json');
const { getScores, sortScores } = require('./server/scores');

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
  season: 2,
  week: 1,
};

/* Routes */
app.get('/', (req, res) => {
  res.render('pages/index', { ...data, url: req.url });
});

app.post('/reload-scores', (req, res) => {
  const scoreData = {};
  getScores(path.join(__dirname, 'server/cache/scores.json'), data.season, data.week)
    .then((response) => {
      console.log(response.message);
      scoreData.scores = response.data.sort(sortScores);
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
