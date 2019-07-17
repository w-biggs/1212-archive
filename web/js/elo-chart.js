import Highcharts from 'highcharts';
import HCMore from 'highcharts/highcharts-more';
import * as eloHistory from './elo-history.json';

HCMore(Highcharts);

const eloLightbox = document.getElementsByClassName('elo-lightbox')[0];
const eloLightboxBg = document.getElementsByClassName('elo-lightbox-bg')[0];
const eloLightboxClose = eloLightbox.getElementsByClassName('elo-lightbox-close')[0];

const playoffRounds = {
  14: '1st Round',
  15: '2nd Round',
  16: 'Quarterfinals',
  17: 'Semifinals',
  18: 'Championship',
};

const gameString = function createGameString(team, point) {
  const { index } = point;
  const { seasonNo } = point.series.options;
  if (index === 0) {
    return false;
  }
  
  const weekNo = index - 1;
  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (let i = 0; i <= weekNo; i += 1) {
    if (Object.prototype.hasOwnProperty.call(team.seasons[seasonNo], i)) {
      const week = team.seasons[seasonNo][i];
      if (week.gameInfo.result === 'win') {
        wins += 1;
      } else if (week.gameInfo.result === 'loss') {
        losses += 1;
      } else {
        ties += 1;
      }
    }
  }

  const { gameInfo } = team.seasons[seasonNo][weekNo];

  const resultString = `${gameInfo.result.charAt(0).toUpperCase()} ${gameInfo.score}-${gameInfo.oppScore} vs. ${gameInfo.oppName}`;

  const recordString = `${wins}-${losses}${ties ? `-${ties}` : ''}`;

  return `${resultString} | ${recordString}`;
};

const generateRangeSeries = function generateEloRangeSeries() {
  const series = {};
  Object.keys(eloHistory.seasons).forEach((seasonNo) => {
    const season = eloHistory.seasons[seasonNo];
    series[seasonNo] = {
      name: `Season ${seasonNo} Ranges`,
      data: season,
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
  Object.keys(rangeSeries).forEach((seasonNo) => {
    const seasonRangeSeries = rangeSeries[seasonNo];
    const seasonRanges = seasonRangeSeries.data;
    console.log(team);
    const teamElos = team.seasons[seasonNo];
    const teamSeries = [];

    /**
     * Season 1 had a Week 0, which means that we can't use
     * week 0 as the starting Elo for that season.
     */
    if (parseInt(seasonNo, 10) === 1) {
      teamSeries.push({
        name: 'Start of FCS Season 1',
        y: 1500,
      });
    }

    /* Push each week's Elo to the series */
    for (let i = 0; i < seasonRanges.length; i += 1) {
      /**
       * Skip final week of Season 1, as Season 1's ranges
       * include "Week 0", adding an extra week.
       */
      if (seasonNo !== 0 && i !== seasonRanges.length - 1) {
        const point = {
          name: `Week ${i}`,
          y: null,
        };
        if (i === 0 && seasonNo > 1) {
          point.name = `Start of FCS Season ${seasonNo}`;
        } else if (i > 13) {
          point.name = playoffRounds[i];
        }
        /* Only set elo if team played this week - avoid an error */
        if (Object.prototype.hasOwnProperty.call(teamElos, i)) {
          point.y = teamElos[i].elo;
        }
        teamSeries.push(point);
      }
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
  console.log(series);
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
        console.log(this.point);
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

  for (let i = 0; i < eloHistory.teams.length; i += 1) {
    const team = eloHistory.teams[i];

    if (team.name === hash) {
      /* Generate ranges if not generated yet */
      if (!rangeSeries) {
        rangeSeries = generateRangeSeries();
      }

      const series = generateSeries(team, rangeSeries);

      eloLightboxBg.classList.add('is-visible');
      eloLightbox.classList.add('is-visible');

      drawChart(team, series);
    }
  }
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
