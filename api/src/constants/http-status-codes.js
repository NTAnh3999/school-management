"use strict";

const INFORMATIONAL = Object.freeze({
  CONTINUE: { code: 100, reasonPhrase: "Continue" },
  SWITCHING_PROTOCOLS: { code: 101, reasonPhrase: "Switching Protocols" },
  PROCESSING: { code: 102, reasonPhrase: "Processing" },
});

const SUCCESS = Object.freeze({
  OK: { code: 200, reasonPhrase: "OK" },
  CREATED: { code: 201, reasonPhrase: "Created" },
  ACCEPTED: { code: 202, reasonPhrase: "Accepted" },
  NO_CONTENT: { code: 204, reasonPhrase: "No Content" },
  PARTIAL_CONTENT: { code: 206, reasonPhrase: "Partial Content" },
});

const REDIRECTION = Object.freeze({
  MULTIPLE_CHOICES: { code: 300, reasonPhrase: "Multiple Choices" },
  MOVED_PERMANENTLY: { code: 301, reasonPhrase: "Moved Permanently" },
  FOUND: { code: 302, reasonPhrase: "Found" },
  SEE_OTHER: { code: 303, reasonPhrase: "See Other" },
  NOT_MODIFIED: { code: 304, reasonPhrase: "Not Modified" },
  TEMPORARY_REDIRECT: { code: 307, reasonPhrase: "Temporary Redirect" },
  PERMANENT_REDIRECT: { code: 308, reasonPhrase: "Permanent Redirect" },
});

const CLIENT_ERROR = Object.freeze({
  BAD_REQUEST: { code: 400, reasonPhrase: "Bad Request" },
  UNAUTHORIZED: { code: 401, reasonPhrase: "Unauthorized" },
  PAYMENT_REQUIRED: { code: 402, reasonPhrase: "Payment Required" },
  FORBIDDEN: { code: 403, reasonPhrase: "Forbidden" },
  NOT_FOUND: { code: 404, reasonPhrase: "Not Found" },
  METHOD_NOT_ALLOWED: { code: 405, reasonPhrase: "Method Not Allowed" },
  CONFLICT: { code: 409, reasonPhrase: "Conflict" },
  GONE: { code: 410, reasonPhrase: "Gone" },
  PAYLOAD_TOO_LARGE: { code: 413, reasonPhrase: "Payload Too Large" },
  UNSUPPORTED_MEDIA_TYPE: { code: 415, reasonPhrase: "Unsupported Media Type" },
  UNPROCESSABLE_ENTITY: { code: 422, reasonPhrase: "Unprocessable Entity" },
  TOO_MANY_REQUESTS: { code: 429, reasonPhrase: "Too Many Requests" },
});

const SERVER_ERROR = Object.freeze({
  INTERNAL_SERVER_ERROR: { code: 500, reasonPhrase: "Internal Server Error" },
  NOT_IMPLEMENTED: { code: 501, reasonPhrase: "Not Implemented" },
  BAD_GATEWAY: { code: 502, reasonPhrase: "Bad Gateway" },
  SERVICE_UNAVAILABLE: { code: 503, reasonPhrase: "Service Unavailable" },
  GATEWAY_TIMEOUT: { code: 504, reasonPhrase: "Gateway Timeout" },
  HTTP_VERSION_NOT_SUPPORTED: { code: 505, reasonPhrase: "HTTP Version Not Supported" },
});

const HTTP_STATUS = Object.freeze(
  Object.values({
    ...INFORMATIONAL,
    ...SUCCESS,
    ...REDIRECTION,
    ...CLIENT_ERROR,
    ...SERVER_ERROR,
  }).reduce((acc, { code, reasonPhrase }) => {
    acc[code] = { code, reasonPhrase };
    return acc;
  }, {})
);

const getStatus = (statusCode) => HTTP_STATUS[statusCode] || null;

module.exports = {
  HTTP_STATUS,
  getStatus,
  INFORMATIONAL,
  SUCCESS,
  REDIRECTION,
  CLIENT_ERROR,
  SERVER_ERROR,
};
