export function maskSensitiveText(value) {
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '***@***.***')
    .replace(/01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/g, '010-****-****')
    .replace(/\b\d{8,10}\b/g, (match) => `${match.slice(0, 2)}${'*'.repeat(match.length - 4)}${match.slice(-2)}`)
}
