<template>
  <div class="victory-point-chart">
    <!-- Eigene Legende statt der von Chart.js: dort ginge nur Farbe ODER Bild, hier stehen Farbe, Symbol und Name -->
    <ul class="chart-legend">
      <li v-for="dataset in datasets" :key="dataset.label" class="chart-legend-item">
        <span class="chart-legend-swatch" :style="{backgroundColor: dataset.color}"></span>
        <img v-if="dataset.icon !== undefined" class="chart-legend-icon" :src="dataset.icon.url" :width="dataset.icon.width" :height="dataset.icon.height" alt="">
        <span>{{ dataset.label }}</span>
      </li>
    </ul>
    <div class="victory-point-chart-container">
      <canvas :id="id"></canvas>
    </div>
  </div>
</template>
<script lang="ts">
import {defineComponent} from 'vue';
import {Chart, ChartDataset, registerables} from 'chart.js';
import {translateText} from '@/client/directives/i18n';

Chart.register(...registerables);
// Kleinere Schrift als der Chart.js-Standard der alten Seite (20px): die Diagramme stehen jetzt in der schmaleren rechten Spalte
Chart.defaults.font.size = 14;
Chart.defaults.font.family = 'Ubuntu, Sans';
Chart.defaults.color = 'rgb(240, 240, 240)';

const GRID_COLOR = 'rgba(255, 255, 255, 0.14)';
const POINT_RADIUS = 4;
const LINE_WIDTH = 2;

export type DataSet = {
  label: string;
  data: ReadonlyArray<number>,
  // CSS-Farbe der Linie (chartStyles.ts)
  color: string,
  // Optionales Symbol in der Legende neben Farbe und Name
  icon?: {url: string, width: number, height: number},
};

export default defineComponent({
  name: 'VictoryPointChart',
  props: {
    datasets: {
      type: Array as () => ReadonlyArray<DataSet>,
      required: true,
    },
    generation: {
      type: Number,
      required: true,
    },
    animation: {
      type: Boolean,
    },
    id: {
      type: String,
      required: true,
    },
    yAxisLabel: {
      type: String,
      required: false,
      default: 'Victory Points',
    },
    // Abstand der beschrifteten Hilfslinien: wenige Zahlen, damit die Skala nicht zu voll wird
    yAxisStep: {
      type: Number,
      required: false,
      default: 20,
    },
  },
  methods: {
    getLabels: function(): Array<number> {
      return Array.from({length: this.generation}, (_, index) => index + 1);
    },
    getChartDataSets: function(): Array<ChartDataset<'line', Array<number>>> {
      return this.datasets.map((dataset) => {
        return {
          label: dataset.label,
          data: [...dataset.data],
          fill: false,
          backgroundColor: dataset.color,
          borderColor: dataset.color,
          borderWidth: LINE_WIDTH,
          tension: 0.1,
          pointRadius: POINT_RADIUS,
        };
      });
    },
    renderChart: function(): void {
      const ctx = document.getElementById(this.id) as HTMLCanvasElement;
      if (ctx === null) {
        return;
      }
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.getLabels(),
          datasets: this.getChartDataSets(),
        },
        options: {
          animation: {
            duration: this.animation ? 1000 : 0,
            easing: 'linear',
          },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {display: false},
          },
          scales: {
            y: {
              title: {text: translateText(this.yAxisLabel), display: true},
              grid: {color: GRID_COLOR},
              beginAtZero: true,
              ticks: {stepSize: this.yAxisStep},
            },
            x: {
              title: {text: translateText('Generation'), display: true},
              grid: {display: false},
              offset: true,
            },
          },
        },
      });
    },
  },
  mounted() {
    this.renderChart();
  },
});
</script>
