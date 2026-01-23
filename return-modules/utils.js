/**
 * Utility Functions Module
 * DOM helpers, formatting, and common utilities
 */

/**
 * Query selector shorthand
 * @param {string} selector - CSS selector
 * @returns {Element|null} DOM element
 */
export const $ = (selector) => document.querySelector(selector);

/**
 * Add event listener helper
 * @param {Element|string} element - DOM element or selector
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export function listen(element, event, handler) {
  const el = typeof element === 'string' ? $(element) : element;
  if (el) {
    el.addEventListener(event, handler);
  }
}

/**
 * Debounce function calls
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, wait = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Format number as currency
 * @param {number} value - Numeric value
 * @param {boolean} signed - Include sign for negative values
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, signed = false) {
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  if (value < 0) {
    return `−$${formatted}`;
  }
  return `$${formatted}`;
}

/**
 * Format number as percentage
 * @param {number} value - Numeric value (as percentage, e.g., 5.5 for 5.5%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Create DOM element with attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Element attributes
 * @param {string} content - Text content
 * @returns {Element} Created element
 */
export function createElement(tag, attrs = {}, content = '') {
  const element = document.createElement(tag);
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  
  if (content) {
    element.textContent = content;
  }
  
  return element;
}

/**
 * Set HTML content safely
 * @param {Element} element - Target element
 * @param {string} html - HTML content
 */
export function setHTML(element, html) {
  element.innerHTML = html;
}

/**
 * Focus element after a delay
 * @param {Element} element - Element to focus
 * @param {number} delay - Delay in milliseconds
 */
export function focusElement(element, delay = 0) {
  if (!element) return;
  
  setTimeout(() => {
    element.focus();
  }, delay);
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
export function announceToScreenReader(message) {
  const announcement = $('#view-announcement');
  if (announcement) {
    announcement.textContent = message;
    setTimeout(() => {
      announcement.textContent = '';
    }, 1000);
  }
}

/**
 * Initialize static equation rendering
 * Call this once when the page loads to render the static equation with variables
 */
export function initializeStaticEquation() {
  const container = document.getElementById('static-equation');
  if (!container) {
    console.error('Static equation container not found');
    return;
  }
  
  // Using MathJax with TeX notation for the static equation
  const equation = `
    $$\\color{#7a46ff}{r} = \\frac{\\color{#3c6ae5}{Div_t}\\color{#15803d}{(1 + g)}}{\\color{#b95b1d}{PV_t}} + \\color{#15803d}{g} = \\frac{\\color{#3c6ae5}{Div_{t+1}}}{\\color{#b95b1d}{PV_t}} + \\color{#15803d}{g}$$
  `;
  
  container.innerHTML = equation;
  
  // Typeset the equation with MathJax
  if (window.MathJax) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, container]);
  }
}

/**
 * Initialize keyboard navigation for view switching
 * Tab moves between buttons, arrow keys move focus, Enter/Space activates and moves focus to content
 */
/**
 * Initialize keyboard navigation for view switching
 * Simple approach: Arrow keys move between buttons, clicking a button doesn't move focus to content
 */
/**
 * Initialize keyboard navigation for view switching
 * Arrow keys move between buttons AND switch views
 * Enter/Space on chart button moves focus to canvas
 */
export function initializeViewKeyboardNavigation() {
  const chartContainer = document.getElementById('chart-container');
  const tableContainer = document.getElementById('table-container');
  const chartBtn = document.getElementById('chart-view-btn');
  const tableBtn = document.getElementById('table-view-btn');
  
  if (!chartContainer || !tableContainer || !chartBtn || !tableBtn) {
    console.error('View navigation buttons not found');
    return;
  }
  
  // Arrow keys on buttons move focus AND switch views
  const handleButtonArrowKeys = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      
      if (e.target === chartBtn && !tableBtn.classList.contains('active')) {
        // Currently on chart button, switch to table
        tableBtn.click();
        tableBtn.focus();
      } else if (e.target === chartBtn && tableBtn.classList.contains('active')) {
        // Already showing table, just move focus
        tableBtn.focus();
      } else if (e.target === tableBtn && !chartBtn.classList.contains('active')) {
        // Currently on table button, switch to chart
        chartBtn.click();
        chartBtn.focus();
      } else if (e.target === tableBtn && chartBtn.classList.contains('active')) {
        // Already showing chart, just move focus
        chartBtn.focus();
      }
    }
  };
  
  chartBtn.addEventListener('keydown', handleButtonArrowKeys);
  tableBtn.addEventListener('keydown', handleButtonArrowKeys);
  
  // Enter/Space on chart button moves focus to canvas
  const handleChartActivation = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Ensure chart is visible
      if (!chartBtn.classList.contains('active')) {
        chartBtn.click();
      }
      // Move focus to chart canvas
      setTimeout(() => {
        const canvas = document.getElementById('return-chart');
        if (canvas) {
          canvas.focus();
        }
      }, 100);
    }
  };
  
  chartBtn.addEventListener('keydown', handleChartActivation);
  
  // Enter/Space on table button just activates it (normal behavior)
  // No special handling needed - browser default works fine
}

/**
 * Initialize all calculator features
 * Call this once after DOM is loaded and all elements are in place
 */
export function initializeCalculator() {
  // Render static equation with color-coded variables
  initializeStaticEquation();
  
  // Set up keyboard navigation for chart/table switching
  initializeViewKeyboardNavigation();
  
  console.log('Calculator initialization complete');
}