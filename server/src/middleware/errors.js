export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  // Surface the underlying message for 500s too — on Workers the browser network
  // tab is often the only way to see *why* a request failed, so a generic
  // 'Internal server error' makes DB/auth misconfiguration impossible to debug.
  res.status(status).json({
    message: status === 500 ? `Internal server error: ${err.message}` : err.message,
  });
}

/** Helper to create an error with an HTTP status. */
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
