const Transaction = require("../models/transaction");
const Category = require("../models/category");

const ALLOWED_PERIOD_TYPES = ["daily", "weekly", "monthly", "yearly"];

const toStartOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const getPeriodRange = (periodType, anchorDate) => {
  const startOfDay = toStartOfUtcDay(anchorDate);
  let start;
  let end;

  if (periodType === "daily") {
    start = startOfDay;
    end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 1));
    return { start, end };
  }

  if (periodType === "weekly") {
    const day = startOfDay.getUTCDay(); // 0-Sun, 1-Mon
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start = new Date(
      Date.UTC(
        startOfDay.getUTCFullYear(),
        startOfDay.getUTCMonth(),
        startOfDay.getUTCDate() + mondayOffset,
      ),
    );
    end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 7));
    return { start, end };
  }

  if (periodType === "monthly") {
    start = new Date(Date.UTC(startOfDay.getUTCFullYear(), startOfDay.getUTCMonth(), 1));
    end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return { start, end };
  }

  // yearly
  start = new Date(Date.UTC(startOfDay.getUTCFullYear(), 0, 1));
  end = new Date(Date.UTC(start.getUTCFullYear() + 1, 0, 1));
  return { start, end };
};

const getPreviousRange = (periodType, currentStart) => {
  if (periodType === "daily") {
    const start = new Date(Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth(), currentStart.getUTCDate() - 1));
    const end = currentStart;
    return { start, end };
  }

  if (periodType === "weekly") {
    const start = new Date(Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth(), currentStart.getUTCDate() - 7));
    const end = currentStart;
    return { start, end };
  }

  if (periodType === "monthly") {
    const start = new Date(Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth() - 1, 1));
    const end = currentStart;
    return { start, end };
  }

  const start = new Date(Date.UTC(currentStart.getUTCFullYear() - 1, 0, 1));
  const end = currentStart;
  return { start, end };
};

const formatDateKey = (date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const createTrendSeed = (periodType, start, end) => {
  const seed = [];

  if (periodType === "daily") {
    for (let hour = 0; hour < 24; hour += 1) {
      seed.push({
        key: String(hour).padStart(2, "0"),
        label: `${String(hour).padStart(2, "0")}:00`,
        income: 0,
        expense: 0,
        savings: 0,
      });
    }
    return seed;
  }

  if (periodType === "yearly") {
    for (let month = 0; month < 12; month += 1) {
      seed.push({
        key: String(month + 1).padStart(2, "0"),
        label: new Date(Date.UTC(start.getUTCFullYear(), month, 1)).toLocaleString("en-IN", {
          month: "short",
          timeZone: "UTC",
        }),
        income: 0,
        expense: 0,
        savings: 0,
      });
    }
    return seed;
  }

  for (
    let cursor = new Date(start);
    cursor < end;
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1))
  ) {
    seed.push({
      key: formatDateKey(cursor),
      label:
        periodType === "weekly"
          ? cursor.toLocaleString("en-IN", { weekday: "short", timeZone: "UTC" })
          : String(cursor.getUTCDate()),
      income: 0,
      expense: 0,
      savings: 0,
    });
  }

  return seed;
};

const bucketKeyForTransaction = (periodType, date) => {
  if (periodType === "daily") {
    return String(date.getUTCHours()).padStart(2, "0");
  }
  if (periodType === "yearly") {
    return String(date.getUTCMonth() + 1).padStart(2, "0");
  }
  return formatDateKey(date);
};

const sumByType = (transactions) =>
  transactions.reduce(
    (acc, tx) => {
      const amount = Number(tx.amount || 0);
      if (tx.type === "income") acc.income += amount;
      if (tx.type === "expense") acc.expense += amount;
      if (tx.type === "savings") acc.savings += amount;
      return acc;
    },
    { income: 0, expense: 0, savings: 0 },
  );

const percentChange = (current, previous) => {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
};

