import { $, formatPercentage, announceToScreenReader } from './utils.js';
import { applyTableRoles } from '../table-roles.js';

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
        <th scope="col" class="text-right table-var-3">Required return (𝑟)</th>
        <th scope="col" class="text-right table-var-2">Dividend (Div<sub>𝑡</sub>) (USD)</th>
        <th scope="col" class="text-right table-var-6">Initial investment / Market price (PV<sub>𝑡</sub>) (USD)</th>
        <th scope="col" class="text-right">Total Cash Flow (USD)</th>
        <th scope="col" class="text-right">Cumulative (USD)</th>
      </tr>
    </thead>
    <tbody>`;

  // data-label mirrors the column header: it becomes the visible label when the
  // shared base reflows each row into a card below 768px. cell-value keeps the
  // value as a single element so it stays on the right of that label.
  cashFlows.forEach((cf) => {
    html += `
      <tr>
        <th scope="row" class="text-left" data-label="Year">${cf.year}</th>
        <td class="text-right" data-label="Required return (𝑟)"><span class="cell-value table-var-3">${formatPercentage(requiredReturn)}</span></td>
        <td class="text-right" data-label="Dividend (Div𝑡) (USD)"><span class="cell-value table-var-2">${formatUSD(cf.dividend)}</span></td>
        <td class="text-right" data-label="Initial investment / Market price (PV𝑡) (USD)"><span class="cell-value table-var-6">${formatUSD(cf.investment)}</span></td>
        <td class="text-right" data-label="Total Cash Flow (USD)"><span class="cell-value"><strong>${formatUSD(cf.totalCashFlow)}</strong></span></td>
        <td class="text-right" data-label="Cumulative (USD)"><span class="cell-value"><strong>${formatUSD(cf.cumulativeCashFlow)}</strong></span></td>
      </tr>`;
  });

  html += `</tbody>`;
  table.innerHTML = html;
  applyTableRoles(table);

  announceToScreenReader('Table view loaded with required return projections.');
}