const errorHandler = (err, req, res, _next) => {
  res.status(err.statusCode || 500).json({
    message: err.message || "Server Error",
  });
};

export default errorHandler;
