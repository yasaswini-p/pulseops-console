// Error types and the central error-handling middleware

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

// Express recognises error handlers by their four parameters
function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Request body must be valid JSON" });
  if (err.code === 121) return res.status(400).json({ error: "Document failed database schema validation" });

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? "Internal server error" : err.message, details: err.details });
}

module.exports = { ApiError, notFound, errorHandler };