const EXPECTED_CHUNK_LENGTH = 125

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isArrayOfLength(
  value: unknown,
  length: number,
): value is unknown[] {
  return Array.isArray(value) && value.length === length
}

export function isArrayOfLength125(value: unknown): value is unknown[] {
  return isArrayOfLength(value, EXPECTED_CHUNK_LENGTH)
}

export function isArrayOfChunks125(
  value: unknown,
): value is unknown[][] {
  if (!Array.isArray(value)) {
    return false
  }
  return value.every((chunk) => isArrayOfLength125(chunk))
}

export function assertValid<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  label: string,
): asserts value is T {
  if (!guard(value)) {
    throw new Error(`Invalid payload: ${label}`)
  }
}
