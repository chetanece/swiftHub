const mongoose = require('mongoose');
const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

// Convert unknown error into ApiError
const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      (error.statusCode && Number.isInteger(error.statusCode))
        ? error.statusCode
        : error instanceof mongoose.Error
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR;

    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

// Handle all errors
const errorHandler = (err, req, res, next) => {

  // Extra debug log for error object
  console.error('🔥 errorHandler received error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));

  let statusCode = err.statusCode;
  let message = err.message;

  // fallback if statusCode missing/invalid
  if (!statusCode || !Number.isInteger(statusCode)) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  }

  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message: message || 'Internal Server Error',
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
    console.log('🔥 ERROR OBJECT:', err); // debug log
  }

  // Final fallback to ensure statusCode is always a valid integer
  if (!statusCode || !Number.isInteger(statusCode)) {
    statusCode = 500;
  }
  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};

