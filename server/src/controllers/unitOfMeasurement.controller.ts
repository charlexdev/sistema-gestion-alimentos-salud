import { Request, Response } from "express";
import UnitOfMeasurement from "../models/unitOfMeasurement.model";
import ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
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
  AlignmentType,
  ImageRun,
} from "docx";

const handleMongooseValidationError = (res: Response, error: any): void => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({ message: messages.join(", ") });
  } else {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

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

export const exportUnitsToExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query: any = {};
    const searchQuery = req.query.search as string;

    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { symbol: { $regex: searchQuery, $options: "i" } },
      ];
    }
    const units = await UnitOfMeasurement.find(query).sort({ name: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Unidades de Medida");

    const headerRowColor = "ADD8E6"; // Azul claro para el fondo de las cabeceras
    const textColor = "1F4E79"; // Azul oscuro para el texto
    const borderColor = "4682B4"; // Azul medio para los bordes

    worksheet.columns = [
      { header: "ID", key: "_id", width: 30 },
      { header: "Nombre", key: "name", width: 25 },
      { header: "Símbolo", key: "symbol", width: 15 },
      { header: "Fecha de Creación", key: "createdAt", width: 20 },
      { header: "Última Actualización", key: "updatedAt", width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: `FF${textColor}` },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${headerRowColor}` },
      };
      cell.border = {
        top: { style: "thin", color: { argb: `FF${borderColor}` } },
        left: { style: "thin", color: { argb: `FF${borderColor}` } },
        bottom: { style: "thin", color: { argb: `FF${borderColor}` } },
        right: { style: "thin", color: { argb: `FF${borderColor}` } },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    units.forEach((unit) => {
      const row = worksheet.addRow({
        _id: unit._id.toString(),
        name: unit.name,
        symbol: unit.symbol || "N/A",
        createdAt: new Date(unit.createdAt).toLocaleDateString(),
        updatedAt: new Date(unit.updatedAt).toLocaleDateString(),
      });

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
        cell.alignment = { vertical: "middle", horizontal: "left" };
      });
    });

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

export const exportUnitsToWord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query: any = {};
    const searchQuery = req.query.search as string;

    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { symbol: { $regex: searchQuery, $options: "i" } },
      ];
    }
    const units = await UnitOfMeasurement.find(query).sort({ name: 1 });

    const textColor = "1F4E79"; // Azul oscuro para el texto
    const borderColor = "4682B4"; // Azul medio para los bordes

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
      "ID",
      "Nombre",
      "Símbolo",
      "Fecha de Creación",
      "Última Actualización",
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

    units.forEach((unit) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: unit._id.toString(),
                      color: textColor,
                    }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
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
                    new TextRun({ text: unit.name, color: textColor }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
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
                      text: unit.symbol || "N/A",
                      color: textColor,
                    }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
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
                      text: new Date(unit.createdAt).toLocaleDateString(),
                      color: textColor,
                    }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
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
                      text: new Date(unit.updatedAt).toLocaleDateString(),
                      color: textColor,
                    }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
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

    const doc = new Document({
      sections: [
        {
          children: [
            ...(logoUint8Array
              ? [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: logoUint8Array,
                        type: "png",
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
            new Paragraph({
              children: [
                new TextRun({
                  text: "Informe de Unidades de Medida",
                  bold: true,
                  size: 48,
                  color: textColor,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Detalles de Unidades de Medida",
                  bold: true,
                  size: 28,
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
