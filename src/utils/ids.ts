// Small ID helper shared by pantry + grocery stores.

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for very old environments: time + random suffix.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
