// server/src/controllers/foodEntry.controller.ts
import { Request, Response } from "express";
import FoodEntry from "../models/foodEntry.model";
import MedicalCenter from "../models/medicalCenter.model";
import Provider from "../models/provider.model";
import FoodPlan from "../models/foodPlan.model";
import Food from "../models/food.model";
import Stock from "../models/stock.model"; // Para actualizar existencias
import { isValidObjectId } from "mongoose";
import ExcelJS from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  BorderStyle,
} from "docx";
// Importaciones de date-fns
import {
  format,
  subWeeks,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
} from "date-fns";

// Función auxiliar para manejar errores de validación de Mongoose
const handleMongooseValidationError = (res: Response, error: any): void => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({ message: messages.join(", ") });
  } else {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Función auxiliar para actualizar existencias (crear o incrementar)
const updateStock = async (
  medicalCenterId: string,
  foodId: string,
  quantity: number
): Promise<void> => {
  try {
    const stock = await Stock.findOne({
      medicalCenter: medicalCenterId,
      food: foodId,
    });

    if (stock) {
      // Si el alimento ya existe en stock para ese centro médico, incrementar la cantidad
      stock.quantity += quantity;
      await stock.save();
    } else {
      // Si no existe, crear una nueva entrada de stock
      const newStock = new Stock({
        medicalCenter: medicalCenterId,
        food: foodId,
        quantity: quantity,
      });
      await newStock.save();
    }
  } catch (error: any) {
    console.error("Error al actualizar el stock:", error.message);
    // En un entorno de producción, podrías querer registrar esto o lanzar un error específico
    throw new Error("Error al actualizar el stock.");
  }
};

// Validar que los IDs de alimentos dentro de enteredFoods sean válidos
const validateEnteredFoods = async (
  enteredFoods: any[]
): Promise<string | null> => {
  for (const item of enteredFoods) {
    if (!isValidObjectId(item.food)) {
      return `ID de alimento no válido: ${item.food}`;
    }
    const foodExists = await Food.findById(item.food);
    if (!foodExists) {
      return `Alimento con ID ${item.food} no encontrado.`;
    }
  }
  return null; // Todo válido
};

// Crear una nueva entrada de alimentos (Solo administradores)
export const createFoodEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { entryDate, medicalCenterId, foodPlanId, enteredFoods } = req.body;

    if (
      !entryDate ||
      !medicalCenterId ||
      !enteredFoods ||
      !Array.isArray(enteredFoods) ||
      enteredFoods.length === 0
    ) {
      res
        .status(400)
        .json({
          message: "Campos obligatorios incompletos o 'enteredFoods' vacío.",
        });
      return;
    }

    if (!isValidObjectId(medicalCenterId)) {
      res.status(400).json({ message: "ID de centro médico no válido." });
      return;
    }
    const existingMedicalCenter = await MedicalCenter.findById(medicalCenterId);
    if (!existingMedicalCenter) {
      res
        .status(404)
        .json({ message: "El centro médico especificado no existe." });
      return;
    }

    if (foodPlanId && !isValidObjectId(foodPlanId)) {
      res.status(400).json({ message: "ID de plan de alimento no válido." });
      return;
    }
    if (foodPlanId) {
      const existingFoodPlan = await FoodPlan.findById(foodPlanId);
      if (!existingFoodPlan) {
        res
          .status(404)
          .json({ message: "El plan de alimento especificado no existe." });
        return;
      }
    }

    const enteredFoodsError = await validateEnteredFoods(enteredFoods);
    if (enteredFoodsError) {
      res.status(400).json({ message: enteredFoodsError });
      return;
    }

    const newFoodEntry = new FoodEntry({
      entryDate: new Date(entryDate),
      medicalCenter: medicalCenterId,
      foodPlan: foodPlanId || undefined, // Opcional
      enteredFoods,
    });

    await newFoodEntry.save();

    // Actualizar el stock para cada alimento en la entrada
    for (const item of enteredFoods) {
      await updateStock(medicalCenterId, item.food.toString(), item.quantity); // Asegurar que foodId sea string
    }

    await newFoodEntry.populate("medicalCenter", "name");
    await newFoodEntry.populate("foodPlan", "name type startDate endDate");
    await newFoodEntry.populate("enteredFoods.food", "name unitOfMeasurement");
    await newFoodEntry.populate({
      path: "enteredFoods.food",
      populate: {
        path: "unitOfMeasurement",
        select: "name symbol",
      },
      select: "name description",
    });

    res.status(201).json(newFoodEntry);
  } catch (error: any) {
    console.error("Error al crear entrada de alimentos:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Obtener todas las Entradas de Alimentos con filtros y paginación
export const getAllFoodEntries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const medicalCenterId = (req.query.medicalCenterId as string) || "";
    const foodPlanId = (req.query.foodPlanId as string) || "";
    const foodId = (req.query.foodId as string) || "";
    const period = req.query.period as string; // 'lastWeek', 'lastMonth', 'lastYear', 'all'

    const query: any = {};

    if (medicalCenterId && isValidObjectId(medicalCenterId)) {
      query.medicalCenter = medicalCenterId;
    }
    if (foodPlanId && isValidObjectId(foodPlanId)) {
      query.foodPlan = foodPlanId;
    }
    if (foodId && isValidObjectId(foodId)) {
      query["enteredFoods.food"] = foodId;
    }

    let startDateFilter: Date | undefined;
    let endDateFilter: Date | undefined;

    if (period && period !== "all") {
      const now = new Date(); // Usar new Date() en lugar de moment()
      switch (period) {
        case "lastWeek":
          startDateFilter = startOfDay(subWeeks(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastMonth":
          startDateFilter = startOfDay(subMonths(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastYear":
          startDateFilter = startOfDay(subYears(now, 1));
          endDateFilter = endOfDay(now);
          break;
        default:
          // Si el periodo no es reconocido, ignorar el filtro de fecha
          break;
      }
    }

    if (startDateFilter && endDateFilter) {
      // Aplicar el filtro a la fecha de entrada
      query.entryDate = { $gte: startDateFilter, $lte: endDateFilter };
    }

    const totalItems = await FoodEntry.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const foodEntries = await FoodEntry.find(query)
      .populate("medicalCenter", "name")
      .populate("foodPlan", "name type startDate endDate")
      .populate("enteredFoods.food", "name unitOfMeasurement")
      .populate({
        path: "enteredFoods.food",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
        select: "name description",
      })
      .sort({ entryDate: -1 }) // Ordenar por fecha de entrada descendente
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: foodEntries,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error: any) {
    console.error("Error al obtener entradas de alimentos:", error.message);
    res
      .status(500)
      .json({
        message: "Error interno del servidor al obtener entradas de alimentos.",
      });
  }
};

// Obtener una Entrada de Alimentos por ID
export const getFoodEntryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de entrada de alimento no válido." });
      return;
    }
    const foodEntry = await FoodEntry.findById(req.params.id)
      .populate("medicalCenter", "name")
      .populate("foodPlan", "name type startDate endDate")
      .populate("enteredFoods.food", "name unitOfMeasurement")
      .populate({
        path: "enteredFoods.food",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
        select: "name description",
      });

    if (!foodEntry) {
      res.status(404).json({ message: "Entrada de alimento no encontrada." });
      return;
    }
    res.status(200).json(foodEntry);
  } catch (error: any) {
    console.error(
      "Error al obtener entrada de alimento por ID:",
      error.message
    );
    res
      .status(500)
      .json({
        message: "Error interno del servidor al obtener entrada de alimento.",
      });
  }
};

// Actualizar una Entrada de Alimentos por ID (Solo administradores)
export const updateFoodEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { entryDate, medicalCenterId, foodPlanId, enteredFoods } = req.body;

    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de entrada de alimento no válido." });
      return;
    }

    const existingEntry = await FoodEntry.findById(req.params.id);
    if (!existingEntry) {
      res
        .status(404)
        .json({
          message: "Entrada de alimento no encontrada para actualizar.",
        });
      return;
    }

    if (medicalCenterId && !isValidObjectId(medicalCenterId)) {
      res.status(400).json({ message: "ID de centro médico no válido." });
      return;
    }
    if (medicalCenterId) {
      const existingMedicalCenter = await MedicalCenter.findById(
        medicalCenterId
      );
      if (!existingMedicalCenter) {
        res
          .status(404)
          .json({ message: "El centro médico especificado no existe." });
        return;
      }
    }

    if (foodPlanId && !isValidObjectId(foodPlanId)) {
      res.status(400).json({ message: "ID de plan de alimento no válido." });
      return;
    }
    if (foodPlanId) {
      const existingFoodPlan = await FoodPlan.findById(foodPlanId);
      if (!existingFoodPlan) {
        res
          .status(404)
          .json({ message: "El plan de alimento especificado no existe." });
        return;
      }
    }

    if (enteredFoods) {
      const enteredFoodsError = await validateEnteredFoods(enteredFoods);
      if (enteredFoodsError) {
        res.status(400).json({ message: enteredFoodsError });
        return;
      }
    }

    // Calcular la diferencia en cantidades para actualizar el stock correctamente
    const oldEnteredFoodsMap = new Map(
      existingEntry.enteredFoods.map((item) => [
        item.food.toString(),
        item.quantity,
      ])
    );
    const newEnteredFoodsMap = new Map(
      enteredFoods
        ? enteredFoods.map((item: any) => [item.food.toString(), item.quantity])
        : []
    );

    const updateData: any = {
      entryDate,
      enteredFoods,
    };
    if (medicalCenterId) updateData.medicalCenter = medicalCenterId;
    if (foodPlanId !== undefined) updateData.foodPlan = foodPlanId; // Permite setear a null/undefined

    const updatedFoodEntry = await FoodEntry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedFoodEntry) {
      res
        .status(404)
        .json({
          message: "Entrada de alimento no encontrada para actualizar.",
        });
      return;
    }

    // Actualizar el stock basado en los cambios
    const currentMedicalCenterId = updatedFoodEntry.medicalCenter.toString();

    // Revertir stock viejo y aplicar nuevo stock
    for (const [foodId, oldQuantity] of oldEnteredFoodsMap.entries()) {
      await updateStock(
        currentMedicalCenterId,
        foodId as string,
        -oldQuantity as number
      ); // Restar la cantidad vieja
    }
    for (const [foodId, newQuantity] of newEnteredFoodsMap.entries()) {
      await updateStock(
        currentMedicalCenterId,
        foodId as string,
        newQuantity as number
      ); // Sumar la cantidad nueva
    }

    await updatedFoodEntry.populate("medicalCenter", "name");
    await updatedFoodEntry.populate("foodPlan", "name type startDate endDate");
    await updatedFoodEntry.populate(
      "enteredFoods.food",
      "name unitOfMeasurement"
    );
    await updatedFoodEntry.populate({
      path: "enteredFoods.food",
      populate: {
        path: "unitOfMeasurement",
        select: "name symbol",
      },
      select: "name description",
    });

    res.status(200).json(updatedFoodEntry);
  } catch (error: any) {
    console.error("Error al actualizar entrada de alimentos:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Eliminar una Entrada de Alimentos por ID (Solo administradores)
export const deleteFoodEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de entrada de alimento no válido." });
      return;
    }

    const deletedFoodEntry = await FoodEntry.findByIdAndDelete(req.params.id);

    if (!deletedFoodEntry) {
      res
        .status(404)
        .json({ message: "Entrada de alimento no encontrada para eliminar." });
      return;
    }

    // Al eliminar una entrada, también revertir las cantidades del stock
    const medicalCenterId = deletedFoodEntry.medicalCenter.toString();
    for (const item of deletedFoodEntry.enteredFoods) {
      await updateStock(medicalCenterId, item.food.toString(), -item.quantity); // Restar la cantidad del stock
    }

    res
      .status(200)
      .json({ message: "Entrada de alimento eliminada exitosamente." });
  } catch (error: any) {
    console.error("Error al eliminar entrada de alimentos:", error.message);
    res
      .status(500)
      .json({
        message: "Error interno del servidor al eliminar entrada de alimentos.",
      });
  }
};

