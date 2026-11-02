/** An expected, user-facing failure: printed without a stack trace. */
export class StandardsError extends Error {
  override name = 'StandardsError'
}
