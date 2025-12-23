/**
 * Chart Module
 * Chart rendering using Chart.js with keyboard accessibility
 */

import { formatCurrency, formatPercentage } from './utils.js';

// Required Return Colors
const COLORS = {
  dividend: '#15803d',    // Green - matches --color-return-dividend
  negative: '#b95b1d',    // Orange - matches --color-return-negative
  required: '#3c6ae5',    // Blue - matches --color-return-required
  darkText: '#06005a'
};

let chartInstance = null;
let currentFocusIndex = 0;
let isKeyboardMode = false;

/**
 * Create or update required return chart
 * @param {Array} cashFlows - Array of cash flow objects
 * @param {boolean} showLabels - Whether to show value labels
 * @param {number} requiredReturn - Required return percentage
 */
export function renderChart(cashFlows, showLabels = true, requiredReturn = null) {
  const canvas = document.getElementById('return-chart');
  
  if (!canvas) {
    console.error('Chart canvas not found');
    return;
  }
  
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-roledescription', 'interactive chart');
  canvas.setAttribute(
    'aria-label',
    'Interactive required return chart showing initial investment and projected dividend payments over 10 years with calculated required return.'
  );

  const ctx = canvas.getContext('2d');
  
  const labels = cashFlows.map(cf => cf.year.toString());
  const dividendData = cashFlows.map(cf => cf.dividend);
  const investmentData = cashFlows.map(cf => cf.investment);
  const totalData = cashFlows.map(cf => cf.totalCashFlow);
  
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  currentFocusIndex = 0;
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Initial investment',
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
      interaction: {
        mode: 'index',
        intersect: false
      },
      onHover: (event, activeElements) => {
        if (isKeyboardMode && document.activeElement === canvas) return;
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          announceDataPoint(cashFlows[index], totalData[index], requiredReturn);
        }
      },
      plugins: {
        title: { display: false },
        legend: { display: false },
        tooltip: {
          usePointStyle: true,
          callbacks: {
            title: (context) => {
              const index = context[0].dataIndex;
              return `Year: ${cashFlows[index].year}`;
            },
            label: (context) => {
              const value = context.parsed.y;
              const index = context.dataIndex;
              const isInitialYear = index === 0;
              
              if (context.dataset.label === 'Required return (r)') {
                return `Required return (r): ${formatPercentage(value)}`;
              }
              
              if (isInitialYear && context.dataset.label === 'Initial investment') {
                return `Initial investment (P₀): ${formatCurrency(value, true)}`;
              }
              
              if (context.dataset.label === 'Dividend cash flow') {
                return `Dividend (D): ${formatCurrency(value, true)}`;
              }
              
              return `${context.dataset.label}: ${formatCurrency(value, true)}`;
            },
            footer: (context) => {
              const index = context[0].dataIndex;
              const total = totalData[index];
              if (context[0].dataset.label !== 'Required return (r)') {
                return `Total: ${formatCurrency(total, true)}`;
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
            color: '#1f2937',
            font: {
              weight: 600
            }
          },
          grid: { display: false },
          ticks: {
            color: '#1f2937',
            font: {
              weight: 500
            }
          },
          border: {
            color: '#1f2937',
            width: 2
          }
        },
        y: {
          title: { 
            display: true, 
            text: 'Cash Flows (USD)',
            color: '#1f2937',
            font: {
              weight: 600
            }
          },
          position: 'left',
          ticks: {
            callback: function(value) { 
              // Format without USD prefix since it's in the axis label
              const absValue = Math.abs(value);
              const formatted = absValue.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              });
              return value < 0 ? `(${formatted})` : formatted;
            },
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
            color: '#1f2937',
            font: {
              weight: 500
            }
          },
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          border: {
            color: '#1f2937',
            width: 2
          }
        },
        y2: {
          title: { 
            display: true,
            text: 'Required Return (%)',
            color: COLORS.required,
            font: {
              weight: 600
            }
          },
          position: 'right',
          min: 0,
          max: requiredReturn ? Math.max(15, requiredReturn * 1.3) : 15,
          ticks: {
            callback: function(value) { 
              // Format without % sign
              return value.toFixed(1);
            },
            color: COLORS.required,
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
            font: {
              weight: 500
            }
          },
          grid: { display: false },
          border: {
            color: COLORS.required,
            width: 2
          }
        }
      },
      layout: {
        padding: { left: 10, right: 10, top: showLabels ? 25 : 10, bottom: 10 }
      }
    },
    plugins: [{
      id: 'stackedBarLabels',
      afterDatasetsDraw: (chart) => {
        if (!showLabels) return;
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = COLORS.darkText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const meta0 = chart.getDatasetMeta(0);
        const meta1 = chart.getDatasetMeta(1);
        let maxPositiveY = chart.scales.y.top;
        chart.data.labels.forEach((label, index) => {
          const total = totalData[index];
          if (total > 0 && meta0.data[index] && meta1.data[index]) {
            const topY = Math.min(meta0.data[index].y, meta1.data[index].y);
            maxPositiveY = Math.max(maxPositiveY, topY);
          }
        });
        chart.data.labels.forEach((label, index) => {
          const total = totalData[index];
          if (Math.abs(total) < 0.01) return;
          if (!meta0.data[index] || !meta1.data[index]) return;
          const bar0 = meta0.data[index];
          const bar1 = meta1.data[index];
          const x = bar1.x;
          let y = total < 0 ? maxPositiveY - 5 : Math.min(bar0.y, bar1.y) - 5;
          ctx.fillText(formatCurrency(total, false), x, y);
        });
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
    }]
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
    
    switch(e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(currentFocusIndex + 1, maxIndex);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(currentFocusIndex - 1, 0);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = maxIndex;
        break;
      default:
        return;
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
    chartInstance.tooltip.setActiveElements([], {x: 0, y: 0});
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
    {datasetIndex: 0, index: index},
    {datasetIndex: 1, index: index}
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
  const investmentLabel = isInitialYear ? 'Initial investment (P₀)' : 'No investment';
  
  const announcement = `Year ${cashFlow.year}. ` +
    `Required return (r): ${requiredReturn ? formatPercentage(requiredReturn) : '0%'}. ` +
    `${investmentLabel}: ${formatCurrency(cashFlow.investment, true)}. ` +
    `Dividend (D): ${formatCurrency(cashFlow.dividend, true)}. ` +
    `Total: ${formatCurrency(total, true)}.`;
  
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