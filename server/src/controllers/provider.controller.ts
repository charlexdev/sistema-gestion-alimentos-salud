// server/src/controllers/provider.controller.ts
import { Request, Response } from "express";
import Provider from "../models/provider.model";
import ExcelJS from "exceljs"; // Importa exceljs
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
} from "docx"; // Importa docx

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
    const { name, contactInfo, address } = req.body;

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

    const newProvider = new Provider({ name, contactInfo, address });
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
    const sort = (req.query.sort as string) || "name";
    const order = (req.query.order as string) === "desc" ? -1 : 1;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactInfo: { $regex: search, $options: "i" } },
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
    const { name, contactInfo, address } = req.body;

    const updatedProvider = await Provider.findByIdAndUpdate(
      req.params.id,
      { name, contactInfo, address },
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

// === NUEVAS FUNCIONES DE EXPORTACIÓN ===

// Exportar proveedores a Excel
export const exportProvidersToExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const sort = (req.query.sort as string) || "name";
    const order = (req.query.order as string) === "desc" ? -1 : 1;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactInfo: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const providers = await Provider.find(query).sort({ [sort]: order });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Proveedores");

    worksheet.columns = [
      { header: "Nombre", key: "name", width: 30 },
      { header: "Información de Contacto", key: "contactInfo", width: 40 },
      { header: "Dirección", key: "address", width: 50 },
      { header: "Fecha de Creación", key: "createdAt", width: 20 },
      { header: "Última Actualización", key: "updatedAt", width: 20 },
    ];

    providers.forEach((provider) => {
      worksheet.addRow({
        name: provider.name,
        contactInfo: provider.contactInfo,
        address: provider.address,
        createdAt: provider.createdAt
          ? provider.createdAt.toLocaleDateString()
          : "",
        updatedAt: provider.updatedAt
          ? provider.updatedAt.toLocaleDateString()
          : "",
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
    const sort = (req.query.sort as string) || "name";
    const order = (req.query.order as string) === "desc" ? -1 : 1;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactInfo: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const providers = await Provider.find(query).sort({ [sort]: order });

    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Nombre", bold: true, size: 24 }),
                ],
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
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Información de Contacto",
                    bold: true,
                    size: 24,
                  }),
                ],
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
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Dirección", bold: true, size: 24 }),
                ],
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
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Fecha de Creación",
                    bold: true,
                    size: 24,
                  }),
                ],
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
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Última Actualización",
                    bold: true,
                    size: 24,
                  }),
                ],
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

    providers.forEach((provider) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(provider.name)],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
            new TableCell({
              children: [new Paragraph(provider.contactInfo || "N/A")],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
            }),
            new TableCell({
              children: [new Paragraph(provider.address || "N/A")],
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
                  provider.createdAt
                    ? provider.createdAt.toLocaleDateString()
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
            new TableCell({
              children: [
                new Paragraph(
                  provider.updatedAt
                    ? provider.updatedAt.toLocaleDateString()
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
                  text: "Reporte de Proveedores",
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
