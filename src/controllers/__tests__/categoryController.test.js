jest.mock("../../models/category", () => {
  const Category = jest.fn();
  Category.find = jest.fn();
  Category.findOne = jest.fn();
  Category.insertMany = jest.fn();
  return Category;
});

jest.mock("../../utils/validators", () => ({
  validateCreateCategoryReq: jest.fn(),
  validateUpdateCategoryReq: jest.fn(),
}));

const Category = require("../../models/category");
const {
  createDefaultCategories,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../categoryController");

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("categoryController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("createDefaultCategories prevents duplicate defaults", async () => {
    Category.find.mockResolvedValue([{ _id: "c1" }]);
    const res = createRes();

    await createDefaultCategories({}, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("createCategory creates category for user", async () => {
    const save = jest.fn();
    Category.mockImplementationOnce(() => ({ save }));

    const req = {
      body: { name: "Food", type: "expense", emoji: "🍛" },
      user: { _id: "u1" },
    };
    const res = createRes();

    await createCategory(req, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("getCategories returns 401 when user missing", async () => {
    const res = createRes();
    await getCategories({}, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("updateCategory returns 404 when category not found", async () => {
    Category.findOne.mockResolvedValue(null);
    const req = { params: { id: "c1" }, body: {}, user: { _id: "u1" } };
    const res = createRes();

    await updateCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("deleteCategory blocks default category deletion", async () => {
    Category.findOne.mockResolvedValue({ isDefault: true });
    const req = { params: { id: "c1" }, user: { _id: "u1" } };
    const res = createRes();

    await deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
