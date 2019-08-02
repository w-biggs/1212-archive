const seasonDropdown = document.getElementById('scores-season');
const weekDropdown = document.getElementById('scores-week');
const confDropdown = document.getElementById('scores-conf');

const changeURL = function changeURL(season, week, conf) {
  window.location.href = `/scores/${season}/${week}/${conf ? `${conf}/` : ''}`;
};

const handleDropdowns = function handleSeasonWeekDropdowns() {
  const season = seasonDropdown.value;
  const week = weekDropdown.value;
  const conf = confDropdown.value;

  changeURL(season, week, conf);
};

seasonDropdown.addEventListener('change', () => {
  handleDropdowns();
});
weekDropdown.addEventListener('change', () => {
  handleDropdowns();
});
confDropdown.addEventListener('change', () => {
  handleDropdowns();
});
