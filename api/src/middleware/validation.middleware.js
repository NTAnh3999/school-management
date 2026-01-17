const { validationResult } = require("express-validator");

const validate = (rules) => {
  return [
    ...rules,
    (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
        return res.status(422).json({ message: "Validation failed", errors });
      }
      next();
    },
  ];
};

module.exports = { validate };
