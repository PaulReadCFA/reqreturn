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
        <th scope="col" class="text-right">Required Return <span style="color: #7a46ff;">(r)</span></th>
        <th scope="col" class="text-right">Dividend (USD) <span style="color: #2d59c4;">(Div<sub>t</sub>)</span></th>
        <th scope="col" class="text-right">Initial investment / Market price (USD) <span style="color: #a84f15;">(PV<sub>t</sub>)</span></th>
        <th scope="col" class="text-right">Total Cash Flow (USD)</th>
        <th scope="col" class="text-right">Cumulative (USD)</th>
      </tr>
    </thead>
    <tbody>`;

  // Helper to format currency without $ sign
  const formatUSD = (value) => {
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return value < 0 ? `−${formatted}` : formatted;
  };

  cashFlows.forEach((cf, index) => {
    const isInitial = index === 0;
    html += `
      <tr>
        <td class="text-left">${cf.year}</td>
        <td class="text-right" style="color: #7a46ff;">${formatPercentage(requiredReturn)}</td>
        <td class="text-right" style="color: #2d59c4;">${formatUSD(cf.dividend)}</td>
        <td class="text-right" style="color: #a84f15;">${formatUSD(cf.investment)}</td>
        <td class="text-right"><strong>${formatUSD(cf.totalCashFlow)}</strong></td>
        <td class="text-right"><strong>${formatUSD(cf.cumulativeCashFlow)}</strong></td>
      </tr>`;
  });

  html += `</tbody>`;
  table.innerHTML = html;
  table.setAttribute('aria-label', 'Required return projection table');
  announceToScreenReader('Table view loaded with required return projections.');
}