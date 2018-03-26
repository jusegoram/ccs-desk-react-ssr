class ExpectedError extends Error {
  constructor(message) {
    super(`Expected Error: ${message}`)
  }
}
ExpectedError.regex = /^Expected Error: /

export default ExpectedError
