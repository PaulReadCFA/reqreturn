import { formatPercentage, createElement } from './utils.js';

export function renderResults(calculations, params) {
  const container = document.getElementById('results-content');
  if (!container) { console.error('Results container not found'); return; }
  container.innerHTML = '';

  const returnBox = createRequiredReturnBox(calculations);
  container.appendChild(returnBox);
}

function createRequiredReturnBox(calculations) {
  const box = createElement('div', { className: 'result-box required-return' });

  // Title
  const title = createElement('h5', { className: 'result-title required-return' }, 'Implied Required Return');
  box.appendChild(title);

  // Value - no role="status" / aria-atomic to avoid redundant announcements
  // (the equation live region already announces value changes)
  const valueContainer = createElement('div', { className: 'result-value' });
  const returnValue = createElement('div', {}, formatPercentage(calculations.requiredReturn));
  valueContainer.appendChild(returnValue);
  box.appendChild(valueContainer);

  return box;
}