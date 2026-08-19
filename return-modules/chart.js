/**
 * Chart Module
 * Chart rendering using Chart.js with keyboard accessibility
 */

import { formatCurrency, formatPercentage } from './utils.js';


/** Curriculum chart label convention: 13px / 600 / Lato */
const CHART_FONT = {
  family: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  size: 13,
  weight: '600'
};
const CHART_FONT_CSS = `${CHART_FONT.weight} ${CHART_FONT.size}px ${CHART_FONT.family}`;
const CHART_FONT_ITALIC_CSS = `italic ${CHART_FONT.weight} ${CHART_FONT.size}px ${CHART_FONT.family}`;


// Required Return Colors
const COLORS = {
  dividend: '#3c6ae5',
  negative: '#b95b1d',
  required: '#6b35e8',
  darkText: '#06005a'
};

// Unicode italic math characters for canvas rendering
const ITALICr = '\u{1D45F}';   // 𝑟
const ITALICt = '\u{1D461}';   // 𝑡
const ITALICg = '\u{1D454}';   // 𝑔

let chartInstance = null;
let currentFocusIndex = 0;
let isKeyboardMode = false;

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Calculate a "nice" y-axis maximum that aligns with tick increments of 5
 */
function niceAxisMax(value) {
  const raw = Math.max(15, value * 1.15);
  return Math.ceil(raw / 5) * 5;
}

/**
 * Format value as USD string (no space between prefix and value)
 */
function formatUSD(value) {
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (value < 0) return `\u2212USD${formatted}`;
  return `USD${formatted}`;
}

/**
 * Create or update required return chart
 */
