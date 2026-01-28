/**
 * State Management Module
 * Observable state pattern for reactive updates
 */

export const state = {
  // Required return parameters
  marketPrice: 54.6,
  currentDividend: 5.1,
  growthRate: 6.4,
  
  // UI state
  viewMode: 'chart', // 'chart' or 'table'
  
  // Validation errors
  errors: {},
  
  // Calculated values
  returnCalculations: null,
  
  // Subscribers
  listeners: []
};

/**
 * Update state and notify all subscribers
 * @param {Object} updates - Partial state updates
 */
export function setState(updates) {
  Object.assign(state, updates);
  state.listeners.forEach(fn => fn(state));
}

/**
 * Subscribe to state changes
 * @param {Function} fn - Callback function
 */
export function subscribe(fn) {
  state.listeners.push(fn);
}