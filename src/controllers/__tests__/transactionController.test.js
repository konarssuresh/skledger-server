jest.mock("../../models/transaction", () => {
  const Transaction = jest.fn();
  Transaction.find = jest.fn();
  Transaction.findOne = jest.fn();
  return Transaction;
});

jest.mock("../../utils/validators", () => ({
  validateCreateTransactionReq: jest.fn(),
  validateUpdateTransactionReq: jest.fn(),
}));

const Transaction = require("../../models/transaction");
const {
  createTransaction,
  getTransactions,
  getMonthlyTransactionSummary,
  updateTransaction,
  deleteTransaction,
} = require("../transactionController");

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("transactionController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("createTransaction creates new transaction", async () => {
    const save = jest.fn();
    Transaction.mockImplementationOnce(() => ({ save }));
    const req = {
      body: {
        name: "Milk",
        amount: 56,
        currency: "INR",
        categoryId: "507f191e810c19729de860ea",
        date: "2026-02-12T00:00:00.000Z",
        type: "expense",
      },
      user: { _id: "u1" },
    };
    const res = createRes();

    await createTransaction(req, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("getTransactions validates query date", async () => {
    const req = { query: { date: "invalid-date" }, user: { _id: "u1" } };
    const res = createRes();

    await getTransactions(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("monthly summary returns grouped response for month", async () => {
    Transaction.find.mockReturnValue({
      lean: async () => [
        { date: "2026-02-01T10:00:00.000Z", amount: 1000, type: "income" },
        { date: "2026-02-01T11:00:00.000Z", amount: 100, type: "expense" },
      ],
    });
    const req = { query: { year: "2026", month: "2" }, user: { _id: "u1" } };
    const res = createRes();

    await getMonthlyTransactionSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      "2026-02-01": { income: 1000, expense: 100, savings: 0 },
    });
  });

  test("updateTransaction returns 404 when not found", async () => {
    Transaction.findOne.mockResolvedValue(null);
    const req = { params: { id: "t1" }, body: {}, user: { _id: "u1" } };
    const res = createRes();

    await updateTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("deleteTransaction returns 404 when not found", async () => {
    Transaction.findOne.mockResolvedValue(null);
    const req = { params: { id: "t1" }, user: { _id: "u1" } };
    const res = createRes();

    await deleteTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
