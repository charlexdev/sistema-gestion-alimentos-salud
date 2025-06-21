// server/src/controllers/food.controller.ts
import { Request, Response } from "express";
import Food from "../models/food.model";
import UnitOfMeasurement from "../models/unitOfMeasurement.model"; // Importar el modelo de unidad
import { isValidObjectId } from "mongoose"; // Para validar ObjectIDs
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

// Función auxiliar para manejar errores de validación de Mongoose
const handleMongooseValidationError = (res: Response, error: any): void => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({ message: messages.join(", ") });
  } else {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Crear un nuevo alimento (Solo administradores)
export const createFood = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, unitOfMeasurementId, description } = req.body;

    if (!name || !unitOfMeasurementId) {
      res.status(400).json({
        message:
          "Por favor, proporciona el nombre y el ID de la unidad de medida del alimento.",
      });
      return;
    }

    if (!isValidObjectId(unitOfMeasurementId)) {
      res.status(400).json({ message: "ID de unidad de medida no válido." });
      return;
    }

    const existingUnit = await UnitOfMeasurement.findById(unitOfMeasurementId);
    if (!existingUnit) {
      res
        .status(404)
        .json({ message: "La unidad de medida especificada no existe." });
      return;
    }

    const existingFood = await Food.findOne({ name });
    if (existingFood) {
      res
        .status(400)
        .json({ message: "Un alimento con este nombre ya existe." });
      return;
    }

    const newFood = new Food({
      name,
      unitOfMeasurement: unitOfMeasurementId,
      description,
    });

    await newFood.save();
    // Popular la unidad de medida para la respuesta
    await newFood.populate("unitOfMeasurement", "name symbol");
    res.status(201).json(newFood);
  } catch (error: any) {
    console.error("Error al crear alimento:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Obtener todos los alimentos con paginación, búsqueda y filtros
export const getAllFoods = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const unitOfMeasurementId = (req.query.unitOfMeasurementId as string) || "";

    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (unitOfMeasurementId && isValidObjectId(unitOfMeasurementId)) {
      query.unitOfMeasurement = unitOfMeasurementId;
    }

    const totalItems = await Food.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const foods = await Food.find(query)
      .populate("unitOfMeasurement", "name symbol") // Asegúrate de popular aquí
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: foods,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error: any) {
    console.error("Error al obtener alimentos:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener alimentos." });
  }
};

// Obtener un alimento por ID
export const getFoodById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de alimento no válido." });
      return;
    }
    const food = await Food.findById(req.params.id).populate(
      "unitOfMeasurement",
      "name symbol"
    );
    if (!food) {
      res.status(404).json({ message: "Alimento no encontrado." });
      return;
    }
    res.status(200).json(food);
  } catch (error: any) {
    console.error("Error al obtener alimento por ID:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener alimento." });
  }
};

// Actualizar un alimento por ID (Solo administradores)
export const updateFood = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, unitOfMeasurementId, description } = req.body;

    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de alimento no válido." });
      return;
    }

    // Validar y encontrar la unidad de medida si se proporciona
    let unitOfMeasurementToUpdate = null;
    if (unitOfMeasurementId) {
      if (!isValidObjectId(unitOfMeasurementId)) {
        res.status(400).json({ message: "ID de unidad de medida no válido." });
        return;
      }
      unitOfMeasurementToUpdate = await UnitOfMeasurement.findById(
        unitOfMeasurementId
      );
      if (!unitOfMeasurementToUpdate) {
        res.status(404).json({
          message:
            "La unidad de medida proporcionada no es válida o no existe.",
        });
        return;
      }
    }

    const updatedFood = await Food.findByIdAndUpdate(
      req.params.id,
      {
        name,
        unitOfMeasurement: unitOfMeasurementId, // Asignar el ID si se proporciona, de lo contrario no actualizar el campo
        description,
      },
      { new: true, runValidators: true }
    );

    if (!updatedFood) {
      res
        .status(404)
        .json({ message: "Alimento no encontrado para actualizar." });
      return;
    }
    // Opcional: Popular la unidad para la respuesta
    await updatedFood.populate("unitOfMeasurement", "name symbol");
    res.status(200).json(updatedFood);
  } catch (error: any) {
    console.error("Error al actualizar alimento:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Eliminar un alimento por ID (Solo administradores)
export const deleteFood = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de alimento no válido." });
      return;
    }
    const deletedFood = await Food.findByIdAndDelete(req.params.id);

    if (!deletedFood) {
      res
        .status(404)
        .json({ message: "Alimento no encontrado para eliminar." });
      return;
    }
    res.status(200).json({ message: "Alimento eliminado exitosamente." });
  } catch (error: any) {
    console.error("Error al eliminar alimento:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al eliminar alimento." });
  }
};

// Exportar alimentos a Excel (Accesible para todos los usuarios autenticados)
export const exportFoodsToExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const unitOfMeasurementId = (req.query.unitOfMeasurementId as string) || "";

    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (unitOfMeasurementId && isValidObjectId(unitOfMeasurementId)) {
      query.unitOfMeasurement = unitOfMeasurementId;
    }

    const foods = await Food.find(query).populate(
      "unitOfMeasurement",
      "name symbol"
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Alimentos");

    // Cabeceras de la tabla
    worksheet.columns = [
      { header: "Nombre", key: "name", width: 30 },
      { header: "Unidad de Medida", key: "unitOfMeasurement", width: 25 },
      { header: "Símbolo", key: "symbol", width: 15 },
      { header: "Descripción", key: "description", width: 40 },
      { header: "Fecha de Creación", key: "createdAt", width: 20 },
    ];

    // Añadir filas con datos
    foods.forEach((food) => {
      worksheet.addRow({
        name: food.name,
        unitOfMeasurement: (food.unitOfMeasurement as any)?.name || "N/A", // Acceder al nombre
        symbol: (food.unitOfMeasurement as any)?.symbol || "N/A", // Acceder al símbolo
        description: food.description,
        createdAt: food.createdAt
          ? new Date(food.createdAt).toLocaleString()
          : "N/A",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `alimentos_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error("Error al exportar alimentos a Excel:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Excel." });
  }
};

// Exportar alimentos a Word (Accesible para todos los usuarios autenticados)
export const exportFoodsToWord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const unitOfMeasurementId = (req.query.unitOfMeasurementId as string) || "";

    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (unitOfMeasurementId && isValidObjectId(unitOfMeasurementId)) {
      query.unitOfMeasurement = unitOfMeasurementId;
    }

    const foods = await Food.find(query).populate(
      "unitOfMeasurement",
      "name symbol"
    );

    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: "Nombre", thematicBreak: true })],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({ text: "Unidad de Medida", thematicBreak: true }),
            ],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new TableCell({
            children: [new Paragraph({ text: "Símbolo", thematicBreak: true })],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({ text: "Descripción", thematicBreak: true }),
            ],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({ text: "Fecha de Creación", thematicBreak: true }),
            ],
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

    foods.forEach((food) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(food.name)],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph((food.unitOfMeasurement as any)?.name || "N/A"),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph((food.unitOfMeasurement as any)?.symbol || "N/A"),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
            new TableCell({
              children: [new Paragraph(food.description || "Sin descripción")],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph(
                  food.createdAt
                    ? new Date(food.createdAt).toLocaleString()
                    : "N/A"
                ),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
          ],
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Reporte de Alimentos",
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
      "attachment; filename=" + `alimentos_${Date.now()}.docx`
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("Error al exportar alimentos a Word:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Word." });
  }
};
