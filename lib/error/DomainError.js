/**
 * credit: https://rclayton.silvrback.com/custom-errors-in-node-js
 */
class DomainError extends Error {
  constructor(message) {
    super(message);
   // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
   // This clips the constructor invocation from the stack trace.
   // It's not absolutely essential, but it does make the stack trace a little nicer.
   //  @see Node.js reference (bottom)
    Error.captureStackTrace(this, this.constructor);
  }
}

class ConfigurationIsMissingError extends DomainError {
  constructor(configuration) {
    super(`Configuration '${configuration}' is missing.`);
    this.data = { configuration };
  }
}

class InputValidationError extends DomainError {
  constructor(field, fieldValue, error) {
    super(`Field '${field}' is invalid: '${error}'`);
    this.data = { field, fieldValue, error};
  }
}

module.exports = {
  ConfigurationIsMissingError,
  InputValidationError
};