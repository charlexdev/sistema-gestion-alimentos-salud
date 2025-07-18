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
import * as fs from "fs"; // Importar el módulo fs para leer archivos
import * as path from "path"; // Importar el módulo path para manejar rutas de archivos
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
  AlignmentType, // Importado para alineación de texto y contenido
  ShadingType, // Importado para sombreado de celdas
  ImageRun, // Importado para insertar imágenes
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

// Crear una nueva entrada de alimentos
export const createFoodEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { medicalCenter, provider, foodPlan, entryDate, enteredFoods } =
      req.body;

    const newFoodEntry = new FoodEntry({
      medicalCenter,
      provider,
      foodPlan,
      entryDate,
      enteredFoods,
    });

    const savedFoodEntry = await newFoodEntry.save();

    // Actualizar el stock de los alimentos ingresados: Ahora se incrementa el stock
    for (const item of enteredFoods) {
      await Stock.findOneAndUpdate(
        { food: item.food, medicalCenter: medicalCenter }, // CORRECCIÓN: Incluir medicalCenter en la query
        { $inc: { quantity: item.quantity } },
        { upsert: true, new: true } // Crea si no existe, devuelve el doc actualizado
      );
    }

    res.status(201).json(savedFoodEntry);
  } catch (error: any) {
    console.error("Error al crear entrada de alimentos:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Obtener una entrada de alimentos por ID
export const getFoodEntryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const foodEntry = await FoodEntry.findById(req.params.id)
      .populate("medicalCenter", "name")
      .populate("provider", "name")
      .populate("foodPlan", "name")
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
      "Error al obtener entrada de alimentos por ID:",
      error.message
    );
    res.status(500).json({
      message: "Error interno del servidor al obtener entrada de alimentos.",
    });
  }
};

