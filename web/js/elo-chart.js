import Highcharts from 'highcharts';
import HCMore from 'highcharts/highcharts-more';
import * as eloHistory from './elo-history.json';

HCMore(Highcharts);

const eloLightbox = document.getElementsByClassName('elo-lightbox')[0];
const eloLightboxBg = document.getElementsByClassName('elo-lightbox-bg')[0];
const eloLightboxClose = eloLightbox.getElementsByClassName('elo-lightbox-close')[0];

const seasonLength = 18;

const playoffRounds = {
  14: '1st Round',
  15: '2nd Round',
  16: 'Quarterfinals',
  17: 'Semifinals',
  18: 'Championship',
};

const gameString = function createGameString(team, index) {
  if (index === 0) {
    return false;
  }
  
  const weekNo = index - 1;
  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (let i = 0; i <= weekNo; i += 1) {
    if (Object.prototype.hasOwnProperty.call(team.weeks, i)) {
      if (team.weeks[i].gameInfo.result === 'win') {
        wins += 1;
      } else if (team.weeks[i].gameInfo.result === 'loss') {
        losses += 1;
      } else {
        ties += 1;
      }
    }
  }

  const { gameInfo } = team.weeks[weekNo];

  const resultString = `${gameInfo.result.charAt(0).toUpperCase()} ${gameInfo.score}-${gameInfo.oppScore} vs. ${gameInfo.oppName}`;

  const recordString = `${wins}-${losses}${ties ? `-${ties}` : ''}`;

  return `${resultString} | ${recordString}`;
};

const drawChart = function drawEloHistoryChart(team) {
  const teamElos = [{
    name: 'Start of Season 2',
    y: 1500,
  }];
  for (let i = 0; i <= seasonLength; i += 1) {
    const point = {
      name: `Week ${i}`,
      y: null,
    };
    if (Object.prototype.hasOwnProperty.call(team.weeks, i)) {
      if (i > 13) {
        point.name = playoffRounds[i];
      }
      point.y = team.weeks[i].elo;
    }
    teamElos.push(point);
  }
  console.log(teamElos);
  const eloChart = Highcharts.chart('elo-chart', {
    title: {
      text: `${team.name} Elo history`,
    },
    chart: {
      backgroundColor: '#f4f4f4',
      style: {
        fontFamily: '',
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
        const game = gameString(team, this.point.index);
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
        // console.log(labelHeight);
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
    series: [{
      name: 'Elo',
      data: teamElos,
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
    }, {
      name: 'Range',
      data: eloHistory.range,
      type: 'arearange',
      lineWidth: 0,
      linkedTo: ':previous',
      fillOpacity: 0.1,
      zIndex: 0,
      marker: {
        enabled: false,
      },
      enableMouseTracking: false,
    }],
  });
  return eloChart;
};

const openChart = function openEloHistoryChart() {
  if (!window.location.hash) {
    return;
  }
  const hash = decodeURI(window.location.hash.replace(/^#/, ''));

  for (let i = 0; i < eloHistory.teams.length; i += 1) {
    const team = eloHistory.teams[i];

    if (team.name === hash) {
      eloLightboxBg.classList.add('is-visible');
      eloLightbox.classList.add('is-visible');

      drawChart(team);
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
