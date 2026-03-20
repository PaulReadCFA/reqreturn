import { formatPercentage } from './utils.js';

/**
 * Format a numeric value as USD currency string for equation display.
 * No space between "USD" and digits (USD functions as currency symbol).
 */
function formatEquationUSD(value) {
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  // \text{USD} keeps USD upright (non-italic) inside MathJax math mode
  return `\\text{USD}${formatted}`;
}

/** Check user preference for reduced motion. */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Set equation content and typeset with MathJax.
 * Snaps instantly to opacity:0 before setting innerHTML so raw TeX is
 * never painted. Fades back in after MathJax finishes (EE04 blank behaviour).
 */
function setEquationContent(innerContainer, latexString) {
  const outerContainer = document.getElementById('dynamic-equation-container');
  const reduceMotion = prefersReducedMotion();

  if (outerContainer) {
    // Disable transition so the hide is instant — raw TeX never visible
    outerContainer.style.transition = 'none';
    outerContainer.style.opacity = '0';
  }

  // Swap content while hidden
  innerContainer.innerHTML = latexString;

  if (window.MathJax) {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub, innerContainer]);
    MathJax.Hub.Queue(() => {
      innerContainer.querySelectorAll('.MathJax').forEach(el => el.removeAttribute('tabindex'));
      if (outerContainer) {
        // Re-enable transition for the fade-in only (skip if reduced motion)
        outerContainer.style.transition = reduceMotion ? 'none' : 'opacity 0.15s ease';
        outerContainer.style.opacity = '1';
      }
    });
  } else {
    if (outerContainer) {
      outerContainer.style.transition = reduceMotion ? 'none' : 'opacity 0.15s ease';
      outerContainer.style.opacity = '1';
    }
  }
}

/**
 * Render static equation with color-coded variables.
 * - All + signs explicitly \color{black}
 * - \; medium spaces on either side of + in numerator and between terms
 */
export function renderStaticEquation() {
  const container = document.getElementById('static-equation');
  if (!container) { console.error('Static equation container not found'); return; }

  const equation = `$$\\color{#6b35e8}{r} = \\frac{\\color{#3c6ae5}{Div_t} \\color{black}{\\;(1 \\;+\\; } \\color{#15803d}{g} \\color{black}{)}}{\\color{#b95b1d}{PV_t}} \\color{black}{\\;+\\;} \\color{#15803d}{g} = \\frac{\\color{#3c6ae5}{Div_{t\\color{black}{+1}}}}{\\color{#b95b1d}{PV_t}} \\color{black}{\\;+\\;} \\color{#15803d}{g}$$`;

  container.innerHTML = equation;

  if (window.MathJax) {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub, container]);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('MathJax')) node.removeAttribute('tabindex');
            (node.querySelectorAll ? node.querySelectorAll('.MathJax') : [])
              .forEach(el => el.removeAttribute('tabindex'));
          }
        });
      });
    });
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['tabindex'] });

    MathJax.Hub.Queue(() => {
      container.querySelectorAll('.MathJax').forEach(el => el.removeAttribute('tabindex'));
      setTimeout(() => observer.disconnect(), 1000);
    });
  }
}

/**
 * Render dynamic equation with numerical values.
 * Uses opacity fade to prevent raw TeX flash.
 */
export function renderDynamicEquation(calculations, params) {
  const container = document.getElementById('dynamic-equation');
  if (!container) { console.error('Dynamic equation container not found'); return; }

  const { requiredReturn, d1 } = calculations;
  const { marketPrice, currentDividend, growthRate } = params;

  const rDecimal   = (requiredReturn / 100).toFixed(4);
  const rPercent   = requiredReturn.toFixed(2);
  const d1Str      = formatEquationUSD(d1);
  const d0Str      = formatEquationUSD(currentDividend);
  const p0Str      = formatEquationUSD(marketPrice);
  const gDecimal   = (growthRate / 100).toFixed(4);

  // Explicit \color{black} on every + sign; \; spacing around +
  const equation = `$$\\color{#6b35e8}{r} = \\frac{\\color{#3c6ae5}{${d0Str}} \\color{black}{\\;(1 \\;+\\; } \\color{#15803d}{${gDecimal}} \\color{black}{)}}{\\color{#b95b1d}{${p0Str}}} \\color{black}{\\;+\\;} \\color{#15803d}{${gDecimal}} = \\frac{\\color{#3c6ae5}{${d1Str}}}{\\color{#b95b1d}{${p0Str}}} \\color{black}{\\;+\\;} \\color{#15803d}{${gDecimal}} = \\color{#6b35e8}{${rDecimal}} = \\color{#6b35e8}{${rPercent}\\%}$$`;

  // Fade outer container, update inner, restore after MathJax renders
  setEquationContent(container, equation);

  // Plain-text formatted values (used in both aria-label and live region)
  const gFormatted = formatPercentage(growthRate);
  const rFormatted = formatPercentage(requiredReturn);
  const d0Plain    = `USD ${currentDividend.toFixed(2)}`;
  const d1Plain    = `USD ${d1.toFixed(2)}`;
  const p0Plain    = `USD ${marketPrice.toFixed(2)}`;

  // Update the section's aria-label so SR users hear the result immediately
  // on first load and on every recalculation, without needing to trigger a change
  const card = document.getElementById('dynamic-equation-card');
  if (card) {
    const label =
      `Implied Required Return Equation. ` +
      `r = ${rPercent}%. ` +
      `Calculated as: current dividend ${d0Plain} ` +
      `times 1 plus growth rate ${gFormatted}, ` +
      `divided by current price ${p0Plain}, ` +
      `plus growth rate ${gFormatted}. ` +
      `Result: ${rFormatted}.`;
    card.setAttribute('aria-label', label);
  }

  // Screen reader announcement (plain text)

  const announcement =
    `Required return equals ${rFormatted}. ` +
    `Calculated as: current dividend ${d0Plain} times 1 plus growth rate ${gFormatted}, ` +
    `divided by current price ${p0Plain}, plus growth rate ${gFormatted}. ` +
    `This equals next year's dividend ${d1Plain} divided by current price ${p0Plain}, ` +
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