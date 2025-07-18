// server/src/controllers/medicalCenter.controller.ts
import { Request, Response } from "express";
import MedicalCenter from "../models/medicalCenter.model";
import Stock from "../models/stock.model"; // Necesario para el stock
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
  ImageRun, // Importado para insertar imágenes
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

// Crear un nuevo Centro Médico (Solo administradores)
export const createMedicalCenter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, address, email, phoneNumber } = req.body;

    if (!name || !address) {
      res.status(400).json({
        message: "El nombre y la dirección del centro médico son obligatorios.",
      });
      return;
    }

    // Validación del middleware del modelo para al menos un contacto
    if (!email && !phoneNumber) {
      res.status(400).json({
        message:
          "Introduzca al menos un método de contacto (correo o teléfono).",
      });
      return;
    }

    const existingMedicalCenter = await MedicalCenter.findOne({ name });
    if (existingMedicalCenter) {
      res
        .status(400)
        .json({ message: "Ya existe un centro médico con este nombre." });
      return;
    }

    const newMedicalCenter = new MedicalCenter({
      name,
      address,
      email,
      phoneNumber,
    });

    await newMedicalCenter.save();
    res.status(201).json(newMedicalCenter);
  } catch (error: any) {
    console.error("Error al crear centro médico:", error.message);
    // Usar el manejador de errores específico para Mongoose
    handleMongooseValidationError(res, error);
  }
};

// Obtener todos los Centros Médicos con paginación, búsqueda
export const getAllMedicalCenters = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const totalItems = await MedicalCenter.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const medicalCenters = await MedicalCenter.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: medicalCenters,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error: any) {
    console.error("Error al obtener centros médicos:", error.message);
    res.status(500).json({
      message: "Error interno del servidor al obtener centros médicos.",
    });
  }
};

// Obtener un Centro Médico por ID
export const getMedicalCenterById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de centro médico no válido." });
      return;
    }
    const medicalCenter = await MedicalCenter.findById(req.params.id);
    if (!medicalCenter) {
      res.status(404).json({ message: "Centro médico no encontrado." });
      return;
    }
    res.status(200).json(medicalCenter);
  } catch (error: any) {
    console.error("Error al obtener centro médico por ID:", error.message);
    res.status(500).json({
      message: "Error interno del servidor al obtener centro médico.",
    });
  }
};

// Actualizar un Centro Médico por ID (Solo administradores)
export const updateMedicalCenter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, address, email, phoneNumber } = req.body;

    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de centro médico no válido." });
      return;
    }

    // Si se están actualizando los campos de contacto, validar al menos uno
    if (
      (email !== undefined || phoneNumber !== undefined) &&
      !email &&
      !phoneNumber
    ) {
      res.status(400).json({
        message:
          "Introduzca al menos un método de contacto (correo o teléfono) al actualizar.",
      });
      return;
    }

    const updatedMedicalCenter = await MedicalCenter.findByIdAndUpdate(
      req.params.id,
      { name, address, email, phoneNumber },
      { new: true, runValidators: true } // runValidators para que el middleware `pre('save')` se ejecute en `findByIdAndUpdate`
    );

    if (!updatedMedicalCenter) {
      res
        .status(404)
        .json({ message: "Centro médico no encontrado para actualizar." });
      return;
    }
    res.status(200).json(updatedMedicalCenter);
  } catch (error: any) {
    console.error("Error al actualizar centro médico:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Eliminar un Centro Médico por ID (Solo administradores)
export const deleteMedicalCenter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de centro médico no válido." });
      return;
    }
    // TODO: Considerar si hay planes o entradas asociados a este centro médico
    // Antes de eliminar, quizás deberíamos verificar que no tenga dependencias o
    // implementar una estrategia de "soft delete" o cascada.
    const deletedMedicalCenter = await MedicalCenter.findByIdAndDelete(
      req.params.id
    );

    if (!deletedMedicalCenter) {
      res
        .status(404)
        .json({ message: "Centro médico no encontrado para eliminar." });
      return;
    }
    res.status(200).json({ message: "Centro médico eliminado exitosamente." });
  } catch (error: any) {
    console.error("Error al eliminar centro médico:", error.message);
    res.status(500).json({
      message: "Error interno del servidor al eliminar centro médico.",
    });
  }
};

