import { formatCurrency, formatPercentage, createElement } from './utils.js';

export function renderResults(calculations, params) {
  const container = document.getElementById('results-content');
  if (!container) {
    console.error('Results container not found');
    return;
  }
  container.innerHTML = '';
  
  const returnBox = createRequiredReturnBox(calculations);
  container.appendChild(returnBox);
  
  const infoBox = createModelInfoBox(calculations, params);
  container.appendChild(infoBox);
}

function createRequiredReturnBox(calculations) {
  const box = createElement('div', { className: 'result-box required-return' });
  const title = createElement('h5', { className: 'result-title required-return' }, 'Required Return');
  box.appendChild(title);
  
  const valueContainer = createElement('div', { className: 'result-value' });
  const returnValue = createElement('div', {
    'aria-live': 'polite',
    'aria-atomic': 'true'
  }, formatPercentage(calculations.requiredReturn));
  valueContainer.appendChild(returnValue);
  box.appendChild(valueContainer);
  
  const description = createElement('div', { className: 'result-description' }, 'The return investors demand');
  box.appendChild(description);
  
  const info = createElement('div', { className: 'result-secondary', style: 'margin-top: 0.5rem;' });
  info.innerHTML = `Formula: r = (D₁ / P₀) + g<br><small>Next dividend (D₁): ${formatCurrency(calculations.d1)}</small>`;
  box.appendChild(info);
  
  return box;
}

function createModelInfoBox(calculations, params) {
  const box = createElement('div', { className: 'result-box model-info' });
  const title = createElement('h5', { className: 'result-title model-info' }, 'Gordon Growth Model');
  box.appendChild(title);
  
  const content = createElement('div', { className: 'analysis-content', 'role': 'region', 'aria-labelledby': 'model-info-heading' });
  title.id = 'model-info-heading';
  
  const list = createElement('ul', { className: 'model-info-list' });
  const items = [
    { label: 'Dividend yield', value: formatPercentage(calculations.dividendYield) },
    { label: 'Growth rate', value: formatPercentage(params.growthRate) },
    { label: 'Required return', value: formatPercentage(calculations.requiredReturn) }
  ];
  
  items.forEach(item => {
    const li = createElement('li');
    li.innerHTML = `<strong>${item.label}:</strong> ${item.value}`;
    list.appendChild(li);
  });
  
  content.appendChild(list);
  box.appendChild(content);
  return box;
}