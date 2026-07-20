'use strict';

/** An HTTP-aware error carrying a status code and optional field details. */
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    if (details) this.details = details;
  }
}

const badRequest = (msg, details) => new ApiError(400, msg, details);
const unauthorized = (msg = 'Unauthorized') => new ApiError(401, msg);
const conflict = (msg) => new ApiError(409, msg);
const notFound = (msg = 'Not found') => new ApiError(404, msg);

module.exports = { ApiError, badRequest, unauthorized, conflict, notFound };