// Obtener el stock de un centro médico por ID (Usuarios autenticados)
export const getMedicalCenterStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de centro médico no válido." });
      return;
    }

    const medicalCenterId = req.params.id;

    // Comprobar si el centro médico existe
    const existingMedicalCenter = await MedicalCenter.findById(medicalCenterId);
    if (!existingMedicalCenter) {
      res.status(404).json({ message: "Centro médico no encontrado." });
      return;
    }

    const stock = await Stock.find({ medicalCenter: medicalCenterId })
      .populate("food", "name unitOfMeasurement") // Popula el alimento
      .populate({
        path: "food",
        populate: {
          path: "unitOfMeasurement", // Popula la unidad de medida dentro del alimento
          select: "name symbol",
        },
        select: "name description", // Selecciona los campos del alimento
      });

    res.status(200).json(stock);
  } catch (error: any) {
    console.error(
      "Error al obtener el stock del centro médico:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener el stock." });
  }
};

// Exportar Centros Médicos a Excel (Accesible para todos los usuarios autenticados)
export const exportMedicalCentersToExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const medicalCenters = await MedicalCenter.find(query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Centros Médicos");

    // --- Colores y Estilos para el informe Excel (similares a Word) ---
    const headerRowColor = "ADD8E6"; // Azul claro para el fondo de las cabeceras
    const textColor = "1F4E79"; // Azul oscuro para el texto
    const borderColor = "4682B4"; // Azul medio para los bordes

    worksheet.columns = [
      { header: "Nombre", key: "name", width: 30 },
      { header: "Dirección", key: "address", width: 40 },
      { header: "Correo Electrónico", key: "email", width: 30 },
      { header: "Teléfono Fijo", key: "phoneNumber", width: 20 },
      { header: "Fecha de Creación", key: "createdAt", width: 20 },
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

    medicalCenters.forEach((mc) => {
      const row = worksheet.addRow({
        name: mc.name,
        address: mc.address,
        email: mc.email || "N/A",
        phoneNumber: mc.phoneNumber || "N/A",
        createdAt: mc.createdAt
          ? new Date(mc.createdAt).toLocaleString()
          : "N/A",
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

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `centros_medicos_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error("Error al exportar centros médicos a Excel:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Excel." });
  }
};

// Exportar Centros Médicos a Word (Accesible para todos los usuarios autenticados)
export const exportMedicalCentersToWord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const medicalCenters = await MedicalCenter.find(query);

    // --- Colores Azulados para el informe ---
    const textColor = "1F4E79"; // Azul oscuro para el texto
    const borderColor = "4682B4"; // Azul medio para los bordes

    // Ruta al logo (ajusta esta ruta según donde tengas tu imagen, por ejemplo: server/src/assets/Imagen1.png)
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

    // Cabeceras de la tabla con colores y alineación (sin sombreado)
    const tableHeaderCells = [
      "Nombre",
      "Dirección",
      "Correo Electrónico",
      "Teléfono Fijo",
      "Fecha de Creación",
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

    medicalCenters.forEach((mc) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: mc.name, color: textColor })],
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
                    new TextRun({ text: mc.address, color: textColor }),
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
                    new TextRun({ text: mc.email || "N/A", color: textColor }),
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
                      text: mc.phoneNumber || "N/A",
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
                      text: mc.createdAt
                        ? new Date(mc.createdAt).toLocaleString()
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
                  text: "Informe de Centros Médicos",
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
                  text: "Detalles de Centros Médicos",
                  bold: true,
                  size: 28, // Tamaño de fuente en half-points (14pt * 2)
                  color: textColor,
                }),
              ],
              spacing: { before: 200, after: 100 },
              alignment: AlignmentType.CENTER,
            }),
            // Tabla de alimentos
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
      "attachment; filename=" + `centros_medicos_${Date.now()}.docx`
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("Error al exportar centros médicos a Word:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Word." });
  }
};
