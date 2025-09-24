const Joi = require('joi');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

/**
 * Validates request against Joi schema
 * @param {Object} schema - Joi schema with optional 'params', 'query', or 'body' keys
 */
const validate = (schema) => (req, res, next) => {
  // 1. Extract only the specified validation schemas (params/query/body)
  const validSchema = pick(schema, ['params', 'query', 'body']);
  
  // 2. Pick corresponding parts from request object
  const object = pick(req, Object.keys(validSchema));

  // 3. Compile and validate with Joi
  const { value, error } = Joi.compile(validSchema)
    .prefs({
      errors: { label: 'key' }, // Cleaner error messages
      abortEarly: false // Return all errors at once
    })
    .validate(object);

  // 4. Handle validation errors
  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }

  // 5. Assign validated values back to request
  Object.assign(req, value);
  return next();
};

module.exports = validate;