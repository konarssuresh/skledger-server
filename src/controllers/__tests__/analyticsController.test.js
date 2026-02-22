jest.mock("../../models/transaction", () => ({
  find: jest.fn(),
}));

jest.mock("../../models/category", () => ({
  find: jest.fn(),
}));

const Transaction = require("../../models/transaction");
const Category = require("../../models/category");
const { getDashboardAnalytics } = require("../analyticsController");

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("analyticsController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 for invalid period type", async () => {
    const req = {
      query: { periodType: "invalid", date: "2026-02-01" },
      user: { _id: "u1" },
    };
    const res = createRes();

    await getDashboardAnalytics(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns full analytics payload for monthly period", async () => {
    Transaction.find
      .mockReturnValueOnce({
        sort: () => ({
          lean: async () => [
            {
              _id: "t1",
              name: "Food",
              amount: 200,
              currency: "INR",
              type: "expense",
              note: "",
              date: "2026-02-12T10:00:00.000Z",
              categoryId: "c1",
            },
          ],
        }),
      })
      .mockReturnValueOnce({
        lean: async () => [],
      });

    Category.find.mockReturnValueOnce({
      lean: async () => [{ _id: "c1", name: "Food", emoji: "🍛" }],
    });

    const req = {
      query: { periodType: "monthly", date: "2026-02-01" },
      user: { _id: "u1" },
    };
    const res = createRes();

    await getDashboardAnalytics(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        summary: expect.any(Object),
        categorySummary: expect.any(Array),
        trendSummary: expect.any(Array),
        insights: expect.any(Object),
        recentTransactions: expect.any(Array),
      }),
    );
  });
});
