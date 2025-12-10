/**
 * Required Return Calculations Module
 * Pure functions for Gordon Growth Model required return calculations
 */

/**
 * Calculate required return using Gordon Growth Model
 * Formula: r = (D₁ / P₀) + g
 * 
 * @param {Object} params - Model parameters
 * @param {number} params.marketPrice - Current market price (P₀)
 * @param {number} params.currentDividend - Current dividend (D₀)
 * @param {number} params.growthRate - Growth rate (g, as percentage)
 * @returns {Object} Calculation results
 */
export function calculateRequiredReturn({ marketPrice, currentDividend, growthRate }) {
  // Convert growth rate from percentage to decimal
  const g = growthRate / 100;
  
  // Calculate next year's dividend
  // D₁ = D₀ × (1 + g)
  const d1 = currentDividend * (1 + g);
  
  // Calculate dividend yield
  const dividendYield = d1 / marketPrice;
  
  // Calculate required return
  // r = (D₁ / P₀) + g
  const requiredReturn = dividendYield + g;
  
  // Convert to percentage
  const requiredReturnPct = requiredReturn * 100;
  const dividendYieldPct = dividendYield * 100;
  
  return {
    requiredReturn: requiredReturnPct,
    requiredReturnDecimal: requiredReturn,
    d1,
    dividendYield: dividendYieldPct,
    dividendYieldDecimal: dividendYield,
    growthRateDecimal: g,
    isValid: requiredReturn > 0 && g < requiredReturn
  };
}

/**
 * Generate dividend cash flow projections
 * @param {Object} params - Calculation parameters
 * @param {number} params.marketPrice - Initial investment
 * @param {number} params.currentDividend - Current dividend (D₀)
 * @param {number} params.growthRateDecimal - Growth rate (as decimal)
 * @param {number} params.years - Number of years to project (default 10)
 * @returns {Array} Array of cash flow objects
 */
export function generateCashFlows({ marketPrice, currentDividend, growthRateDecimal, years = 10 }) {
  const cashFlows = [];
  
  // Year 0: Initial investment (negative cash flow)
  cashFlows.push({
    year: 0,
    dividend: 0,
    investment: -marketPrice,
    totalCashFlow: -marketPrice,
    cumulativeCashFlow: -marketPrice
  });
  
  // Years 1 to n: Dividend payments growing at rate g
  let cumulativeTotal = -marketPrice;
  
  for (let year = 1; year <= years; year++) {
    // D_t = D₀ × (1 + g)^t
    const dividend = currentDividend * Math.pow(1 + growthRateDecimal, year);
    cumulativeTotal += dividend;
    
    cashFlows.push({
      year,
      dividend,
      investment: 0,
      totalCashFlow: dividend,
      cumulativeCashFlow: cumulativeTotal
    });
  }
  
  return cashFlows;
}

/**
 * Calculate all required return metrics
 * @param {Object} params - Input parameters from state
 * @returns {Object} Complete required return calculations
 */
export function calculateRequiredReturnMetrics(params) {
  const { marketPrice, currentDividend, growthRate } = params;
  
  // Calculate required return
  const returnData = calculateRequiredReturn({
    marketPrice,
    currentDividend,
    growthRate
  });
  
  // Generate cash flow projections
  const cashFlows = generateCashFlows({
    marketPrice,
    currentDividend,
    growthRateDecimal: returnData.growthRateDecimal,
    years: 10
  });
  
  return {
    ...returnData,
    cashFlows
  };
}

/**
 * Calculate stock price using Gordon Growth Model (for reference)
 * P₀ = D₁ / (r - g)
 * 
 * This is the inverse calculation - given required return and growth,
 * what should the price be?
 * 
 * @param {number} d1 - Next dividend
 * @param {number} r - Required return (decimal)
 * @param {number} g - Growth rate (decimal)
 * @returns {number} Theoretical stock price
 */
export function calculateGordonPrice(d1, r, g) {
  if (g >= r) {
    throw new Error('Growth rate must be less than required return');
  }
  return d1 / (r - g);
}
