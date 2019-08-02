const seasonDropdown = document.getElementById('scores-season');
const weekDropdown = document.getElementById('scores-week');

const changeSeasonAndWeek = function changeSeasonAndWeek(season, week) {
  window.location.href = `/scores/${season}/${week}`;
};

const handleDropdowns = function handleSeasonWeekDropdowns() {
  const season = seasonDropdown.value;
  const week = weekDropdown.value;

  changeSeasonAndWeek(season, week);
};

seasonDropdown.addEventListener('change', () => {
  handleDropdowns();
});
weekDropdown.addEventListener('change', () => {
  handleDropdowns();
});
