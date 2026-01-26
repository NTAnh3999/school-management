const { ErrorResponse } = require("../utils/error-responses");

const buildPayload = (message, details = null) => ({
  error: true,
  message,
  details,
});

const errorHandler = (err, req, res, next) => {
  void next;
  if (err instanceof ErrorResponse) {
    const payload = buildPayload(err.message, err.details || null);
    return res.status(err.statusCode).json(payload);
  }
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json(buildPayload("Invalid JSON payload"));
  }

  console.error("Unhandled error:", err);

  const details = process.env.NODE_ENV === "production" ? null : err.message;
  return res.status(500).json(buildPayload("Internal Server Error", details));
};

module.exports = { errorHandler };
