// Backend/middleware/errorHandler.js
const isProd = process.env.NODE_ENV === 'production';

function errorHandler(err, req, res, next) {
  if (!err) return next();

  // Zod validation errors
  if (err.name === 'ZodError' || err?.issues) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }
  
  // Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(400).json({
      message: Object.values(err.errors).map(val => val.message).join(', ')
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate field value entered'
    });
  }

  // Custom status errors
  if (err.status && Number.isInteger(err.status)) {
    return res.status(err.status).json({
      message: err.message || 'Error'
    });
  }

  // Default 500 error
  console.error('[Error]', err);
  res.status(500).json({
    message: isProd ? 'Internal Server Error' : err.message
  });
}

export default errorHandler;