export function renderChart(cashFlows, showLabels = true, requiredReturn = null) {
  const canvas = document.getElementById('return-chart');
  if (!canvas) { console.error('Chart canvas not found'); return; }

  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-roledescription', 'interactive chart');
  canvas.setAttribute(
    'aria-label',
    `Interactive required return chart. Use arrow keys to navigate between years, Home for year 0, End for the last year.`
  );

  const ctx = canvas.getContext('2d');
  const labels = cashFlows.map(cf => cf.year.toString());
  const dividendData = cashFlows.map(cf => cf.dividend);
  const investmentData = cashFlows.map(cf => cf.investment);
  const totalData = cashFlows.map(cf => cf.totalCashFlow);
  const reduceMotion = prefersReducedMotion();
  const axisMax = requiredReturn ? niceAxisMax(requiredReturn) : 20;

  if (chartInstance) { chartInstance.destroy(); }
  currentFocusIndex = 0;

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Initial investment / Market price',
          data: investmentData,
          backgroundColor: COLORS.negative,
          borderWidth: 0,
          stack: 'cashflow',
          yAxisID: 'y',
          order: 1
        },
        {
          label: 'Dividend cash flow',
          data: dividendData,
          backgroundColor: COLORS.dividend,
          borderWidth: 0,
          stack: 'cashflow',
          yAxisID: 'y',
          order: 1
        },
        ...(requiredReturn !== null ? [{
          label: 'Required return (r)',
          data: labels.map(() => requiredReturn),
          type: 'line',
          borderColor: COLORS.required,
          borderWidth: 3,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
          yAxisID: 'y2',
          order: 0
        }] : [])
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotion ? { duration: 0 } : { duration: 400 },
      interaction: { mode: 'index', intersect: false },
      onHover: (event, activeElements) => {
        if (isKeyboardMode && document.activeElement === canvas) return;
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          announceDataPoint(cashFlows[index], totalData[index], requiredReturn);
        }
      },
      plugins: {
        title: { display: false },
        subtitle: {
          display: true,
          text: 'Dividend stream continues indefinitely; first 10 years shown.',
          position: 'bottom',
          color: '#6b7280',
          font: { size: 13, style: 'italic', family: CHART_FONT.family },
          padding: { top: 8, bottom: 0 }
        },
        legend: { display: false },
        tooltip: {
          usePointStyle: true,
          callbacks: {
            title: (context) => `Year: ${cashFlows[context[0].dataIndex].year}`,
            label: (context) => {
              const value = context.parsed.y;
              const index = context.dataIndex;
              const isInitialYear = index === 0;

              if (context.dataset.label === 'Required return (r)') {
                return `Required return (\u{1D45F}): ${formatPercentage(value)}`;
              }
              if (isInitialYear && context.dataset.label === 'Initial investment / Market price') {
                return `Initial investment / Market price (PV\u{1D461}): ${formatUSD(value)}`;
              }
              if (context.dataset.label === 'Dividend cash flow') {
                return `Dividend (Div\u{1D461}): ${formatUSD(value)}`;
              }
              return `${context.dataset.label}: ${formatUSD(value)}`;
            },
            footer: (context) => {
              const index = context[0].dataIndex;
              const total = totalData[index];
              if (context[0].dataset.label !== 'Required return (r)') {
                return `Total: ${formatUSD(total)}`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Years',
            color: '#374151',
            font: { size: 13, weight: '600', family: CHART_FONT.family }
          },
          ticks: {
            color: '#374151',
            font: { size: 13, weight: '600', family: CHART_FONT.family }
          },
          grid: { display: false }
        },
        y: {
          title: {
            display: true,
            text: 'Cash flows (USD)',
            color: '#374151',
            font: { size: 13, weight: '600', family: CHART_FONT.family }
          },
          position: 'left',
          ticks: {
            callback: (value) => value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            color: '#374151',
            autoSkip: true,
            maxTicksLimit: 8,
            maxRotation: 0,
            minRotation: 0,
            font: { size: 13, weight: '600', family: CHART_FONT.family }
          },
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        y2: {
          title: { display: false },
          position: 'right',
          min: 0,
          max: axisMax,
          ticks: {
            callback: (value) => Number(value).toFixed(0),
            color: COLORS.required,
            autoSkip: true,
            maxTicksLimit: 7,
            maxRotation: 0,
            minRotation: 0,
            font: { size: 13, weight: '600', family: CHART_FONT.family }
          },
          grid: { display: false }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: axisMax > 35 ? 62 : 55,
          top: showLabels ? 35 : 15,
          bottom: 10
        }
      }
    },
    plugins: [
      {
        id: 'verticalY2Title',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          ctx.save();
          ctx.fillStyle = COLORS.required;
          ctx.font = CHART_FONT_CSS;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const x = chartArea.right + 48;
          const y = (chartArea.top + chartArea.bottom) / 2;
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 2);
          // Use italic r (unicode) in axis label
          ctx.fillText(`Required return (\u{1D45F}) %`, 0, 0);
          ctx.restore();
        }
      },
      {
        id: 'stackedBarLabels',
        afterDatasetsDraw: (chart) => {
          if (!showLabels) return;
          const ctx = chart.ctx;
          ctx.save();
          ctx.font = CHART_FONT_CSS;
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const meta0 = chart.getDatasetMeta(0);
          const meta1 = chart.getDatasetMeta(1);
          let highestPositiveY = chart.scales.y.top;
          chart.data.labels.forEach((label, index) => {
            const total = totalData[index];
            if (total > 0 && meta0.data[index] && meta1.data[index]) {
              const topY = Math.min(meta0.data[index].y, meta1.data[index].y);
              highestPositiveY = Math.min(highestPositiveY, topY);
            }
          });
          const labelY = highestPositiveY - 8;
          chart.data.labels.forEach((label, index) => {
            const total = totalData[index];
            if (Math.abs(total) < 0.01) return;
            if (!meta0.data[index] || !meta1.data[index]) return;
            const bar1 = meta1.data[index];
            const x = bar1.x;
            const formattedValue = Math.abs(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const displayValue = total < 0 ? `\u2212${formattedValue}` : formattedValue;
            ctx.fillText(displayValue, x, labelY);
          });
          ctx.restore();
        }
      },
      {
        id: 'requiredReturnLabel',
        afterDatasetsDraw: (chart) => {
          if (!requiredReturn) return;
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          const yScale = chart.scales.y2;
          const lineYPos = yScale.getPixelForValue(requiredReturn);
          ctx.save();
          const labelX = (chartArea.left + chartArea.right) / 2;
          const labelY = lineYPos + 20;
          const labelValue = formatPercentage(requiredReturn, 2);
          ctx.font = CHART_FONT_ITALIC_CSS;
          const rMetrics = ctx.measureText('\u{1D45F}');
          ctx.font = CHART_FONT_CSS;
          const equalsMetrics = ctx.measureText(' = ');
          const valueMetrics = ctx.measureText(labelValue);
          const totalWidth = rMetrics.width + equalsMetrics.width + valueMetrics.width;
          const padding = 5;
          const boxX = labelX - totalWidth / 2 - padding;
          const boxY = labelY - 12 / 2 - padding;
          const boxWidth = totalWidth + padding * 2;
          const boxHeight = 12 + padding * 2;
          ctx.fillStyle = 'white';
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
          ctx.strokeStyle = COLORS.required;
          ctx.lineWidth = 2;
          ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
          let currentX = labelX - totalWidth / 2;
          ctx.fillStyle = COLORS.required;
          ctx.font = CHART_FONT_ITALIC_CSS;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('\u{1D45F}', currentX, labelY);
          currentX += rMetrics.width;
          ctx.font = CHART_FONT_CSS;
          ctx.fillText(' = ', currentX, labelY);
          currentX += equalsMetrics.width;
          ctx.fillText(labelValue, currentX, labelY);
          ctx.restore();
        }
      },
      {
        id: 'keyboardFocus',
        afterDatasetsDraw: (chart) => {
          if (document.activeElement !== canvas) return;
          const ctx = chart.ctx;
          const meta0 = chart.getDatasetMeta(0);
          const meta1 = chart.getDatasetMeta(1);
          if (!meta0.data[currentFocusIndex] || !meta1.data[currentFocusIndex]) return;
          const bar0 = meta0.data[currentFocusIndex];
          const bar1 = meta1.data[currentFocusIndex];
          const allYValues = [bar0.y, bar0.base, bar1.y, bar1.base];
          const topY = Math.min(...allYValues);
          const bottomY = Math.max(...allYValues);
          ctx.save();
          ctx.strokeStyle = COLORS.darkText;
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          const x = bar1.x - bar1.width / 2 - 4;
          const y = topY - 4;
          const width = bar1.width + 8;
          const height = bottomY - topY + 8;
          ctx.strokeRect(x, y, width, height);
          ctx.restore();
        }
      }
    ]
  });

  setupKeyboardNavigation(canvas, cashFlows, totalData, requiredReturn);
}

