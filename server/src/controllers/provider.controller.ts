// server/src/controllers/provider.controller.ts
import { Request, Response } from "express";
import Provider from "../models/provider.model";
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

const handleMongooseValidationError = (res: Response, error: any): void => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({ message: messages.join(", ") });
  } else {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Crear un nuevo proveedor (Solo administradores) - RF-8
export const createProvider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Desestructurar email y phoneNumber
    const { name, email, phoneNumber, address } = req.body;

    if (!name) {
      res
        .status(400)
        .json({ message: "El nombre del proveedor es requerido." });
      return;
    }

    const existingProvider = await Provider.findOne({ name });
    if (existingProvider) {
      res
        .status(400)
        .json({ message: "Un proveedor con este nombre ya existe." });
      return;
    }

    // Usar email y phoneNumber
    const newProvider = new Provider({ name, email, phoneNumber, address });
    await newProvider.save();
    res.status(201).json(newProvider);
  } catch (error: any) {
    console.error("Error al crear proveedor:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Obtener todos los proveedores con paginación, búsqueda y filtros (Usuarios autenticados) - RF-8
export const getAllProviders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    // CAMBIO: Ordenar por 'createdAt' por defecto para que los nuevos aparezcan al final
    const sort = (req.query.sort as string) || "createdAt";
    const order = (req.query.order as string) === "desc" ? -1 : 1; // 1 para ascendente (más antiguo al principio, más nuevo al final)

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }, // CAMBIO: Buscar por email
        { phoneNumber: { $regex: search, $options: "i" } }, // CAMBIO: Buscar por phoneNumber
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const totalProviders = await Provider.countDocuments(query);
    const providers = await Provider.find(query)
      .sort({ [sort]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: providers,
      currentPage: page,
      totalPages: Math.ceil(totalProviders / limit),
      totalItems: totalProviders,
    });
  } catch (error: any) {
    console.error("Error al obtener proveedores:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener proveedores." });
  }
};

// Obtener un proveedor por ID (Usuarios autenticados) - RF-8
export const getProviderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      res.status(404).json({ message: "Proveedor no encontrado." });
      return;
    }
    res.status(200).json(provider);
  } catch (error: any) {
    console.error("Error al obtener proveedor:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener proveedor." });
  }
};

// Actualizar un proveedor por ID (Solo administradores) - RF-8
export const updateProvider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Desestructurar email y phoneNumber
    const { name, email, phoneNumber, address } = req.body;

    const updatedProvider = await Provider.findByIdAndUpdate(
      req.params.id,
      { name, email, phoneNumber, address }, // CAMBIO: Actualizar email y phoneNumber
      { new: true, runValidators: true }
    );

    if (!updatedProvider) {
      res
        .status(404)
        .json({ message: "Proveedor no encontrado para actualizar." });
      return;
    }
    res.status(200).json(updatedProvider);
  } catch (error: any) {
    console.error("Error al actualizar proveedor:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Eliminar un proveedor por ID (Solo administradores) - RF-8
export const deleteProvider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deletedProvider = await Provider.findByIdAndDelete(req.params.id);

    if (!deletedProvider) {
      res
        .status(404)
        .json({ message: "Proveedor no encontrado para eliminar." });
      return;
    }
    res.status(200).json({ message: "Proveedor eliminado exitosamente." });
  } catch (error: any) {
    console.error("Error al eliminar proveedor:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al eliminar proveedor." });
  }
};

// === FUNCIONES DE EXPORTACIÓN ===

// Exportar proveedores a Excel
export const exportProvidersToExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const sort = (req.query.sort as string) || "createdAt";
    const order = (req.query.order as string) === "desc" ? -1 : 1;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const providers = await Provider.find(query).sort({ [sort]: order });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Proveedores");

    // --- Colores y Estilos para el informe Excel (similares a Word) ---
    const headerRowColor = "ADD8E6"; // Azul claro para el fondo de las cabeceras
    const textColor = "1F4E79"; // Azul oscuro para el texto
    const borderColor = "4682B4"; // Azul medio para los bordes

    // Cabeceras de la tabla
    worksheet.columns = [
      { header: "Nombre", key: "name", width: 30 },
      { header: "Correo Electrónico", key: "email", width: 40 },
      { header: "Teléfono Fijo", key: "phoneNumber", width: 20 },
      { header: "Dirección", key: "address", width: 50 },
      { header: "Fecha de Creación", key: "createdAt", width: 20 },
      { header: "Última Actualización", key: "updatedAt", width: 20 },
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

    // Añadir filas con datos y aplicar estilos
    providers.forEach((provider) => {
      const row = worksheet.addRow({
        name: provider.name,
        email: provider.email || "N/A",
        phoneNumber: provider.phoneNumber || "N/A",
        address: provider.address || "N/A",
        createdAt: provider.createdAt
          ? new Date(provider.createdAt).toLocaleString()
          : "N/A",
        updatedAt: provider.updatedAt
          ? new Date(provider.updatedAt).toLocaleString()
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
      "attachment; filename=" + `proveedores_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error("Error al exportar proveedores a Excel:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Excel." });
  }
};

// Exportar proveedores a Word
export const exportProvidersToWord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const sort = (req.query.sort as string) || "createdAt";
    const order = (req.query.order as string) === "desc" ? -1 : 1;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const providers = await Provider.find(query).sort({ [sort]: order });

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
      "Correo Electrónico",
      "Teléfono Fijo",
      "Dirección",
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

    providers.forEach((provider) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: provider.name,
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
                      text: provider.email || "N/A",
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
                      text: provider.phoneNumber || "N/A",
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
                      text: provider.address || "N/A",
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
                      text: provider.createdAt
                        ? new Date(provider.createdAt).toLocaleString()
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
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: provider.updatedAt
                        ? new Date(provider.updatedAt).toLocaleString()
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
            // Título del informe
            new Paragraph({
              children: [
                new TextRun({
                  text: "Informe de Proveedores",
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
                  text: "Detalles de Proveedores",
                  bold: true,
                  size: 28, // Tamaño de fuente en half-points (14pt * 2)
                  color: textColor,
                }),
              ],
              spacing: { before: 200, after: 100 },
              alignment: AlignmentType.CENTER,
            }),
            // Tabla de proveedores
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
      "attachment; filename=" + `proveedores_${Date.now()}.docx`
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("Error al exportar proveedores a Word:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Word." });
  }
};
