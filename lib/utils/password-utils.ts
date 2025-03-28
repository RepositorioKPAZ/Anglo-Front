/**
 * Generates a password based on empresa data using the following algorithm:
 * "MB" + company ID + first 3 digits of RUT + current year
 * @param empresaData Object containing empresa information
 * @returns A generated password string
 */
export function generatePassword(empresaData: { Rut: string; ID: string }): string {
  const currentYear = new Date().getFullYear();
  const rutDigits = empresaData.Rut.replace(/[^0-9]/g, '').slice(0, 3);
  
  return `MB${empresaData.ID}${rutDigits}${currentYear}`;
} 