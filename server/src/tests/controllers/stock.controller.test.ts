// src/tests/controllers/stock.controller.test.ts
import { Request, Response } from "express";
import { getAllStock } from "@/controllers/stock.controller";
import Stock from "@/models/stock.model";
import { isValidObjectId } from "mongoose";

// Simular el modelo Stock y sus métodos estáticos con Jest
jest.mock("@/models/stock.model", () => ({
  // Simula directamente los métodos estáticos del modelo
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

// Simular la función isValidObjectId de Mongoose
jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  isValidObjectId: jest.fn(),
}));

describe("getAllStock", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should get all stock without any filters", async () => {
    const mockStock = [
      {
        _id: "60c72b2f9b1d8e123456789a",
        medicalCenter: { _id: "mc1", name: "Centro A" },
        food: {
          _id: "food1",
          name: "Alimento A",
          unitOfMeasurement: { name: "Unidad", symbol: "un" },
        },
        quantity: 100,
        updatedAt: new Date(),
      },
    ];

    (Stock.countDocuments as jest.Mock).mockResolvedValue(1);
    (Stock.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockStock),
          }),
        }),
      }),
    });

    await getAllStock(req as Request, res as Response);

    expect(Stock.countDocuments).toHaveBeenCalledWith({});
    expect(Stock.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: mockStock,
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
      itemsPerPage: 10,
    });
  });

  it("should get filtered stock based on medicalCenterId and foodId", async () => {
    req.query!.medicalCenterId = "60c72b2f9b1d8e123456789b";
    req.query!.foodId = "60c72b2f9b1d8e123456789c";

    (isValidObjectId as jest.Mock).mockImplementation(
      (id: string) =>
        id === "60c72b2f9b1d8e123456789b" || id === "60c72b2f9b1d8e123456789c"
    );

    const mockFilteredStock = [
      {
        _id: "60c72b2f9b1d8e123456789d",
        medicalCenter: { _id: "mc2", name: "Centro B" },
        food: {
          _id: "food2",
          name: "Alimento B",
          unitOfMeasurement: { name: "Litro", symbol: "L" },
        },
        quantity: 50,
        updatedAt: new Date(),
      },
    ];

    (Stock.countDocuments as jest.Mock).mockResolvedValue(1);
    (Stock.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockFilteredStock),
          }),
        }),
      }),
    });

    await getAllStock(req as Request, res as Response);

    expect(isValidObjectId).toHaveBeenCalledWith("60c72b2f9b1d8e123456789b");
    expect(isValidObjectId).toHaveBeenCalledWith("60c72b2f9b1d8e123456789c");
    expect(Stock.countDocuments).toHaveBeenCalledWith({
      medicalCenter: "60c72b2f9b1d8e123456789b",
      food: "60c72b2f9b1d8e123456789c", // Corregido el ID aquí
    });
    expect(Stock.find).toHaveBeenCalledWith({
      medicalCenter: "60c72b2f9b1d8e123456789b",
      food: "60c72b2f9b1d8e123456789c", // Corregido el ID aquí
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: mockFilteredStock,
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
      itemsPerPage: 10,
    });
  });

  it("should return 500 status on internal server error", async () => {
    (Stock.countDocuments as jest.Mock).mockRejectedValue(
      new Error("Database connection failed")
    );

    await getAllStock(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error interno del servidor al obtener existencias.",
    });
  });
});
