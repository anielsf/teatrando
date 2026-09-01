/**
 * Funciones de utilidad y formateo
 */

export function formatUSD(amount) {
  const val = parseFloat(amount) || 0;
  return `$${val.toFixed(2)}`;
}

export function formatVES(amountUSD, rate) {
  const val = (parseFloat(amountUSD) || 0) * (parseFloat(rate) || 1);
  return `Bs. ${val.toFixed(2)}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function debounce(func, wait = 250) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function generateUUID() {
  return 'TKT-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Date.now().toString().slice(-4);
}
