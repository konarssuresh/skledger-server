const Transaction = require("../models/transaction");
const {
  validateCreateTransactionReq,
  validateUpdateTransactionReq,
} = require("../utils/validators");

const createTransaction = async (req, res) => {
  try {
    validateCreateTransactionReq(req);
    const {
      name,
      amount,
      currency,
      categoryId,
      date,
      type,
      note = "",
    } = req.body;

    const transaction = new Transaction({
      name,
      amount,
      currency,
      categoryId,
      date,
      type,
      userId: req.user._id,
      note,
    });

    await transaction.save();
    res
      .status(201)
      .json({ message: "Transaction created successfully", transaction });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    validateUpdateTransactionReq(req);
    const { id } = req.params;
    const { name, amount, currency, categoryId, date, type, note } = req.body;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user._id,
    });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (name) transaction.name = name;
    if (amount) transaction.amount = amount;
    if (currency) transaction.currency = currency;
    if (categoryId) transaction.categoryId = categoryId;
    if (date) transaction.date = date;
    if (type) transaction.type = type;
    if (note) transaction.note = note;

    await transaction.save();
    res
      .status(200)
      .json({ message: "Transaction updated successfully", transaction });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user._id,
    });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    await transaction.deleteOne();
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { date } = req.query;
    const query = { userId: req.user._id };

    // Optional filter: /api/transactions?date=YYYY-MM-DD
    if (date) {
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) {
        return res
          .status(400)
          .json({ error: "Invalid date query param. Use YYYY-MM-DD." });
      }

      const start = new Date(parsed);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(parsed);
      end.setUTCHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    }

    const transactions = await Transaction.find(query).lean();

    res.status(200).json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMonthlyTransactionSummary = async (req, res) => {
  try {
    const { year, month } = req.query;

    // If month/year are not provided, keep backward fallback of full list.
    if (!year || !month) {
      const transactions = await Transaction.find({
        userId: req.user._id,
      }).lean();
      return res.status(200).json({ transactions });
    }

    const parsedYear = Number(year);
    const parsedMonth = Number(month);

    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 1970 ||
      !Number.isInteger(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12
    ) {
      return res
        .status(400)
        .json({ error: "year and month query params are invalid" });
    }

    const startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
    const endDate = new Date(Date.UTC(parsedYear, parsedMonth, 1));

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    }).lean();

    const summary = {};

    transactions.forEach((transaction) => {
      const txDate = new Date(transaction.date);
      const yyyy = txDate.getUTCFullYear();
      const mm = String(txDate.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(txDate.getUTCDate()).padStart(2, "0");
      const dayKey = `${yyyy}-${mm}-${dd}`;

      if (!summary[dayKey]) {
        summary[dayKey] = { income: 0, expense: 0, savings: 0 };
      }

      const amount = Number(transaction.amount || 0);
      if (transaction.type === "income") {
        summary[dayKey].income += amount;
      } else if (transaction.type === "expense") {
        summary[dayKey].expense += amount;
      } else if (transaction.type === "savings") {
        summary[dayKey].savings += amount;
      }
    });

    return res.status(200).json(summary);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user._id,
    }).lean();

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
  getMonthlyTransactionSummary,
  getTransactionById,
};
