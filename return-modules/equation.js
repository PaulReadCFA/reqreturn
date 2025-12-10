import { formatCurrency, formatPercentage } from './utils.js';

export function renderDynamicEquation(calculations, params) {
  const container = document.getElementById('dynamic-mathml-equation');
  if (!container) {
    console.error('Dynamic equation container not found');
    return;
  }
  
  const { requiredReturn, d1, dividendYield } = calculations;
  const { marketPrice, growthRate } = params;
  
  const rFormatted = formatPercentage(requiredReturn);
  const d1Formatted = formatCurrency(d1);
  const p0Formatted = formatCurrency(marketPrice);
  const gFormatted = formatPercentage(growthRate);
  const yieldFormatted = formatPercentage(dividendYield);
  
  const mathML = `
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mrow>
        <msub>
          <mi mathcolor="#3c6ae5">r</mi>
          <mtext mathcolor="#3c6ae5">required</mtext>
        </msub>
        <mo>=</mo>
        <mfrac linethickness="1.2px">
          <msub>
            <mi mathvariant="bold" mathcolor="#15803d">D</mi>
            <mn mathcolor="#15803d">1</mn>
          </msub>
          <msub>
            <mi mathvariant="bold" mathcolor="#b95b1d">P</mi>
            <mn mathcolor="#b95b1d">0</mn>
          </msub>
        </mfrac>
        <mo>+</mo>
        <mi mathcolor="#15803d">g</mi>
        <mo>=</mo>
        <mfrac linethickness="1.2px">
          <mtext mathvariant="bold" mathcolor="#15803d">${d1Formatted}</mtext>
          <mtext mathvariant="bold" mathcolor="#b95b1d">${p0Formatted}</mtext>
        </mfrac>
        <mo>+</mo>
        <mtext mathcolor="#15803d">${gFormatted}</mtext>
        <mo>=</mo>
        <mtext mathcolor="#3c6ae5" mathvariant="bold">${rFormatted}</mtext>
      </mrow>
    </math>
    <div style="text-align: center; margin-top: 0.5rem; font-size: 0.875rem; color: #374151;">
      <div>Dividend yield: ${yieldFormatted} + Growth rate: ${gFormatted} = Required return: ${rFormatted}</div>
    </div>
  `;
  
  container.innerHTML = mathML;
  
  const announcement = `Required return equals ${rFormatted}. ` +
    `Calculated as: next year's dividend ${d1Formatted} divided by current market price ${p0Formatted}, ` +
    `plus growth rate ${gFormatted}.`;
  
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
