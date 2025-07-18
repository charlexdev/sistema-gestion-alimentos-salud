import { Request, Response } from "express";
import Stock from "../models/stock.model";
import { isValidObjectId } from "mongoose";
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

    const headerRowColor = "ADD8E6"; // Azul claro
    const textColor = "1F4E79"; // Azul oscuro
    const borderColor = "4682B4"; // Azul medio

    worksheet.columns = [
      { header: "Centro Médico", key: "medicalCenter", width: 30 },
      { header: "Alimento", key: "food", width: 30 },
      { header: "Cantidad en Stock", key: "quantity", width: 20 },
      { header: "Unidad de Medida", key: "unitOfMeasurement", width: 20 },
      { header: "Última Actualización", key: "updatedAt", width: 25 },
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

    stock.forEach((s) => {
      const row = worksheet.addRow({
        medicalCenter: (s.medicalCenter as any)?.name || "N/A",
        food: (s.food as any)?.name || "N/A",
        quantity: s.quantity,
        unitOfMeasurement: (s.food as any)?.unitOfMeasurement?.name || "N/A",
        updatedAt: s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "N/A",
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

    const textColor = "1F4E79"; // Azul oscuro
    const borderColor = "4682B4"; // Azul medio

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
      "Centro Médico",
      "Alimento",
      "Cantidad en Stock",
      "Unidad de Medida",
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

    stock.forEach((s) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: (s.medicalCenter as any)?.name || "N/A",
                      color: textColor,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
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
                      text: (s.food as any)?.name || "N/A",
                      color: textColor,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
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
                      text: s.quantity.toString(),
                      color: textColor,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
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
                      text: (s.food as any)?.unitOfMeasurement?.name || "N/A",
                      color: textColor,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
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
                      text: s.updatedAt
                        ? new Date(s.updatedAt).toLocaleString()
                        : "N/A",
                      color: textColor,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
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
                  text: "Informe de Existencias",
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
                  text: "Detalles de Existencias",
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
