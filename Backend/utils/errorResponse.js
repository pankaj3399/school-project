import CustomError from './customError.js';

export const createValidationError = (message) => {
  return new CustomError(message, 400);
};

export const createAuthError = (message = 'Authentication failed') => {
  return new CustomError(message, 401);
};

export const createForbiddenError = (message = 'Access forbidden') => {
  return new CustomError(message, 403);
};

export const createNotFoundError = (message = 'Resource not found') => {
  return new CustomError(message, 404);
};

export const createServerError = (message = 'Internal server error') => {
  return new CustomError(message, 500);
};
