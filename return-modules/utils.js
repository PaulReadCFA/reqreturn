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

export const NUMERIC_INPUT_MAX_CHARS = 6;

/**
 * @param {HTMLInputElement} input
 * @param {number} maxLen
 */
export function clampNumericInputLength(input, maxLen) {
  if (!input || input.value == null || maxLen <= 0) return;
  const raw = String(input.value);
  if (raw.length <= maxLen) return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  input.value = raw.slice(0, maxLen);
  if (typeof input.setSelectionRange === 'function') {
    const pos = Math.min(
      typeof start === 'number' && typeof end === 'number' ? Math.min(start, end) : maxLen,
      maxLen
    );
    input.setSelectionRange(pos, pos);
  }
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
  // \; gives medium space around + signs; all + are explicitly black
  const equation = `$$\\color{#6b35e8}{r} = \\frac{\\color{#3c6ae5}{Div_t} \\color{black}{\\;(1 \\;+\\; } \\color{#15803d}{g} \\color{black}{)}}{\\color{#b95b1d}{PV_t}} \\color{black}{\\;+\\;} \\color{#15803d}{g} = \\frac{\\color{#3c6ae5}{Div_{t\\color{black}{+1}}}}{\\color{#b95b1d}{PV_t}} \\color{black}{\\;+\\;} \\color{#15803d}{g}$$`;
  
  container.innerHTML = equation;
  
  // Typeset the equation with MathJax
  if (window.MathJax) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, container]);
    
    // Use MutationObserver to remove tabindex as MathJax adds it
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('MathJax')) {
              node.removeAttribute('tabindex');
            }
            const mathJaxElements = node.querySelectorAll ? node.querySelectorAll('.MathJax') : [];
            mathJaxElements.forEach(el => el.removeAttribute('tabindex'));
          }
        });
      });
    });
    
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex']
    });
    
    // Also remove immediately after typesetting
    MathJax.Hub.Queue(() => {
      const mathJaxElements = container.querySelectorAll('.MathJax');
      mathJaxElements.forEach(el => {
        el.removeAttribute('tabindex');
      });
      setTimeout(() => observer.disconnect(), 1000);
    });
  }
}

/**
 * Initialize all calculator features
 * Call this once after DOM is loaded and all elements are in place
 */
export function initializeCalculator() {
  // Render static equation with color-coded variables
  initializeStaticEquation();
  
  // Global cleanup for any MathJax tabindex issues
  if (window.MathJax) {
    // Aggressive cleanup function
    const cleanupMathJax = () => {
      document.querySelectorAll('.MathJax[tabindex]').forEach(el => {
        el.removeAttribute('tabindex');
      });
    };
    
    // Run cleanup multiple times with delays
    setTimeout(cleanupMathJax, 500);
    setTimeout(cleanupMathJax, 1000);
    setTimeout(cleanupMathJax, 2000);
    setTimeout(cleanupMathJax, 3000);
    
    // Also run on any MathJax processing complete
    MathJax.Hub.Queue(() => {
      cleanupMathJax();
    });
  }
  
  console.log('Calculator initialization complete');
}