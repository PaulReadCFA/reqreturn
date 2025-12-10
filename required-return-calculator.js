/**
 * Required Return Calculator - Main Entry Point
 * CFA Institute - Vanilla JavaScript Implementation
 * 
 * This calculator demonstrates required return calculations using the
 * Gordon Growth Model: r = (D₁ / P₀) + g
 * Built with accessibility (WCAG 2.1 AA) and maintainability in mind.
 */

import { state, setState, subscribe } from './return-modules/state.js';
import { calculateRequiredReturnMetrics } from './return-modules/calculations.js';
import { 
  validateAllInputs, 
  validateField, 
  updateFieldError, 
  updateValidationSummary,
  hasErrors 
} from './return-modules/validation.js';
import { 
  $, 
  listen, 
  focusElement, 
  announceToScreenReader,
  debounce
} from './return-modules/utils.js';
import { renderChart, shouldShowLabels, destroyChart } from './return-modules/chart.js';
import { renderTable } from './return-modules/table.js';
import { renderResults } from './return-modules/results.js';
import { renderDynamicEquation } from './return-modules/equation.js';

// =============================================================================
// INITIALIZATION
// =============================================================================

function init() {
  console.log('Required Return Calculator initializing...');
  
  setupInputListeners();
  setupViewToggle();
  setupSkipLinks();
  setupResizeListener();
  subscribe(handleStateChange);
  updateCalculations();
  runSelfTests();
  
  console.log('Required Return Calculator ready');
}

function setupSkipLinks() {
  const skipToVisualizer = document.querySelector('a[href="#visualizer"]');
  
  if (skipToVisualizer) {
    listen(skipToVisualizer, 'click', (e) => {
      e.preventDefault();
      switchView('table');
      const section = $('#visualizer');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setTimeout(() => {
        const table = $('#cash-flow-table');
        if (table) table.focus();
      }, 400);
    });
  }
}

// =============================================================================
// INPUT HANDLING
// =============================================================================

function setupInputListeners() {
  const inputs = [
    { id: 'market-price', field: 'marketPrice' },
    { id: 'current-dividend', field: 'currentDividend' },
    { id: 'growth-rate', field: 'growthRate' }
  ];
  
  inputs.forEach(({ id, field }) => {
    const input = $(`#${id}`);
    if (!input) return;
    
    const debouncedUpdate = debounce(() => {
      const value = parseFloat(input.value);
      const error = validateField(field, value);
      updateFieldError(id, error);
      
      const errors = { ...state.errors };
      if (error) {
        errors[field] = error;
      } else {
        delete errors[field];
      }
      
      setState({ [field]: value, errors });
      updateValidationSummary(errors);
      
      if (!hasErrors(errors)) {
        updateCalculations();
      }
    }, 300);
    
    listen(input, 'input', debouncedUpdate);
    listen(input, 'change', debouncedUpdate);
  });
}

function updateCalculations() {
  const { marketPrice, currentDividend, growthRate, errors } = state;
  
  if (hasErrors(errors)) {
    setState({ returnCalculations: null });
    return;
  }
  
  try {
    const calculations = calculateRequiredReturnMetrics({
      marketPrice,
      currentDividend,
      growthRate
    });
    
    setState({ returnCalculations: calculations });
  } catch (error) {
    console.error('Calculation error:', error);
    setState({ returnCalculations: null });
  }
}

// =============================================================================
// VIEW TOGGLE
// =============================================================================

function setupViewToggle() {
  const chartBtn = $('#chart-view-btn');
  const tableBtn = $('#table-view-btn');
  
  if (!chartBtn || !tableBtn) {
    console.error('Toggle buttons not found');
    return;
  }
  
  listen(chartBtn, 'click', () => switchView('chart'));
  listen(tableBtn, 'click', () => switchView('table'));
}