function setupKeyboardNavigation(canvas, cashFlows, totalData, requiredReturn) {
  const oldListener = canvas._keydownListener;
  if (oldListener) canvas.removeEventListener('keydown', oldListener);

  const keydownListener = (e) => {
    const maxIndex = cashFlows.length - 1;
    let newIndex = currentFocusIndex;
    isKeyboardMode = true;

    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(currentFocusIndex + 1, maxIndex);
        break;
      case 'ArrowLeft': case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(currentFocusIndex - 1, 0);
        break;
      case 'Home': e.preventDefault(); newIndex = 0; break;
      case 'End': e.preventDefault(); newIndex = maxIndex; break;
      default: return;
    }

    if (newIndex !== currentFocusIndex) {
      currentFocusIndex = newIndex;
      chartInstance.update('none');
      announceDataPoint(cashFlows[currentFocusIndex], totalData[currentFocusIndex], requiredReturn);
      showTooltipAtIndex(currentFocusIndex);
    }
  };

  canvas._keydownListener = keydownListener;
  canvas.addEventListener('keydown', keydownListener);

  const focusListener = () => {
    isKeyboardMode = true;
    showTooltipAtIndex(currentFocusIndex);
    announceDataPoint(cashFlows[currentFocusIndex], totalData[currentFocusIndex], requiredReturn);
  };
  const blurListener = () => {
    chartInstance.tooltip.setActiveElements([], { x: 0, y: 0 });
    chartInstance.update('none');
  };
  canvas._focusListener = focusListener;
  canvas._blurListener = blurListener;
  canvas.addEventListener('focus', focusListener);
  canvas.addEventListener('blur', blurListener);

  const mouseMoveListener = () => { isKeyboardMode = false; };
  canvas._mouseMoveListener = mouseMoveListener;
  canvas.addEventListener('mousemove', mouseMoveListener);
}

function showTooltipAtIndex(index) {
  if (!chartInstance) return;
  const meta0 = chartInstance.getDatasetMeta(0);
  const meta1 = chartInstance.getDatasetMeta(1);
  if (!meta0.data[index] || !meta1.data[index]) return;
  chartInstance.tooltip.setActiveElements([
    { datasetIndex: 0, index },
    { datasetIndex: 1, index }
  ], { x: meta1.data[index].x, y: meta1.data[index].y });
  chartInstance.update('none');
}

function announceDataPoint(cashFlow, total, requiredReturn) {
  let liveRegion = document.getElementById('chart-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'chart-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  const isInitialYear = cashFlow.year === 0;
  const investmentLabel = isInitialYear ? 'Initial investment / Market price' : 'No investment';
  const announcement =
    `Year ${cashFlow.year}. ` +
    `Required return: ${requiredReturn ? formatPercentage(requiredReturn) : '0%'}. ` +
    `${investmentLabel}: ${formatUSD(cashFlow.investment)}. ` +
    `Dividend: ${formatUSD(cashFlow.dividend)}. ` +
    `Total: ${formatUSD(total)}.`;
  liveRegion.textContent = announcement;
}

export function shouldShowLabels() {
  return window.innerWidth > 860;
}

export function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}