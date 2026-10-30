export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export function formatCurrency(value, currency = 'USD') {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

export function formatName(value) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : '';
}