const getDashboardAnalytics = async (req, res) => {
  try {
    const periodType = String(req.query.periodType || "monthly").toLowerCase();
    if (!ALLOWED_PERIOD_TYPES.includes(periodType)) {
      return res.status(400).json({
        error: `periodType must be one of: ${ALLOWED_PERIOD_TYPES.join(", ")}`,
      });
    }

    const anchorDate = req.query.date ? new Date(req.query.date) : new Date();
    if (Number.isNaN(anchorDate.getTime())) {
      return res.status(400).json({ error: "date must be a valid ISO date" });
    }

    const { start, end } = getPeriodRange(periodType, anchorDate);
    const { start: prevStart, end: prevEnd } = getPreviousRange(periodType, start);

    const [transactions, previousTransactions, categories] = await Promise.all([
      Transaction.find({
        userId: req.user._id,
        date: { $gte: start, $lt: end },
      })
        .sort({ date: -1 })
        .lean(),
      Transaction.find({
        userId: req.user._id,
        date: { $gte: prevStart, $lt: prevEnd },
      }).lean(),
      Category.find({
        $or: [{ isDefault: true }, { userId: req.user._id }],
      }).lean(),
    ]);

    const categoryMap = categories.reduce((acc, category) => {
      acc[String(category._id)] = category;
      return acc;
    }, {});

    const totals = sumByType(transactions);
    const previousTotals = sumByType(previousTransactions);
    const balance = totals.income - (totals.expense + totals.savings);
    const previousBalance =
      previousTotals.income - (previousTotals.expense + previousTotals.savings);

    const summary = {
      periodType,
      date: formatDateKey(anchorDate),
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
      income: totals.income,
      expense: totals.expense,
      savings: totals.savings,
      balance,
      transactionCount: transactions.length,
      changes: {
        incomePct: percentChange(totals.income, previousTotals.income),
        expensePct: percentChange(totals.expense, previousTotals.expense),
        savingsPct: percentChange(totals.savings, previousTotals.savings),
        balancePct: percentChange(balance, previousBalance),
      },
    };

    const categorySummaryMap = {};
    for (const tx of transactions) {
      const category = categoryMap[String(tx.categoryId)];
      const key = `${String(tx.categoryId)}-${tx.type}`;
      if (!categorySummaryMap[key]) {
        categorySummaryMap[key] = {
          categoryId: tx.categoryId,
          categoryName: category?.name || "Unknown",
          categoryEmoji: category?.emoji || "📁",
          type: tx.type,
          amount: 0,
          count: 0,
        };
      }
      categorySummaryMap[key].amount += Number(tx.amount || 0);
      categorySummaryMap[key].count += 1;
    }

    const categorySummary = Object.values(categorySummaryMap)
      .sort((a, b) => b.amount - a.amount)
      .map((item) => ({
        ...item,
        percentageOfTypeTotal:
          totals[item.type] > 0
            ? Number(((item.amount / totals[item.type]) * 100).toFixed(2))
            : 0,
      }));

    const trendSeed = createTrendSeed(periodType, start, end);
    const trendMap = trendSeed.reduce((acc, point) => {
      acc[point.key] = point;
      return acc;
    }, {});

    for (const tx of transactions) {
      const key = bucketKeyForTransaction(periodType, new Date(tx.date));
      if (!trendMap[key]) continue;
      trendMap[key][tx.type] += Number(tx.amount || 0);
    }

    const trendSummary = trendSeed.map((point) => ({
      label: point.label,
      income: point.income,
      expense: point.expense,
      savings: point.savings,
      balance: point.income - (point.expense + point.savings),
    }));

    const topExpenseCategory = categorySummary
      .filter((row) => row.type === "expense")
      .sort((a, b) => b.amount - a.amount)[0];

    const savingsRate =
      totals.income > 0
        ? Number(((totals.savings / totals.income) * 100).toFixed(2))
        : 0;

    const insights = {
      topExpenseCategory: topExpenseCategory
        ? {
            categoryId: topExpenseCategory.categoryId,
            name: topExpenseCategory.categoryName,
            emoji: topExpenseCategory.categoryEmoji,
            amount: topExpenseCategory.amount,
          }
        : null,
      savingsRate,
      expenseVsPreviousPct: percentChange(totals.expense, previousTotals.expense),
      netFlow: balance,
    };

    const recentTransactions = transactions.slice(0, 5).map((tx) => {
      const category = categoryMap[String(tx.categoryId)];
      return {
        _id: tx._id,
        name: tx.name,
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type,
        note: tx.note || "",
        date: tx.date,
        categoryId: tx.categoryId,
        categoryName: category?.name || "Unknown",
        categoryEmoji: category?.emoji || "📁",
      };
    });

    return res.status(200).json({
      summary,
      categorySummary,
      trendSummary,
      insights,
      recentTransactions,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardAnalytics,
};
