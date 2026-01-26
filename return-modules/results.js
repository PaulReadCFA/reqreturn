import { formatPercentage, createElement } from './utils.js';

export function renderResults(calculations, params) {
  const container = document.getElementById('results-content');
  if (!container) {
    console.error('Results container not found');
    return;
  }
  container.innerHTML = '';
  
  const returnBox = createRequiredReturnBox(calculations);
  container.appendChild(returnBox);
}

function createRequiredReturnBox(calculations) {
  const box = createElement('div', { className: 'result-box required-return' });
  
  // Add title
  const title = createElement('h5', { className: 'result-title required-return' }, 'Required Return');
  box.appendChild(title);
  
  const valueContainer = createElement('div', { className: 'result-value', style: 'text-align: center;' });
  const returnValue = createElement('div', {
    'role': 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    'aria-label': 'Required return',
    'style': 'font-size: 2rem; font-weight: 700; padding: 1rem 0;'
  }, formatPercentage(calculations.requiredReturn));
  valueContainer.appendChild(returnValue);
  box.appendChild(valueContainer);
  
  return box;
}