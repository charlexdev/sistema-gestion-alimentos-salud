// server/src/controllers/stock.controller.ts
import { Request, Response } from "express";
import Stock from "../models/stock.model";
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

// Función auxiliar para manejar errores de validación de Mongoose
const handleMongooseValidationError = (res: Response, error: any): void => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({ message: messages.join(", ") });
  } else {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Obtener todas las existencias (vista global) con filtros y paginación
export const getAllStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const medicalCenterId = (req.query.medicalCenterId as string) || "";
    const foodId = (req.query.foodId as string) || "";

    const query: any = {};
    if (medicalCenterId && isValidObjectId(medicalCenterId)) {
      query.medicalCenter = medicalCenterId;
    }
    if (foodId && isValidObjectId(foodId)) {
      query.food = foodId;
    }

    const totalItems = await Stock.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const stock = await Stock.find(query)
      .populate("medicalCenter", "name")
      .populate({
        path: "food",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
        select: "name description",
      })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: stock,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error: any) {
    console.error("Error al obtener todas las existencias:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener existencias." });
  }
};

// Exportar Existencias a Excel
export const exportStockToExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicalCenterId = (req.query.medicalCenterId as string) || "";
    const foodId = (req.query.foodId as string) || "";

    const query: any = {};
    if (medicalCenterId && isValidObjectId(medicalCenterId))
      query.medicalCenter = medicalCenterId;
    if (foodId && isValidObjectId(foodId)) query.food = foodId;

    const stock = await Stock.find(query)
      .populate("medicalCenter", "name")
      .populate({
        path: "food",
        populate: { path: "unitOfMeasurement", select: "name symbol" },
        select: "name description",
      });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Existencias");

    worksheet.columns = [
      { header: "Centro Médico", key: "medicalCenter", width: 30 },
      { header: "Alimento", key: "food", width: 30 },
      { header: "Cantidad en Stock", key: "quantity", width: 20 },
      { header: "Unidad de Medida", key: "unitOfMeasurement", width: 20 },
      { header: "Última Actualización", key: "updatedAt", width: 25 },
    ];

    stock.forEach((s) => {
      worksheet.addRow({
        medicalCenter: (s.medicalCenter as any)?.name || "N/A",
        food: (s.food as any)?.name || "N/A",
        quantity: s.quantity,
        unitOfMeasurement: (s.food as any)?.unitOfMeasurement?.name || "N/A",
        updatedAt: s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "N/A",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `existencias_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error("Error al exportar existencias a Excel:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Excel." });
  }
};

// Exportar Existencias a Word
export const exportStockToWord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicalCenterId = (req.query.medicalCenterId as string) || "";
    const foodId = (req.query.foodId as string) || "";

    const query: any = {};
    if (medicalCenterId && isValidObjectId(medicalCenterId))
      query.medicalCenter = medicalCenterId;
    if (foodId && isValidObjectId(foodId)) query.food = foodId;

    const stock = await Stock.find(query)
      .populate("medicalCenter", "name")
      .populate({
        path: "food",
        populate: { path: "unitOfMeasurement", select: "name symbol" },
        select: "name description",
      });

    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: "Centro Médico" })],
          }),
          new TableCell({ children: [new Paragraph({ text: "Alimento" })] }),
          new TableCell({
            children: [new Paragraph({ text: "Cantidad en Stock" })],
          }),
          new TableCell({
            children: [new Paragraph({ text: "Unidad de Medida" })],
          }),
          new TableCell({
            children: [new Paragraph({ text: "Última Actualización" })],
          }),
        ],
      }),
    ];

    stock.forEach((s) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph((s.medicalCenter as any)?.name || "N/A"),
              ],
            }),
            new TableCell({
              children: [new Paragraph((s.food as any)?.name || "N/A")],
            }),
            new TableCell({ children: [new Paragraph(s.quantity.toString())] }),
            new TableCell({
              children: [
                new Paragraph(
                  (s.food as any)?.unitOfMeasurement?.name || "N/A"
                ),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph(
                  s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "N/A"
                ),
              ],
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
                  text: "Reporte de Existencias",
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
      "attachment; filename=" + `existencias_${Date.now()}.docx`
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("Error al exportar existencias a Word:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Word." });
  }
};
