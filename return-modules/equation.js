import { formatCurrency, formatPercentage } from './utils.js';

/**
 * Render static equation with color-coded variables
 */
export function renderStaticEquation() {
  const container = document.getElementById('static-equation');
  if (!container) {
    console.error('Static equation container not found');
    return;
  }
  
  // Using MathJax with TeX notation for the static equation
  const equation = `
    $$\\color{#7a46ff}{r} = \\frac{\\color{#3c6ae5}{Div_t}\\color{#15803d}{(1 + g)}}{\\color{#b95b1d}{PV_t}} + \\color{#15803d}{g} = \\frac{\\color{#3c6ae5}{Div_{t+\\color{black}{1}}}}{\\color{#b95b1d}{PV_t}} + \\color{#15803d}{g}$$
  `;
  
  container.innerHTML = equation;
  
  // Typeset the equation with MathJax
  if (window.MathJax) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, container]);
  }
}

/**
 * Render dynamic equation with actual numerical values
 */
export function renderDynamicEquation(calculations, params) {
  const container = document.getElementById('dynamic-equation');
  if (!container) {
    console.error('Dynamic equation container not found');
    return;
  }
  
  const { requiredReturn, d1, dividendYield } = calculations;
  const { marketPrice, currentDividend, growthRate } = params;
  
  // Format values for display
  const rFormatted = formatPercentage(requiredReturn);
  const d1Formatted = formatCurrency(d1);
  const d0Formatted = formatCurrency(currentDividend);
  const p0Formatted = formatCurrency(marketPrice);
  const gFormatted = formatPercentage(growthRate);
  const gDecimal = (growthRate / 100).toFixed(4);
  
  // Using MathJax with TeX notation for the dynamic equation with numerical values
  const equation = `
    $$\\color{#7a46ff}{r} = \\frac{\\color{#3c6ae5}{${d0Formatted}}\\color{#15803d}{(1 + ${gDecimal})}}{\\color{#b95b1d}{${p0Formatted}}} + \\color{#15803d}{${gFormatted}} = \\frac{\\color{#3c6ae5}{${d1Formatted}}}{\\color{#b95b1d}{${p0Formatted}}} + \\color{#15803d}{${gFormatted}} = \\color{#7a46ff}{${rFormatted}}$$
  `;
  
  container.innerHTML = equation;
  
  // Typeset the equation with MathJax
  if (window.MathJax) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, container]);
  }
  
  // Screen reader announcement
  const announcement = `Required return equals ${rFormatted}. ` +
    `Calculated as: current dividend ${d0Formatted} times 1 plus growth rate ${gFormatted}, ` +
    `divided by current price ${p0Formatted}, plus growth rate ${gFormatted}. ` +
    `This equals next year's dividend ${d1Formatted} divided by current price ${p0Formatted}, ` +
    `plus growth rate ${gFormatted}, which equals ${rFormatted}.`;
  
  let liveRegion = document.getElementById('equation-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'equation-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = announcement;
}