// Actualizar una entrada de alimentos por ID
export const updateFoodEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { medicalCenter, provider, foodPlan, entryDate, enteredFoods } =
      req.body;

    // Obtener la entrada antigua para comparar
    const oldFoodEntry = await FoodEntry.findById(req.params.id);
    if (!oldFoodEntry) {
      res.status(404).json({ message: "Entrada de alimento no encontrada." });
      return;
    }

    // Crear mapas para facilitar la comparación entre alimentos antiguos y nuevos
    const oldFoodsMap = new Map(
      oldFoodEntry.enteredFoods.map((item) => [
        item.food.toString(),
        item.quantity,
      ])
    );
    const newFoodsMap = new Map(
      enteredFoods.map((item: any) => [item.food.toString(), item.quantity])
    );

    // Obtener el medicalCenter del registro antiguo
    const oldMedicalCenterId = oldFoodEntry.medicalCenter;

    // Procesar cambios de stock basados en la diferencia
    for (const [foodId, oldQuantity] of oldFoodsMap.entries()) {
      const newQuantity = newFoodsMap.get(foodId);

      if (newQuantity !== undefined && newQuantity !== null) {
        const difference = (newQuantity as number) - oldQuantity;
        if (difference !== 0) {
          await Stock.findOneAndUpdate(
            // CORRECCIÓN: Incluir medicalCenter en la consulta
            { food: foodId, medicalCenter: oldMedicalCenterId }, // Usar el MC del registro antiguo
            { $inc: { quantity: difference } }, // Incrementar o decrementar por la diferencia
            { upsert: true, new: true }
          );
        }
      } else {
        // El alimento existía antes pero fue eliminado en la actualización: decrementar stock
        await Stock.findOneAndUpdate(
          // CORRECCIÓN: Incluir medicalCenter en la consulta
          { food: foodId, medicalCenter: oldMedicalCenterId }, // Usar el MC del registro antiguo
          { $inc: { quantity: -oldQuantity } },
          { upsert: true, new: true }
        );
      }
    }

    // Procesar alimentos que son nuevos en la entrada actualizada: incrementar stock
    for (const item of enteredFoods) {
      if (!oldFoodsMap.has(item.food.toString())) {
        await Stock.findOneAndUpdate(
          // CORRECCIÓN: Incluir medicalCenter en la consulta
          { food: item.food, medicalCenter: medicalCenter }, // Usar el MC del req.body para nuevos alimentos
          { $inc: { quantity: item.quantity } },
          { upsert: true, new: true }
        );
      }
    }

    const updatedFoodEntry = await FoodEntry.findByIdAndUpdate(
      req.params.id,
      { medicalCenter, provider, foodPlan, entryDate, enteredFoods },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedFoodEntry);
  } catch (error: any) {
    console.error("Error al actualizar entrada de alimentos:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Eliminar una entrada de alimentos por ID
export const deleteFoodEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const foodEntry = await FoodEntry.findById(req.params.id);
    if (!foodEntry) {
      res.status(404).json({ message: "Entrada de alimento no encontrada." });
      return;
    }

    // Revertir el stock antes de eliminar la entrada: Ahora se decrementa el stock
    for (const item of foodEntry.enteredFoods) {
      await Stock.findOneAndUpdate(
        // CORRECCIÓN: Incluir medicalCenter en la consulta
        { food: item.food, medicalCenter: foodEntry.medicalCenter },
        { $inc: { quantity: -item.quantity } }, // Decrementar la cantidad al eliminar la entrada
        { upsert: true, new: true }
      );
    }

    await foodEntry.deleteOne();
    res
      .status(200)
      .json({ message: "Entrada de alimento eliminada exitosamente." });
  } catch (error: any) {
    console.error("Error al eliminar entrada de alimentos:", error.message);
    res.status(500).json({
      message: "Error interno del servidor al eliminar entrada de alimentos.",
    });
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
    const search = (req.query.search as string) || "";
    const providerId = (req.query.providerId as string) || "";

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

    if (providerId && isValidObjectId(providerId)) {
      query.provider = providerId;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { "medicalCenter.name": searchRegex },
        { "provider.name": searchRegex },
        { "foodPlan.name": searchRegex },
        { "enteredFoods.food.name": searchRegex },
      ];
    }

    let startDateFilter: Date | undefined;
    let endDateFilter: Date | undefined;

    if (period) {
      const today = new Date();
      if (period === "lastWeek") {
        startDateFilter = subWeeks(today, 1);
      } else if (period === "lastMonth") {
        startDateFilter = subMonths(today, 1);
      } else if (period === "lastYear") {
        startDateFilter = subYears(today, 1);
      }
      if (startDateFilter) {
        query.entryDate = {
          $gte: startOfDay(startDateFilter),
          $lte: endOfDay(today),
        };
      }
    }

    const totalItems = await FoodEntry.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const foodEntries = await FoodEntry.find(query)
      .populate("medicalCenter", "name")
      .populate("provider", "name")
      .populate("foodPlan", "name type startDate endDate")
      .populate({
        path: "enteredFoods.food",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
        select: "name description",
      })
      .sort({ entryDate: -1 })
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
    res.status(500).json({
      message: "Error interno del servidor al obtener entradas de alimentos.",
    });
  }
};

