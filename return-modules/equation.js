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
    $$\\color{#7a46ff}{r} = \\frac{\\color{#3c6ae5}{Div_t}\\color{black}{(1 + }\\color{#15803d}{g}\\color{black}{)}}{\\color{#b95b1d}{PV_t}} + \\color{#15803d}{g} = \\frac{\\color{#3c6ae5}{Div_{t+\\color{black}{1}}}}{\\color{#b95b1d}{PV_t}} + \\color{#15803d}{g}$$
  `;
  
  container.innerHTML = equation;
  
  // Typeset the equation with MathJax
  if (window.MathJax) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, container]);
    
    // Use MutationObserver to remove tabindex as MathJax adds it
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if it's a MathJax element or contains them
            if (node.classList && node.classList.contains('MathJax')) {
              node.removeAttribute('tabindex');
            }
            // Also check children
            const mathJaxElements = node.querySelectorAll ? node.querySelectorAll('.MathJax') : [];
            mathJaxElements.forEach(el => el.removeAttribute('tabindex'));
          }
        });
      });
    });
    
    observer.observe(container, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex']
    });
    
    // Also remove immediately after typesetting
    MathJax.Hub.Queue(() => {
      const mathJaxElements = container.querySelectorAll('.MathJax');
      mathJaxElements.forEach(el => {
        el.removeAttribute('tabindex');
      });
      // Disconnect observer after cleanup
      setTimeout(() => observer.disconnect(), 1000);
    });
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
    $$\\color{#7a46ff}{r} = \\frac{\\color{#3c6ae5}{${d0Formatted}}\\color{black}{(1 + }\\color{#15803d}{${gDecimal}}\\color{black}{)}}{\\color{#b95b1d}{${p0Formatted}}} + \\color{#15803d}{${gFormatted}} = \\frac{\\color{#3c6ae5}{${d1Formatted}}}{\\color{#b95b1d}{${p0Formatted}}} + \\color{#15803d}{${gFormatted}} = \\color{#7a46ff}{${rFormatted}}$$
  `;
  
  container.innerHTML = equation;
  
  // Typeset the equation with MathJax
  if (window.MathJax) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, container]);
    
    // Use MutationObserver to remove tabindex as MathJax adds it
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if it's a MathJax element or contains them
            if (node.classList && node.classList.contains('MathJax')) {
              node.removeAttribute('tabindex');
            }
            // Also check children
            const mathJaxElements = node.querySelectorAll ? node.querySelectorAll('.MathJax') : [];
            mathJaxElements.forEach(el => el.removeAttribute('tabindex'));
          }
        });
      });
    });
    
    observer.observe(container, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex']
    });
    
    // Also remove immediately after typesetting
    MathJax.Hub.Queue(() => {
      const mathJaxElements = container.querySelectorAll('.MathJax');
      mathJaxElements.forEach(el => {
        el.removeAttribute('tabindex');
      });
      // Disconnect observer after cleanup
      setTimeout(() => observer.disconnect(), 1000);
    });
  }
  
  // Screen reader announcement (without $ signs to prevent MathJax processing)
  const d0Plain = d0Formatted.replace('$', '');
  const d1Plain = d1Formatted.replace('$', '');
  const p0Plain = p0Formatted.replace('$', '');
  
  const announcement = `Required return equals ${rFormatted}. ` +
    `Calculated as: current dividend ${d0Plain} dollars times 1 plus growth rate ${gFormatted}, ` +
    `divided by current price ${p0Plain} dollars, plus growth rate ${gFormatted}. ` +
    `This equals next year's dividend ${d1Plain} dollars divided by current price ${p0Plain} dollars, ` +
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