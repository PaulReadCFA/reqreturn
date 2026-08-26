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
  debounce,
  initializeStaticEquation,
  clampNumericInputLength,
  NUMERIC_INPUT_MAX_CHARS
} from './return-modules/utils.js';
import { renderChart, shouldShowLabels, destroyChart } from './return-modules/chart.js';
import { renderTable } from './return-modules/table.js';
import { renderResults } from './return-modules/results.js';
import { renderDynamicEquation, renderStaticEquation } from './return-modules/equation.js';
import { allFinite } from './validation-ui.js';
import {
  applyChartTableVisibility,
  updateToggleButtonStates,
  announceView,
  VIEW_ANNOUNCEMENTS,
} from './view-toggle.js';

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
  const skipToTable = document.querySelector('a[href="#cash-flow-table"]');
  
  if (skipToTable) {
    listen(skipToTable, 'click', (e) => {
      e.preventDefault();
      
      // Click the table button to switch to table view
      const tableBtn = $('#table-view-btn');
      if (tableBtn) {
        tableBtn.click(); // Switch to table view
        
        // Focus the table button
        // Next tab will wrap to top (expected - no more interactive elements)
        // Screen reader users can use table navigation (Ctrl+Alt+Arrow keys) to explore table
        setTimeout(() => tableBtn.focus(), 100);
      }
      
      // Scroll to visualizer section
      const section = $('#visualizer');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
      } else {
        setState({ returnCalculations: null });
      }
    }, 300);
    
    const onInput = () => {
      clampNumericInputLength(input, NUMERIC_INPUT_MAX_CHARS);
      debouncedUpdate();
    };
    listen(input, 'input', onInput);
    listen(input, 'change', onInput);
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
    if (!allFinite(calculations.requiredReturn)) {
      setState({ returnCalculations: null });
      return;
    }
    
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
  
  // Click handlers - clicking moves focus to content
  listen(chartBtn, 'click', () => switchView('chart', true));
  listen(tableBtn, 'click', () => switchView('table', true));
  
  // Arrow key navigation
  [chartBtn, tableBtn].forEach(btn => {
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        
        // Toggle between buttons
        const next = btn === chartBtn ? tableBtn : chartBtn;
        const newView = next === chartBtn ? 'chart' : 'table';
        
        // Switch view WITHOUT moving focus to content
        switchView(newView, false);
        
        // Keep focus on the button
        next.focus();
      }
      
      // Enter/Space on chart button moves focus to canvas
      if (btn === chartBtn && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        
        // Ensure chart view is active and move focus to canvas
        switchView('chart', true);
      }
    });
  });
}

function switchView(view, moveFocus = false) {
  const chartBtn = $('#chart-view-btn');
  const tableBtn = $('#table-view-btn');
  const chartContainer = $('#chart-container');
  const tableContainer = $('#table-container');
  const legend = $('#chart-legend');
  
  const changed = state.viewMode !== view;
  setState({ viewMode: view });
  const forceTable = window.innerWidth < 600;
  updateToggleButtonStates({ chartBtn, tableBtn, showingChart: view === 'chart', forceTable });
  applyChartTableVisibility({
    chartEl: chartContainer,
    tableEl: tableContainer,
    canvas: $('#return-chart'),
    showChart: view === 'chart',
  });
  const chartPointAnnouncement = $('#chart-point-announcement');
  if (chartPointAnnouncement) {
    if (view === 'chart') {
      chartPointAnnouncement.textContent = '';
      chartPointAnnouncement.removeAttribute('aria-hidden');
    } else {
      chartPointAnnouncement.setAttribute('aria-hidden', 'true');
      chartPointAnnouncement.textContent = '';
    }
  }

  if (view === 'chart') {
    if (legend) legend.style.display = 'flex';
    // Only move focus to content if requested (e.g., from click or Enter key)
    if (moveFocus) {
      setTimeout(() => {
        const canvas = $('#return-chart');
        if (canvas) {
          canvas.focus();
        }
      }, 100);
    }
  } else {
    if (legend) legend.style.display = 'none';
    // Don't focus anything - let tab order continue naturally
    // The table is already in the DOM and screen readers can navigate it
  }
  if (changed) announceView(VIEW_ANNOUNCEMENTS[view]);
}

// =============================================================================
// RENDERING
// =============================================================================

function handleStateChange(newState) {
  const { returnCalculations, viewMode } = newState;
  
  if (!returnCalculations) {
    clearCalculatedViews();
    return;
  }
  
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

function clearCalculatedViews() {
  destroyChart();
  const results = $('#results-content');
  if (results) results.innerHTML = '';
  const equation = $('#dynamic-mathml-equation');
  if (equation) equation.innerHTML = '';
  const table = $('#cash-flow-table');
  if (table) table.innerHTML = '';
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
  const helper = $('#chart-helper-text');
  const viewportWidth = window.innerWidth;
  
  if (viewportWidth < 600) {
    if (state.viewMode === 'chart') {
      switchView('table', false);  // Don't move focus on automatic resize
    }
    
    if (chartBtn) {
      chartBtn.disabled = true;
      chartBtn.setAttribute('aria-disabled', 'true');
      chartBtn.setAttribute('aria-describedby', 'chart-helper-text');
      chartBtn.removeAttribute('title');
    }
    if (tableBtn) {
      tableBtn.disabled = false;
      tableBtn.removeAttribute('aria-disabled');
      tableBtn.removeAttribute('title');
    }
    if (helper) helper.style.display = 'block';
  } else {
    if (chartBtn) {
      chartBtn.disabled = false;
      chartBtn.removeAttribute('aria-disabled');
      chartBtn.removeAttribute('aria-describedby');
      chartBtn.removeAttribute('title');
    }
    if (tableBtn) {
      tableBtn.removeAttribute('title');
    }
    if (helper) helper.style.display = 'none';
  }
  updateToggleButtonStates({
    chartBtn,
    tableBtn,
    showingChart: state.viewMode === 'chart',
    forceTable: viewportWidth < 600,
  });
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