// Exportar a Excel
export const exportFoodEntriesToExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { search, medicalCenterId, providerId, foodPlanId, foodId, period } =
      req.query;

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

    if (providerId && isValidObjectId(providerId)) {
      query.provider = providerId;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query.$or = [
        { "medicalCenter.name": searchRegex },
        { "provider.name": searchRegex },
        { "foodPlan.name": searchRegex },
        { "enteredFoods.food.name": searchRegex },
      ];
    }

    let startDateFilter: Date | undefined;
    let endDateFilter: Date | undefined;

    if (period) {
      const today = new Date();
      if (period === "lastWeek") {
        startDateFilter = subWeeks(today, 1);
      } else if (period === "lastMonth") {
        startDateFilter = subMonths(today, 1);
      } else if (period === "lastYear") {
        startDateFilter = subYears(today, 1);
      }
      if (startDateFilter) {
        query.entryDate = {
          $gte: startOfDay(startDateFilter),
          $lte: endOfDay(today),
        };
      }
    }

    const foodEntries = await FoodEntry.find(query)
      .populate("medicalCenter", "name")
      .populate("provider", "name")
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

    // --- Colores y Estilos para el informe Excel ---
    const headerRowColor = "ADD8E6"; // Azul claro para el fondo de las cabeceras
    const textColor = "1F4E79"; // Azul oscuro para el texto
    const borderColor = "4682B4"; // Azul medio para los bordes

    // Configurar encabezados de columna
    worksheet.columns = [
      { header: "Fecha de Entrada", key: "entryDate", width: 18 },
      { header: "Centro Médico", key: "medicalCenter", width: 25 },
      { header: "Proveedor", key: "provider", width: 25 },
      { header: "Plan de Alimentos", key: "foodPlan", width: 25 },
      { header: "Alimento", key: "foodName", width: 25 },
      { header: "Cantidad", key: "quantity", width: 15 },
      { header: "Unidad", key: "unitOfMeasurement", width: 15 },
    ];

    // Aplicar estilos a la fila de cabecera
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: `FF${textColor}` }, // FF para opacidad total
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${headerRowColor}` }, // FF para opacidad total
      };
      cell.border = {
        top: { style: "thin", color: { argb: `FF${borderColor}` } },
        left: { style: "thin", color: { argb: `FF${borderColor}` } },
        bottom: { style: "thin", color: { argb: `FF${borderColor}` } },
        right: { style: "thin", color: { argb: `FF${borderColor}` } },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Llenar datos y aplicar estilos
    foodEntries.forEach((entry) => {
      entry.enteredFoods.forEach((foodItem) => {
        const row = worksheet.addRow({
          entryDate: format(new Date(entry.entryDate), "dd/MM/yyyy HH:mm"), // Add time to date format
          medicalCenter: (entry.medicalCenter as any)?.name || "N/A",
          provider: (entry.provider as any)?.name || "N/A",
          foodPlan: (entry.foodPlan as any)?.name || "N/A",
          foodName: (foodItem.food as any)?.name || "N/A",
          quantity: foodItem.quantity,
          unitOfMeasurement:
            (foodItem.food as any)?.unitOfMeasurement?.symbol || "N/A",
        });

        // Aplicar estilos a las celdas de datos
        row.eachCell((cell) => {
          cell.font = {
            color: { argb: `FF${textColor}` },
          };
          cell.border = {
            top: { style: "thin", color: { argb: `FF${borderColor}` } },
            left: { style: "thin", color: { argb: `FF${borderColor}` } },
            bottom: { style: "thin", color: { argb: `FF${borderColor}` } },
            right: { style: "thin", color: { argb: `FF${borderColor}` } },
          };
          cell.alignment = { vertical: "middle", horizontal: "left" }; // Alineación por defecto a la izquierda
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
    res.status(500).json({
      message: "Error interno del servidor al exportar entradas de alimentos.",
    });
  }
};

// Exportar a Word
export const exportFoodEntriesToWord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { search, medicalCenterId, providerId, foodPlanId, foodId, period } =
      req.query;

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

    if (providerId && isValidObjectId(providerId)) {
      query.provider = providerId;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query.$or = [
        { "medicalCenter.name": searchRegex },
        { "provider.name": searchRegex },
        { "foodPlan.name": searchRegex },
        { "enteredFoods.food.name": searchRegex },
      ];
    }

    let startDateFilter: Date | undefined;
    let endDateFilter: Date | undefined;

    if (period) {
      const today = new Date();
      if (period === "lastWeek") {
        startDateFilter = subWeeks(today, 1);
      } else if (period === "lastMonth") {
        startDateFilter = subMonths(today, 1);
      } else if (period === "lastYear") {
        startDateFilter = subYears(today, 1);
      }
      if (startDateFilter) {
        query.entryDate = {
          $gte: startOfDay(startDateFilter),
          $lte: endOfDay(today),
        };
      }
    }

    const foodEntries = await FoodEntry.find(query)
      .populate("medicalCenter", "name")
      .populate("provider", "name")
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

    // --- Colores Azulados para el informe ---
    const textColor = "1F4E79"; // Azul oscuro para el texto
    const borderColor = "4682B4"; // Azul medio para los bordes

    // Ruta al logo (ajusta esta ruta según donde tengas tu imagen)
    const logoPath = path.join(__dirname, "../assets/Imagen1.png");
    let logoBuffer: Buffer | undefined;
    let logoUint8Array: Uint8Array | undefined;

    try {
      logoBuffer = fs.readFileSync(logoPath);
      logoUint8Array = new Uint8Array(logoBuffer);
    } catch (logoError) {
      console.warn(
        "Advertencia: No se pudo cargar el logo. Asegúrate de que la ruta sea correcta:",
        logoPath
      );
    }

    const tableHeaderCells = [
      "Fecha de Entrada",
      "Centro Médico",
      "Proveedor",
      "Plan de Alimentos",
      "Alimento",
      "Cantidad",
      "Unidad",
    ].map(
      (headerText) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: headerText,
                  bold: true,
                  color: textColor,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          verticalAlign: VerticalAlign.CENTER,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 8, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 8, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 8, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 8, color: borderColor },
          },
        })
    );

    const tableRows = [
      new TableRow({
        children: tableHeaderCells,
      }),
    ];

    foodEntries.forEach((entry) => {
      entry.enteredFoods.forEach((item) => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: format(
                          new Date(entry.entryDate),
                          "dd/MM/yyyy HH:mm"
                        ),
                        color: textColor,
                      }),
                    ],
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  right: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: (entry.medicalCenter as any)?.name || "N/A",
                        color: textColor,
                      }),
                    ],
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  right: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: (entry.provider as any)?.name || "N/A",
                        color: textColor,
                      }),
                    ],
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  right: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: (entry.foodPlan as any)?.name || "N/A",
                        color: textColor,
                      }),
                    ],
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  right: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: (item.food as any)?.name || "N/A",
                        color: textColor,
                      }),
                    ],
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  right: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: item.quantity.toString(),
                        color: textColor,
                      }),
                    ],
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  right: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text:
                          (item.food as any)?.unitOfMeasurement?.name || "N/A",
                        color: textColor,
                      }),
                    ],
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                  right: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: borderColor,
                  },
                },
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
            // Añadir el logo al principio del documento si está disponible
            ...(logoUint8Array
              ? [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: logoUint8Array,
                        type: "png", // Especificar el tipo de imagen como cadena literal
                        transformation: {
                          width: 100,
                          height: 100,
                        },
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                  }),
                ]
              : []),
            // Título del informe
            new Paragraph({
              children: [
                new TextRun({
                  text: "Informe de Entradas de Alimentos",
                  bold: true,
                  size: 48, // Tamaño de fuente en half-points (24pt * 2)
                  color: textColor,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            // Título para la tabla
            new Paragraph({
              children: [
                new TextRun({
                  text: "Detalles de Entradas de Alimentos",
                  bold: true,
                  size: 28, // Tamaño de fuente en half-points (14pt * 2)
                  color: textColor,
                }),
              ],
              spacing: { before: 200, after: 100 },
              alignment: AlignmentType.CENTER,
            }),
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
            // Sección del analista
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "_____________________________",
                  break: 1,
                  color: textColor,
                }),
                new TextRun({
                  text: "Firma del Responsable",
                  break: 1,
                  bold: true,
                  color: textColor,
                }),
                new TextRun({
                  text: "",
                  break: 1,
                  italics: true,
                  color: textColor,
                }),
              ],
              spacing: { before: 400 },
            }),
            // Fin del informe
            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                  bold: true,
                  color: textColor,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
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
    res.status(500).json({
      message: "Error interno del servidor al exportar entradas de alimentos.",
    });
  }
};
