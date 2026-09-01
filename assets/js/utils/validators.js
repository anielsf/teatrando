/**
 * Validadores para formularios
 */

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function isValidString(str, minLength = 1) {
  return typeof str === 'string' && str.trim().length >= minLength;
}

export function isValidNumber(val, min = 0) {
  const num = parseFloat(val);
  return !isNaN(num) && num >= min;
}