// Exportar Entradas de Alimentos a Excel
export const exportFoodEntriesToExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicalCenterId = (req.query.medicalCenterId as string) || "";
    const foodPlanId = (req.query.foodPlanId as string) || "";
    const foodId = (req.query.foodId as string) || "";
    const period = req.query.period as string;

    const query: any = {};
    if (medicalCenterId && isValidObjectId(medicalCenterId)) {
      query.medicalCenter = medicalCenterId;
    }
    if (foodPlanId && isValidObjectId(foodPlanId)) {
      query.foodPlan = foodPlanId;
    }
    if (foodId && isValidObjectId(foodId)) {
      query["enteredFoods.food"] = foodId;
    }

    let startDateFilter: Date | undefined;
    let endDateFilter: Date | undefined;

    if (period && period !== "all") {
      const now = new Date(); // Usar new Date() en lugar de moment()
      switch (period) {
        case "lastWeek":
          startDateFilter = startOfDay(subWeeks(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastMonth":
          startDateFilter = startOfDay(subMonths(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastYear":
          startDateFilter = startOfDay(subYears(now, 1));
          endDateFilter = endOfDay(now);
          break;
        default:
          break;
      }
    }

    if (startDateFilter && endDateFilter) {
      query.entryDate = { $gte: startDateFilter, $lte: endDateFilter };
    }

    const foodEntries = await FoodEntry.find(query)
      .populate("medicalCenter", "name")
      .populate("foodPlan", "name")
      .populate({
        path: "enteredFoods.food",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
        select: "name description",
      })
      .sort({ entryDate: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Entradas de Alimentos");

    // Definir columnas
    worksheet.columns = [
      { header: "Fecha de Entrada", key: "entryDate", width: 20 },
      { header: "Centro Médico", key: "medicalCenter", width: 30 },
      { header: "Plan de Alimentos", key: "foodPlan", width: 30 },
      { header: "Alimento", key: "foodName", width: 25 },
      { header: "Cantidad", key: "quantity", width: 15 },
      { header: "Unidad", key: "unit", width: 15 },
    ];

    // Añadir filas de datos
    foodEntries.forEach((entry) => {
      entry.enteredFoods.forEach((item) => {
        worksheet.addRow({
          entryDate: format(new Date(entry.entryDate), "yyyy-MM-dd"), // Usar date-fns
          medicalCenter: (entry.medicalCenter as any)?.name || "N/A",
          foodPlan: (entry.foodPlan as any)?.name || "N/A",
          foodName: (item.food as any)?.name || "N/A",
          quantity: item.quantity,
          unit: (item.food as any)?.unitOfMeasurement?.name || "N/A",
        });
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `entradas_alimentos_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error(
      "Error al exportar entradas de alimentos a Excel:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Excel." });
  }
};

// Exportar Entradas de Alimentos a Word
export const exportFoodEntriesToWord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicalCenterId = (req.query.medicalCenterId as string) || "";
    const foodPlanId = (req.query.foodPlanId as string) || "";
    const foodId = (req.query.foodId as string) || "";
    const period = req.query.period as string;

    const query: any = {};
    if (medicalCenterId && isValidObjectId(medicalCenterId)) {
      query.medicalCenter = medicalCenterId;
    }
    if (foodPlanId && isValidObjectId(foodPlanId)) {
      query.foodPlan = foodPlanId;
    }
    if (foodId && isValidObjectId(foodId)) {
      query["enteredFoods.food"] = foodId;
    }

    let startDateFilter: Date | undefined;
    let endDateFilter: Date | undefined;

    if (period && period !== "all") {
      const now = new Date(); // Usar new Date() en lugar de moment()
      switch (period) {
        case "lastWeek":
          startDateFilter = startOfDay(subWeeks(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastMonth":
          startDateFilter = startOfDay(subMonths(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastYear":
          startDateFilter = startOfDay(subYears(now, 1));
          endDateFilter = endOfDay(now);
          break;
        default:
          break;
      }
    }

    if (startDateFilter && endDateFilter) {
      query.entryDate = { $gte: startDateFilter, $lte: endDateFilter };
    }

    const foodEntries = await FoodEntry.find(query)
      .populate("medicalCenter", "name")
      .populate("foodPlan", "name")
      .populate({
        path: "enteredFoods.food",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
        select: "name description",
      })
      .sort({ entryDate: -1 });

    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Fecha de Entrada")],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new TableCell({
            children: [new Paragraph("Centro Médico")],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new TableCell({
            children: [new Paragraph("Plan de Alimentos")],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new TableCell({
            children: [new Paragraph("Alimento")],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new TableCell({
            children: [new Paragraph("Cantidad")],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new TableCell({
            children: [new Paragraph("Unidad")],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
        ],
      }),
    ];

    foodEntries.forEach((entry) => {
      entry.enteredFoods.forEach((item) => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph(
                    format(new Date(entry.entryDate), "yyyy-MM-dd")
                  ),
                ], // Usar date-fns
              }),
              new TableCell({
                children: [
                  new Paragraph((entry.medicalCenter as any)?.name || "N/A"),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph((entry.foodPlan as any)?.name || "N/A"),
                ],
              }),
              new TableCell({
                children: [new Paragraph((item.food as any)?.name || "N/A")],
              }),
              new TableCell({
                children: [new Paragraph(item.quantity.toString())],
              }),
              new TableCell({
                children: [
                  new Paragraph(
                    (item.food as any)?.unitOfMeasurement?.name || "N/A"
                  ),
                ],
              }),
            ],
          })
        );
      });
    });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Reporte de Entradas de Alimentos",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `entradas_alimentos_${Date.now()}.docx`
    );
    res.send(buffer);
  } catch (error: any) {
    console.error(
      "Error al exportar entradas de alimentos a Word:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Word." });
  }
};
