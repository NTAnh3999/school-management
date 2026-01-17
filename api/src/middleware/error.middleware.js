const { ErrorResponse } = require("../utils/error-responses");

const errorHandler = (err, req, res) => {
  if (err instanceof ErrorResponse) {
    const payload = { message: err.message, details: err.details || null };
    return res.status(err.statusCode).json(payload);
  }
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  const payload = { message: "Internal Server Error" };
  return res.status(500).json(payload);
};

module.exports = { errorHandler };