function switchView(view) {
  const chartBtn = $('#chart-view-btn');
  const tableBtn = $('#table-view-btn');
  const chartContainer = $('#chart-container');
  const tableContainer = $('#table-container');
  const legend = $('#chart-legend');
  
  setState({ viewMode: view });
  
  if (view === 'chart') {
    chartBtn.classList.add('active');
    chartBtn.setAttribute('aria-pressed', 'true');
    tableBtn.classList.remove('active');
    tableBtn.setAttribute('aria-pressed', 'false');
    
    chartContainer.style.display = 'block';
    tableContainer.style.display = 'none';
    legend.style.display = 'flex';
    
    announceToScreenReader('Chart view active');
    focusElement(chartContainer, 100);
  } else {
    tableBtn.classList.add('active');
    tableBtn.setAttribute('aria-pressed', 'true');
    chartBtn.classList.remove('active');
    chartBtn.setAttribute('aria-pressed', 'false');
    
    tableContainer.style.display = 'block';
    chartContainer.style.display = 'none';
    legend.style.display = 'none';
    
    announceToScreenReader('Table view active');
    focusElement($('#cash-flow-table'), 100);
  }
}

// =============================================================================
// RENDERING
// =============================================================================

function handleStateChange(newState) {
  const { returnCalculations, viewMode } = newState;
  
  if (!returnCalculations) return;
  
  renderResults(returnCalculations, {
    marketPrice: newState.marketPrice,
    currentDividend: newState.currentDividend,
    growthRate: newState.growthRate
  });
  
  renderDynamicEquation(returnCalculations, {
    marketPrice: newState.marketPrice,
    currentDividend: newState.currentDividend,
    growthRate: newState.growthRate
  });
  
  if (viewMode === 'chart') {
    const showLabels = shouldShowLabels();
    renderChart(returnCalculations.cashFlows, showLabels, returnCalculations.requiredReturn);
  }
  
  renderTable(returnCalculations.cashFlows, returnCalculations.requiredReturn);
}

// =============================================================================
// WINDOW RESIZE
// =============================================================================

function setupResizeListener() {
  let resizeTimeout;
  
  listen(window, 'resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      handleResponsiveView();
      
      if (state.viewMode === 'chart' && state.returnCalculations) {
        const showLabels = shouldShowLabels();
        renderChart(state.returnCalculations.cashFlows, showLabels, state.returnCalculations.requiredReturn);
      }
    }, 250);
  });
  
  handleResponsiveView();
}

function handleResponsiveView() {
  const chartBtn = $('#chart-view-btn');
  const tableBtn = $('#table-view-btn');
  const viewportWidth = window.innerWidth;
  
  if (viewportWidth < 600) {
    if (state.viewMode === 'chart') {
      switchView('table');
    }
    
    if (chartBtn) {
      chartBtn.disabled = true;
      chartBtn.setAttribute('aria-disabled', 'true');
      chartBtn.title = 'Chart view not available at this screen size';
    }
    if (tableBtn) {
      tableBtn.disabled = false;
      tableBtn.removeAttribute('aria-disabled');
      tableBtn.title = '';
    }
  } else {
    if (chartBtn) {
      chartBtn.disabled = false;
      chartBtn.removeAttribute('aria-disabled');
      chartBtn.title = '';
    }
  }
}

// =============================================================================
// SELF-TESTS
// =============================================================================

function runSelfTests() {
  console.log('Running self-tests...');
  
  const tests = [
    {
      name: 'Basic required return calculation',
      inputs: { marketPrice: 50, currentDividend: 2, growthRate: 5 },
      expected: { returnApprox: 9.2 } // (2*1.05)/50 + 0.05 = 0.042 + 0.05 = 0.092
    },
    {
      name: 'Higher growth rate',
      inputs: { marketPrice: 100, currentDividend: 3, growthRate: 8 },
      expected: { returnApprox: 11.24 } // (3*1.08)/100 + 0.08 = 0.0324 + 0.08 = 0.1124
    }
  ];
  
  tests.forEach(test => {
    try {
      const result = calculateRequiredReturnMetrics(test.inputs);
      
      if (test.expected.returnApprox !== undefined) {
        const diff = Math.abs(result.requiredReturn - test.expected.returnApprox);
        if (diff <= 0.1) {
          console.log(`✓ ${test.name} passed`);
        } else {
          console.warn(`✗ ${test.name} failed: expected ~${test.expected.returnApprox}%, got ${result.requiredReturn.toFixed(2)}%`);
        }
      }
    } catch (error) {
      console.error(`✗ ${test.name} threw error:`, error);
    }
  });
  
  console.log('Self-tests complete');
}

// =============================================================================
// CLEANUP
// =============================================================================

function cleanup() {
  destroyChart();
  console.log('Calculator cleanup complete');
}

window.addEventListener('beforeunload', cleanup);

// =============================================================================
// START
// =============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { state, setState, updateCalculations };
