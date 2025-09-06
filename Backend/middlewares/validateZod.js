export default (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body ?? {},
      query: req.query ?? {},
      params: req.params ?? {},
    });
    req.validated = validated;
    return next();
  } catch (err) {
    // ZodError handled by your centralized error handler
    return next(err);
  }
};
