const express = require("express");

const {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
  getMonthlyTransactionSummary,
  getTransactionById,
} = require("../controllers/transactionController");

const validateUser = require("../middlewares/validateUser");

const transactionRouter = express.Router();

transactionRouter.post("/create", validateUser, createTransaction);

transactionRouter.patch("/:id", validateUser, updateTransaction);

transactionRouter.delete("/:id", validateUser, deleteTransaction);

transactionRouter.get("/", validateUser, getTransactions);
transactionRouter.get(
  "/month-summary",
  validateUser,
  getMonthlyTransactionSummary,
);

transactionRouter.get("/:id", validateUser, getTransactionById);

module.exports = transactionRouter;
