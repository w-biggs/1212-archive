import Highcharts from 'highcharts';
import HCMore from 'highcharts/highcharts-more';
import * as eloHistory from './elo-history.json';

/* Apply Highcharts-More */
HCMore(Highcharts);

const eloLightbox = document.getElementsByClassName('elo-lightbox')[0];
const eloLightboxBg = document.getElementsByClassName('elo-lightbox-bg')[0];
const eloLightboxClose = eloLightbox.getElementsByClassName('elo-lightbox-close')[0];

const gameString = function createGameString(team, point) {
  const { index } = point;
  const { seasonNo } = point.series.options;

  /* Index 0 is start of season */
  if (index === 0) {
    return false;
  }

  let weekNo = index;

  /* In season 1, index 1 = week 0, etc. */
  if (seasonNo === 1) {
    weekNo = index - 1;
  }
  
  let wins = 0;
  let losses = 0;
  let ties = 0;

  const season = team.seasons.find(teamSeason => teamSeason.seasonNo === seasonNo);

  season.weeks.forEach((week) => {
    if (week.weekNo <= weekNo) {
      if (week.gameInfo.result === 'win') {
        wins += 1;
      } else if (week.gameInfo.result === 'loss') {
        losses += 1;
      } else {
        ties += 1;
      }
    }
  });

  const { gameInfo } = season.weeks.find(week => week.weekNo === weekNo);

  const resultString = `${gameInfo.result.charAt(0).toUpperCase()} ${gameInfo.score}-${gameInfo.oppScore} vs. ${gameInfo.oppName}`;

  const recordString = `${wins}-${losses}${ties ? `-${ties}` : ''}`;

  return `${resultString} | ${recordString}`;
};

const generateRangeSeries = function generateEloRangeSeries() {
  const series = [];

  eloHistory.seasons.forEach((season, i) => {
    const { seasonNo, weeks } = season;
    const data = weeks.map(week => week.range);
    series[i] = {
      name: `Season ${seasonNo} Ranges`,
      data,
      seasonNo,
      type: 'arearange',
      lineWidth: 0,
      linkedTo: ':previous',
      fillOpacity: 0.1,
      zIndex: 0,
      marker: {
        enabled: false,
      },
      enableMouseTracking: false,
    };
  });

  return series;
};

const generateSeries = function generateEloSeriesForSpecificTeam(team, rangeSeries) {
  const series = [];
  rangeSeries.forEach((seasonRangeSeries, i) => {
    const { data: seasonRanges, seasonNo } = seasonRangeSeries;
    const teamSeason = team.seasons.find(season => season.seasonNo === seasonNo);
    const teamSeries = [];

    /* Push each week's Elo to the series */
    for (let j = 0; j < seasonRanges.length; j += 1) {
      const { weekNo, name } = eloHistory.seasons[i].weeks[j];

      const point = {
        name: `Week ${weekNo}`,
        y: null,
      };

      if (name) {
        point.name = name;
      }

      /**
       * Only set elo if team played this week - avoid an error.
       * Week -1 is only used in season 1 for the initial Elo of 1500.
       */
      if (weekNo < 0) {
        point.y = 1500;
      } else {
        const teamWeek = teamSeason.weeks.find(week => week.weekNo === weekNo);
        if (teamWeek) {
          point.y = teamWeek.elo;
        }
      }
      
      teamSeries.push(point);
    }

    /* Push series with options */
    series.push(...[
      {
        name: `Season ${seasonNo} Elo`,
        seasonNo,
        data: teamSeries,
        zIndex: 1,
        lineWidth: 3,
        connectNulls: true,
        states: {
          hover: {
            lineWidthPlus: 0,
          },
        },
        marker: {
          enabled: false,
          fillColor: '#999',
          radius: 4,
          states: {
            hover: {
              enabled: true,
              lineWidth: 0,
              lineWidthPlus: 0,
              radiusPlus: 0,
            },
          },
        },
      },
      seasonRangeSeries,
    ]);
  });
  return series;
};

