// server/src/controllers/unitOfMeasurement.controller.ts
import { Request, Response } from "express";
import UnitOfMeasurement from "../models/unitOfMeasurement.model";
import ExcelJS from "exceljs"; // Asegúrate de haber instalado exceljs
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
} from "docx"; // Asegúrate de haber instalado docx

// Función auxiliar para manejar errores de validación de Mongoose
const handleMongooseValidationError = (res: Response, error: any): void => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({ message: messages.join(", ") });
  } else {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Crear una nueva unidad de medida (Solo administradores)
export const createUnit = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, symbol } = req.body;

    if (!name) {
      res
        .status(400)
        .json({ message: "El nombre de la unidad de medida es requerido." });
      return;
    }

    const existingUnit = await UnitOfMeasurement.findOne({ name });
    if (existingUnit) {
      res
        .status(400)
        .json({ message: "Una unidad de medida con este nombre ya existe." });
      return;
    }

    const newUnit = new UnitOfMeasurement({
      name,
      symbol,
    });

    await newUnit.save();
    res.status(201).json(newUnit);
  } catch (error: any) {
    console.error("Error al crear unidad de medida:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Obtener todas las unidades de medida con paginación, búsqueda y filtros
export const getAllUnits = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    const searchQuery = req.query.search as string;
    const nameFilter = req.query.name as string;

    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { symbol: { $regex: searchQuery, $options: "i" } },
      ];
    }

    if (nameFilter) {
      query.name = nameFilter;
    }

    const totalCount = await UnitOfMeasurement.countDocuments(query);
    const units = await UnitOfMeasurement.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      unitOfMeasurements: units,
      totalCount,
      currentPage: page,
      totalPages,
    });
  } catch (error: any) {
    console.error("Error al obtener unidades de medida:", error.message);
    res.status(500).json({
      message: "Error interno del servidor al obtener unidades de medida.",
    });
  }
};

// Obtener una unidad de medida por ID (Usuarios autenticados)
export const getUnitById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const unit = await UnitOfMeasurement.findById(req.params.id);
    if (!unit) {
      res.status(404).json({ message: "Unidad de medida no encontrada." });
      return;
    }
    res.status(200).json(unit);
  } catch (error: any) {
    console.error("Error al obtener unidad de medida por ID:", error.message);
    res.status(500).json({
      message: "Error interno del servidor al obtener la unidad de medida.",
    });
  }
};

// Actualizar una unidad de medida por ID (Solo administradores)
export const updateUnit = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, symbol } = req.body;

    const updatedUnit = await UnitOfMeasurement.findByIdAndUpdate(
      req.params.id,
      { name, symbol },
      { new: true, runValidators: true }
    );

    if (!updatedUnit) {
      res
        .status(404)
        .json({ message: "Unidad de medida no encontrada para actualizar." });
      return;
    }
    res.status(200).json(updatedUnit);
  } catch (error: any) {
    console.error("Error al actualizar unidad de medida:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Eliminar una unidad de medida por ID (Solo administradores)
export const deleteUnit = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deletedUnit = await UnitOfMeasurement.findByIdAndDelete(
      req.params.id
    );

    if (!deletedUnit) {
      res
        .status(404)
        .json({ message: "Unidad de medida no encontrada para eliminar." });
      return;
    }
    res
      .status(200)
      .json({ message: "Unidad de medida eliminada exitosamente." });
  } catch (error: any) {
    console.error("Error al eliminar unidad de medida:", error.message);
    res.status(500).json({
      message: "Error interno del servidor al eliminar la unidad de medida.",
    });
  }
};

// Exportar unidades de medida a Excel
export const exportUnitsToExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const units = await UnitOfMeasurement.find().sort({ name: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Unidades de Medida");

    // Definir columnas
    worksheet.columns = [
      { header: "ID", key: "_id", width: 30 },
      { header: "Nombre", key: "name", width: 25 },
      { header: "Símbolo", key: "symbol", width: 15 },
      { header: "Fecha de Creación", key: "createdAt", width: 20 },
      { header: "Última Actualización", key: "updatedAt", width: 20 },
    ];

    // Añadir filas de datos
    units.forEach((unit) => {
      worksheet.addRow({
        _id: unit._id.toString(),
        name: unit.name,
        symbol: unit.symbol || "N/A",
        createdAt: new Date(unit.createdAt).toLocaleDateString(),
        updatedAt: new Date(unit.updatedAt).toLocaleDateString(),
      });
    });

    // Configurar cabeceras de respuesta para descarga
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `unidades_de_medida_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error(
      "Error al exportar unidades de medida a Excel:",
      error.message
    );
    res.status(500).json({
      message: "Error interno del servidor al exportar a Excel.",
    });
  }
};

// Exportar unidades de medida a Word
export const exportUnitsToWord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const units = await UnitOfMeasurement.find().sort({ name: 1 });

    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun("ID")] })],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun("Nombre")] })],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun("Símbolo")] })],
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
              new Paragraph({ children: [new TextRun("Fecha de Creación")] }),
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
              new Paragraph({
                children: [new TextRun("Última Actualización")],
              }),
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

    units.forEach((unit) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(unit._id.toString())],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
            new TableCell({
              children: [new Paragraph(unit.name)],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
            new TableCell({
              children: [new Paragraph(unit.symbol || "N/A")],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph(new Date(unit.createdAt).toLocaleDateString()),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph(new Date(unit.updatedAt).toLocaleDateString()),
              ],
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
                  text: "Reporte de Unidades de Medida",
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
      "attachment; filename=" + `unidades_de_medida_${Date.now()}.docx`
    );
    res.send(buffer);
  } catch (error: any) {
    console.error(
      "Error al exportar unidades de medida a Word:",
      error.message
    );
    res.status(500).json({
      message: "Error interno del servidor al exportar a Word.",
    });
  }
};
