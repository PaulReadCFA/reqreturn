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
        <th scope="col" class="text-right">Dividend <span style="color: #3c6ae5;">(Div<sub>t</sub>)</span></th>
        <th scope="col" class="text-right">Investment <span style="color: #b95b1d;">(PV<sub>t</sub>)</span></th>
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
        <td class="text-right" style="color: #7a46ff;">${formatPercentage(requiredReturn)}</td>
        <td class="text-right" style="color: #3c6ae5;">${formatCurrency(cf.dividend)}</td>
        <td class="text-right" style="color: #b95b1d;">${formatCurrency(cf.investment)}</td>
        <td class="text-right"><strong>${formatCurrency(cf.totalCashFlow)}</strong></td>
        <td class="text-right"><strong>${formatCurrency(cf.cumulativeCashFlow)}</strong></td>
      </tr>`;
  });

  html += `</tbody>`;
  table.innerHTML = html;
  table.setAttribute('aria-label', 'Required return projection table');
  announceToScreenReader('Table view loaded with required return projections.');
}