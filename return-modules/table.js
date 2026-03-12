import { $, formatPercentage, announceToScreenReader } from './utils.js';

export function renderTable(cashFlows, requiredReturn) {
  const table = $('#cash-flow-table');
  if (!table) { console.error('Table element not found'); return; }

  // Helper to format as USD (no space between prefix and value)
  const formatUSD = (value) => {
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value < 0 ? `\u2212${formatted}` : formatted;
  };

  let html = `
    <caption class="sr-only">
      Required return projection schedule showing year, required return, dividend payment,
      investment, and total cash flows.
    </caption>
    <thead>
      <tr>
        <th scope="col" class="text-left">Year</th>
        <th scope="col" class="text-right">Required Return <span style="color: #6b35e8;">(<i>r</i>)</span></th>
        <th scope="col" class="text-right">Dividend (USD) <span style="color: #2d59c4;">(Div<sub><i>t</i></sub>)</span></th>
        <th scope="col" class="text-right">Initial investment / Market price (USD) <span style="color: #a84f15;">(PV<sub><i>t</i></sub>)</span></th>
        <th scope="col" class="text-right">Total Cash Flow (USD)</th>
        <th scope="col" class="text-right">Cumulative (USD)</th>
      </tr>
    </thead>
    <tbody>`;

  cashFlows.forEach((cf) => {
    html += `
      <tr>
        <td class="text-left">${cf.year}</td>
        <td class="text-right" style="color: #6b35e8;">${formatPercentage(requiredReturn)}</td>
        <td class="text-right" style="color: #2d59c4;">${formatUSD(cf.dividend)}</td>
        <td class="text-right" style="color: #a84f15;">${formatUSD(cf.investment)}</td>
        <td class="text-right"><strong>${formatUSD(cf.totalCashFlow)}</strong></td>
        <td class="text-right"><strong>${formatUSD(cf.cumulativeCashFlow)}</strong></td>
      </tr>`;
  });

  html += `</tbody>`;
  table.innerHTML = html;
  table.setAttribute('aria-label', 'Required return projection table');

  // Add note below table
  const tableContainer = document.getElementById('table-container');
  let note = tableContainer.querySelector('.table-indefinitely-note');
  if (!note) {
    note = document.createElement('p');
    note.className = 'table-indefinitely-note';
    note.style.cssText = 'font-size: 0.8125rem; color: #6b7280; font-style: italic; margin: 0.5rem 0.75rem 0.5rem; padding-bottom: 0.25rem;';
    tableContainer.appendChild(note);
  }
  note.textContent = 'Dividend stream continues indefinitely; first 10 years shown.';

  announceToScreenReader('Table view loaded with required return projections.');
}