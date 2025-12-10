import { $, formatCurrency, formatPercentage, announceToScreenReader } from './utils.js';

export function renderTable(cashFlows, requiredReturn) {
  const table = $('#cash-flow-table');
  if (!table) {
    console.error('Table element not found');
    return;
  }

  let html = `
    <caption class="sr-only">
      Required return projection schedule showing year, required return, dividend payment,
      investment, and total cash flows.
    </caption>
    <thead>
      <tr>
        <th scope="col" class="text-left">Year</th>
        <th scope="col" class="text-right">Required Return <span style="color: #3c6ae5;">(r)</span></th>
        <th scope="col" class="text-right">Dividend <span style="color: #15803d;">(D)</span></th>
        <th scope="col" class="text-right">Investment <span style="color: #b95b1d;">(P₀)</span></th>
        <th scope="col" class="text-right">Total Cash Flow</th>
        <th scope="col" class="text-right">Cumulative</th>
      </tr>
    </thead>
    <tbody>`;

  cashFlows.forEach((cf, index) => {
    const isInitial = index === 0;
    html += `
      <tr>
        <td class="text-left">${cf.year}</td>
        <td class="text-right" style="color: #3c6ae5;" data-tooltip="Constant required return" tabindex="0">${formatPercentage(requiredReturn)}</td>
        <td class="text-right" style="color: #15803d;" data-tooltip="${isInitial ? 'No dividend in year 0' : 'Dividend = D₀ × (1 + g)^' + cf.year}" tabindex="0">${formatCurrency(cf.dividend)}</td>
        <td class="text-right" style="color: #b95b1d;" data-tooltip="${isInitial ? 'Initial stock purchase (negative cash flow)' : 'No additional investment'}" tabindex="0">${formatCurrency(cf.investment)}</td>
        <td class="text-right" tabindex="0" data-tooltip="${isInitial ? 'Investment paid' : 'Dividend received'}"><strong>${formatCurrency(cf.totalCashFlow)}</strong></td>
        <td class="text-right" tabindex="0" data-tooltip="Running total"><strong>${formatCurrency(cf.cumulativeCashFlow)}</strong></td>
      </tr>`;
  });

  html += `</tbody>`;
  table.innerHTML = html;
  table.setAttribute('aria-label', 'Required return projection table. Press Escape to exit table.');
  announceToScreenReader('Table view loaded with required return projections.');
  setupTableKeyboardEscape();
}

function setupTableKeyboardEscape() {
  const table = document.getElementById('cash-flow-table');
  if (!table) return;
  if (table._escapeListener) {
    table.removeEventListener('keydown', table._escapeListener);
  }
  const escapeListener = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      const calculator = document.getElementById('calculator');
      if (calculator) {
        calculator.focus();
        announceToScreenReader('Exited table, moved to calculator section');
      }
    }
  };
  table._escapeListener = escapeListener;
  table.addEventListener('keydown', escapeListener);
}
