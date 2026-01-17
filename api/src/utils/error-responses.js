"use strict";
const { CLIENT_ERROR, SERVER_ERROR } = require("../constants/http-status-codes");
class ErrorResponse extends Error {
  constructor(message, statusCode, details = null) {
    const fallbackMessage = message || "Unexpected error";
    super(fallbackMessage);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
class BadRequestError extends ErrorResponse {
  constructor(message = CLIENT_ERROR.BAD_REQUEST.reasonPhrase, details) {
    super(message, CLIENT_ERROR.BAD_REQUEST.code, details);
  }
}
class UnauthorizedError extends ErrorResponse {
  constructor(message = CLIENT_ERROR.UNAUTHORIZED.reasonPhrase, details) {
    super(message, CLIENT_ERROR.UNAUTHORIZED.code, details);
  }
}
class ForbiddenError extends ErrorResponse {
  constructor(message = CLIENT_ERROR.FORBIDDEN.reasonPhrase, details) {
    super(message, CLIENT_ERROR.FORBIDDEN.code, details);
  }
}
class NotFoundError extends ErrorResponse {
  constructor(message = CLIENT_ERROR.NOT_FOUND.reasonPhrase, details) {
    super(message, CLIENT_ERROR.NOT_FOUND.code, details);
  }
}
class ConflictError extends ErrorResponse {
  constructor(message = CLIENT_ERROR.CONFLICT.reasonPhrase, details) {
    super(message, CLIENT_ERROR.CONFLICT.code, details);
  }
}
class UnprocessableEntityError extends ErrorResponse {
  constructor(message = CLIENT_ERROR.UNPROCESSABLE_ENTITY.reasonPhrase, details) {
    super(message, CLIENT_ERROR.UNPROCESSABLE_ENTITY.code, details);
  }
}
class TooManyRequestsError extends ErrorResponse {
  constructor(message = CLIENT_ERROR.TOO_MANY_REQUESTS.reasonPhrase, details) {
    super(message, CLIENT_ERROR.TOO_MANY_REQUESTS.code, details);
  }
}
class InternalServerError extends ErrorResponse {
  constructor(message = SERVER_ERROR.INTERNAL_SERVER_ERROR.reasonPhrase, details) {
    super(message, SERVER_ERROR.INTERNAL_SERVER_ERROR.code, details);
  }
}
class NotImplementedError extends ErrorResponse {
  constructor(message = SERVER_ERROR.NOT_IMPLEMENTED.reasonPhrase, details) {
    super(message, SERVER_ERROR.NOT_IMPLEMENTED.code, details);
  }
}
class ServiceUnavailableError extends ErrorResponse {
  constructor(message = SERVER_ERROR.SERVICE_UNAVAILABLE.reasonPhrase, details) {
    super(message, SERVER_ERROR.SERVICE_UNAVAILABLE.code, details);
  }
}
class GatewayTimeoutError extends ErrorResponse {
  constructor(message = SERVER_ERROR.GATEWAY_TIMEOUT.reasonPhrase, details) {
    super(message, SERVER_ERROR.GATEWAY_TIMEOUT.code, details);
  }
}
module.exports = {
  ErrorResponse,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  NotImplementedError,
  ServiceUnavailableError,
  GatewayTimeoutError,
};
