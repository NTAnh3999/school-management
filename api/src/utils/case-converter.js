const isPlainObject = (value) => Object.prototype.toString.call(value) === "[object Object]";

const isSequelizeInstance = (value) =>
  value && typeof value.get === "function" && typeof value.toJSON === "function";

const toSnakeCase = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z0-9])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();

const toSnakeCaseKeys = (value) => {
  if (value == null || value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.map((item) => toSnakeCaseKeys(item));
  }

  if (isSequelizeInstance(value)) {
    return toSnakeCaseKeys(value.get({ plain: true }));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        typeof key === "string" ? toSnakeCase(key) : key,
        toSnakeCaseKeys(nestedValue),
      ])
    );
  }

  return value;
};

module.exports = { toSnakeCaseKeys };
