/**
 * Utility functions for data transformations
 * These functions handle parsing and formatting data consistently across the application
 */

/**
 * Parse potentially formatted money values that may use either "." or "," 
 * for decimal separators and contain currency symbols
 */
export const parseMoneyValue = (value: string | number): number => {
  if (!value) return 0;
  
  // If value is already a number, return it
  if (typeof value === 'number') return value;
  
  // Remove currency symbols, dots used as thousand separators, and other non-numeric characters
  // except the decimal point and minus sign, then replace comma with period for parsing
  const numericString = value.replace(/[^\d,-]/g, "").replace(",", ".");
  return parseFloat(numericString) || 0;
};

/**
 * Parse grade averages that may use either "." or "," as decimal separators
 */
export const parseGradeValue = (value: string | number): number => {
  if (!value) return 0;
  
  // If value is already a number, return it
  if (typeof value === 'number') return value;
  
  // Replace comma with period for proper decimal parsing
  const numericString = value.replace(",", ".");
  return parseFloat(numericString) || 0;
};

/**
 * Parse academic year values that might contain decimal points or other formatting
 */
export const parseAcademicYear = (value: string | number): string => {
  if (!value) return "";
  
  // If value is already a number, convert to string
  if (typeof value === 'number') return value.toString();
  
  // Remove any non-numeric characters and parse as integer
  const numericValue = parseInt(value.replace(/[^\d]/g, ""));
  
  // Check if it's a valid year (between 1900 and current year + 10)
  const currentYear = new Date().getFullYear();
  if (
    numericValue &&
    numericValue >= 1900 &&
    numericValue <= currentYear + 10
  ) {
    return numericValue.toString();
  }
  return value; // Return original if parsing failed or year is invalid
};

/**
 * Format a number as currency in Chilean Pesos
 */
export const formatCurrency = (value: number): string => {
  if (!value && value !== 0) return "";
  return `$${value.toLocaleString("es-CL")}`;
}; 