const drawChart = function drawEloHistoryChart(team, series) {
  const eloChart = Highcharts.chart('elo-chart', {
    title: {
      text: `${team.name} Elo history`,
    },
    chart: {
      backgroundColor: '#f4f4f4',
      style: {
        fontFamily: '"HK Grotesk", "Helvetica Neue", Helvetica, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", sans-serif',
      },
    },
    xAxis: {
      title: {
        text: 'Week',
        enabled: false,
      },
      labels: {
        enabled: false,
      },
      minorTickLength: 0,
      tickLength: 0,
      plotLines: [{
        color: '#f4f4f4',
        width: 2,
        value: 14.5,
        label: {
          text: 'PLAYOFFS',
          verticalAlign: 'middle',
          textAlign: 'center',
          style: {
            color: 'rgba(0,0,0,0.5)',
            fontWeight: 'bold',
          },
          y: 50,
        },
        zIndex: 5,
      }],
    },
    yAxis: {
      title: {
        text: 'Elo rating',
        enabled: false,
      },
      max: 1900,
      min: 1100,
    },
    tooltip: {
      borderWidth: 0,
      shape: 'square',
      animation: false,
      backgroundColor: 'rgba(0,0,0,0)',
      shadow: false,
      useHTML: true,
      padding: 0,
      formatter: function formatTooltip() {
        const { chart } = this.series;
        const game = gameString(team, this.point);
        const gameInfoString = game ? `<div class="elo-tooltip-game">${game}</div>` : '';
        const lineTop = chart.plotTop + 16;
        const lineLeft = chart.plotLeft + this.point.plotX + 16;
        const lineBottom = (chart.plotTop + chart.plotHeight) - this.point.plotY - 16 + 4;
        return `<div class="elo-tooltip-elo">${this.y.toFixed(0)}</div>
        ${gameInfoString}
        <div class="elo-tooltip-week">${this.point.name}</div>
        <div class="elo-tooltip-line" style="top: ${lineTop}px; left: ${lineLeft}px; bottom: ${lineBottom}px"></div>`;
      },
      positioner: function positionTooltip(labelWidth, labelHeight, point) {
        let calcLeft = point.plotX + this.chart.plotLeft - (labelWidth / 2);
        const minLeft = this.chart.plotLeft;
        const maxLeft = this.chart.plotLeft + this.chart.plotWidth - labelWidth;
        const tooltipElement = document.querySelector('div.highcharts-tooltip');
        if (calcLeft < minLeft) {
          calcLeft = minLeft;
          tooltipElement.classList.remove('highcharts-tooltip-tar');
          tooltipElement.classList.add('highcharts-tooltip-tal');
        } else if (calcLeft > maxLeft) {
          calcLeft = maxLeft;
          tooltipElement.classList.remove('highcharts-tooltip-tal');
          tooltipElement.classList.add('highcharts-tooltip-tar');
        } else {
          tooltipElement.classList.remove('highcharts-tooltip-tal');
          tooltipElement.classList.remove('highcharts-tooltip-tar');
        }
        return { x: calcLeft, y: this.chart.plotTop };
      },
    },
    legend: {
      enabled: false,
    },
    series,
  });
  return eloChart;
};

/* Generate ranges once */
let rangeSeries;

const openChart = function openEloHistoryChart() {
  if (!window.location.hash) {
    return;
  }
  const hash = decodeURI(window.location.hash.replace(/^#/, ''));

  const team = eloHistory.teams.find(eloTeam => eloTeam.name === hash);

  if (!rangeSeries) {
    rangeSeries = generateRangeSeries();
  }

  const series = generateSeries(team, rangeSeries);

  eloLightboxBg.classList.add('is-visible');
  eloLightbox.classList.add('is-visible');

  drawChart(team, series);
};

document.addEventListener('DOMContentLoaded', () => {
  openChart();
});

window.addEventListener('hashchange', () => {
  openChart();
});

const closeChart = function closeEloHistoryChart() {
  eloLightboxBg.classList.remove('is-visible');
  eloLightbox.classList.remove('is-visible');

  window.history.replaceState(null, null, ' ');
};

eloLightboxClose.addEventListener('click', (event) => {
  event.preventDefault();

  closeChart();
});

eloLightboxBg.addEventListener('click', () => {
  closeChart();
});
