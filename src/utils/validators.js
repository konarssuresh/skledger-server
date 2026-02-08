const validator = require("validator");

const SIGNUP_ALLOWED_KEYS = ["fullName", "email", "password", "baseCurrency"];

const validateSignupReq = (req) => {
  const invalidKeys = Object.keys(req.body).filter(
    (key) => !SIGNUP_ALLOWED_KEYS.includes(key),
  );

  if (invalidKeys.length > 0) {
    throw new Error(`Invalid fields in request: ${invalidKeys.join(", ")}`);
  }

  const { fullName, email, password } = req.body;

  if (!fullName || validator.isEmpty(fullName.trim())) {
    throw new Error("Full name is required");
  }

  if (!email || !validator.isEmail(email)) {
    throw new Error("A valid email is required");
  }

  if (
    !password ||
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    throw new Error(
      "Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol",
    );
  }

  return true;
};

const validateLoginReq = (req) => {
  const { email, password } = req.body;

  if (!email || !validator.isEmail(email)) {
    throw new Error("A valid email is required");
  }

  if (!password || validator.isEmpty(password)) {
    throw new Error("Password is required");
  }

  return true;
};

const CATEGORY_ALLOWED_KEYS = ["name", "type", "emoji"];

const validateCreateCategoryReq = (req) => {
  if (!req.body || typeof req.body !== "object") {
    throw new Error("Request body must be a valid JSON object");
  }
  const invalidKeys = Object.keys(req.body).filter(
    (key) => !CATEGORY_ALLOWED_KEYS.includes(key),
  );

  if (invalidKeys.length > 0) {
    throw new Error(`Invalid fields in request: ${invalidKeys.join(", ")}`);
  }

  const { name, type } = req.body;

  if (!name || validator.isEmpty(name.trim())) {
    throw new Error("Category name is required");
  }

  if (!type || !["income", "expense", "savings"].includes(type)) {
    throw new Error("Category type must be one of: income, expense, savings");
  }

  return true;
};

const UPDATE_CATEGORY_ALLOWED_KEYS = ["name", "type", "emoji"];

const validateUpdateCategoryReq = (req) => {
  if (!req.body || typeof req.body !== "object") {
    throw new Error("Request body must be a valid JSON object");
  }
  const invalidKeys = Object.keys(req.body).filter(
    (key) => !UPDATE_CATEGORY_ALLOWED_KEYS.includes(key),
  );

  if (invalidKeys.length > 0) {
    throw new Error(`Invalid fields in request: ${invalidKeys.join(", ")}`);
  }

  const { name, type } = req.body;

  if (name && validator.isEmpty(name.trim())) {
    throw new Error("Category name cannot be empty");
  }

  if (type && !["income", "expense", "savings"].includes(type)) {
    throw new Error("Category type must be one of: income, expense, savings");
  }

  return true;
};

const TRANSACTION_CREATE_ALLOWED_KEYS = [
  "name",
  "amount",
  "currency",
  "categoryId",
  "note",
  "date",
  "type",
];

const validateCreateTransactionReq = (req) => {
  if (!req.body || typeof req.body !== "object") {
    throw new Error("Request body must be a valid JSON object");
  }

  const invalidKeys = Object.keys(req.body).filter(
    (key) => !TRANSACTION_CREATE_ALLOWED_KEYS.includes(key),
  );

  if (invalidKeys.length > 0) {
    throw new Error(`Invalid fields in request: ${invalidKeys.join(", ")}`);
  }

  const { name, amount, currency, categoryId, date, type } = req.body;

  if (!name || validator.isEmpty(name.trim())) {
    throw new Error("Transaction name is required");
  }

  if (amount === undefined || typeof amount !== "number" || amount < 0) {
    throw new Error("Amount must be a positive number");
  }

  if (
    !currency ||
    !validator.isIn(currency, ["USD", "EUR", "GBP", "INR", "JPY", "CNY"])
  ) {
    throw new Error("Currency must be one of: USD, EUR, GBP, INR, JPY, CNY");
  }

  if (!categoryId || !validator.isMongoId(categoryId)) {
    throw new Error("A valid categoryId is required");
  }

  if (date && !validator.isISO8601(date)) {
    throw new Error("Date must be in ISO 8601 format");
  }

  if (!type || !["income", "expense", "savings"].includes(type)) {
    throw new Error(
      "Transaction type must be one of: income, expense, savings",
    );
  }

  return true;
};

const UPDATE_ALLOWED_KEYS = [
  "name",
  "amount",
  "currency",
  "categoryId",
  "note",
  "date",
  "type",
];

const validateUpdateTransactionReq = (req) => {
  if (!req.body || typeof req.body !== "object") {
    throw new Error("Request body must be a valid JSON object");
  }

  const invalidKeys = Object.keys(req.body).filter(
    (key) => !UPDATE_ALLOWED_KEYS.includes(key),
  );

  if (invalidKeys.length > 0) {
    throw new Error(`Invalid fields in request: ${invalidKeys.join(", ")}`);
  }

  const { name, amount, currency, categoryId, date, type } = req.body;

  if (name && validator.isEmpty(name.trim())) {
    throw new Error("Transaction name cannot be empty");
  }

  if (amount !== undefined && (typeof amount !== "number" || amount < 0)) {
    throw new Error("Amount must be a positive number");
  }

  if (
    currency &&
    !validator.isIn(currency, ["USD", "EUR", "GBP", "INR", "JPY", "CNY"])
  ) {
    throw new Error("Currency must be one of: USD, EUR, GBP, INR, JPY, CNY");
  }

  if (categoryId && !validator.isMongoId(categoryId)) {
    throw new Error("A valid categoryId is required");
  }

  if (date && !validator.isISO8601(date)) {
    throw new Error("Date must be in ISO 8601 format");
  }

  if (type && !["income", "expense", "savings"].includes(type)) {
    throw new Error(
      "Transaction type must be one of: income, expense, savings",
    );
  }

  return true;
};

module.exports = {
  validateSignupReq,
  validateLoginReq,
  validateCreateCategoryReq,
  validateUpdateCategoryReq,
  validateCreateTransactionReq,
  validateUpdateTransactionReq,
};
