const Transaction = require("../models/transaction");
const {
  validateCreateTransactionReq,
  validateUpdateTransactionReq,
} = require("../utils/validators");

const createTransaction = async (req, res) => {
  try {
    validateCreateTransactionReq(req);
    const { name, amount, currency, categoryId, date, type } = req.body;

    const transaction = new Transaction({
      name,
      amount,
      currency,
      categoryId,
      date,
      type,
      userId: req.user._id,
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
    const { name, amount, currency, categoryId, date, type } = req.body;

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
    const transactions = await Transaction.find({
      userId: req.user._id,
    }).lean();

    res.status(200).json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  getTransactionById,
};
