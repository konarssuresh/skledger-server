const User = require("../models/user");
const Category = require("../models/category");
const Transaction = require("../models/transaction");

const createUser = async (overrides = {}) => {
  const email = overrides.email || `user-${Date.now()}-${Math.random()}@test.com`;
  const user = new User({
    fullName: "Test User",
    email,
    password: overrides.password || "Pass@1234",
    baseCurrency: "INR",
    ...overrides,
  });
  await user.hashPassword();
  await user.save();
  return user;
};

const authCookieForUser = (user) => [`token=${user.generateAuthToken()}`];

const createCategory = async (user, overrides = {}) => {
  const category = await Category.create({
    name: "Food",
    type: "expense",
    emoji: "🍔",
    userId: user._id,
    ...overrides,
  });
  return category;
};

const createTransaction = async (user, category, overrides = {}) => {
  return Transaction.create({
    name: "Lunch",
    amount: 200,
    currency: "INR",
    categoryId: category._id,
    note: "",
    date: new Date("2026-02-12T10:00:00.000Z"),
    userId: user._id,
    type: "expense",
    ...overrides,
  });
};

module.exports = {
  createUser,
  authCookieForUser,
  createCategory,
  createTransaction,
};
