import { formatPercentage, formatCurrencySpeech } from './utils.js';
import { renderEquation } from '../equation-render.js';

/**
 * Format a numeric value as USD currency string for equation display.
 * No space between "USD" and digits.
 */
function formatEquationUSD(value) {
  const absValue = Math.abs(value);
  return `USD${absValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Set equation content and typeset with MathJax. The shared mount holds the
 * card's height and hides the source MathML while MathJax works, so the cards
 * below stay put and raw markup is never visible.
 */
function setEquationContent(innerContainer, mathML) {
  renderEquation(innerContainer, mathML);
}

function buildStaticMathML() {
  return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
    <mrow>
      <mi mathcolor="#7A46FF">r</mi>
      <mo>=</mo>
      <mfrac>
        <mrow>
          <msub><mi mathcolor="#3C6AE5">Div</mi><mi>t</mi></msub>
          <mo>&#x2062;</mo>
          <mrow>
            <mo>(</mo><mn>1</mn><mo>+</mo><mi mathcolor="#07514F">g</mi><mo>)</mo>
          </mrow>
        </mrow>
        <msub><mi mathcolor="#B95B1D">PV</mi><mi>t</mi></msub>
      </mfrac>
      <mo>+</mo>
      <mi mathcolor="#07514F">g</mi>
      <mo>=</mo>
      <mfrac>
        <msub>
          <mi mathcolor="#3C6AE5">Div</mi>
          <mrow><mi>t</mi><mo>+</mo><mn>1</mn></mrow>
        </msub>
        <msub><mi mathcolor="#B95B1D">PV</mi><mi>t</mi></msub>
      </mfrac>
      <mo>+</mo>
      <mi mathcolor="#07514F">g</mi>
    </mrow>
  </math>`;
}

function buildDynamicMathML({
  currentDividend,
  d1,
  marketPrice,
  growthDecimal,
  returnDecimal,
  returnPercent,
}) {
  return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
    <mrow>
      <mi mathcolor="#7A46FF">r</mi>
      <mo>=</mo>
      <mfrac>
        <mrow>
          <mtext mathcolor="#3C6AE5">${currentDividend}</mtext>
          <mo>&#x2062;</mo>
          <mrow>
            <mo>(</mo><mn>1</mn><mo>+</mo>
            <mn mathcolor="#07514F">${growthDecimal}</mn><mo>)</mo>
          </mrow>
        </mrow>
        <mtext mathcolor="#B95B1D">${marketPrice}</mtext>
      </mfrac>
      <mo>+</mo>
      <mn mathcolor="#07514F">${growthDecimal}</mn>
      <mo>=</mo>
      <mfrac>
        <mtext mathcolor="#3C6AE5">${d1}</mtext>
        <mtext mathcolor="#B95B1D">${marketPrice}</mtext>
      </mfrac>
      <mo>+</mo>
      <mn mathcolor="#07514F">${growthDecimal}</mn>
      <mo>=</mo>
      <mn mathcolor="#7A46FF">${returnDecimal}</mn>
      <mo>=</mo>
      <mrow mathcolor="#7A46FF">
        <mn>${returnPercent}</mn><mo>%</mo>
      </mrow>
    </mrow>
  </math>`;
}

/**
 * Render static equation with color-coded variables.
 */
export function renderStaticEquation() {
  const container = document.getElementById('static-equation');
  if (!container) { console.error('Static equation container not found'); return; }

  container.innerHTML = buildStaticMathML();

  if (window.MathJax) {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub, container]);
  }
}

/**
 * Render dynamic equation with numerical values.
 * Uses opacity fade to prevent a source-equation flash.
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

  setEquationContent(container, buildDynamicMathML({
    currentDividend: d0Str,
    d1: d1Str,
    marketPrice: p0Str,
    growthDecimal: gDecimal,
    returnDecimal: rDecimal,
    returnPercent: rPercent,
  }));

  // Plain-text formatted values (used in both aria-label and live region)
  const gFormatted = formatPercentage(growthRate);
  const rFormatted = formatPercentage(requiredReturn);
  const d0Plain    = formatCurrencySpeech(currentDividend);
  const d1Plain    = formatCurrencySpeech(d1);
  const p0Plain    = formatCurrencySpeech(marketPrice);

  // Label the equation region, not the card: the card is named by its heading
  // via aria-labelledby, which wins over aria-label and would silently swallow
  // the result.
  const card = document.getElementById('dynamic-equation-container');
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