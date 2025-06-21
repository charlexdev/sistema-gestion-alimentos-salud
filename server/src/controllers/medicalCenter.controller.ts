// server/src/controllers/medicalCenter.controller.ts
import { Request, Response } from "express";
import MedicalCenter, { IMedicalCenter } from "../models/medicalCenter.model"; // <--- Asegúrate de importar IMedicalCenter
import FoodEntry from "../models/foodEntry.model";
import mongoose from "mongoose";

// Importaciones para Excel
import * as exceljs from "exceljs";

// Importaciones para Word
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

const handleMongooseValidationError = (res: Response, error: any): void => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({ message: messages.join(", ") });
  } else {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Crear un nuevo centro médico (Solo administradores)
export const createMedicalCenter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, address, contactInfo } = req.body;

    if (!name || !address) {
      res.status(400).json({
        message: "El nombre y la dirección del centro médico son requeridos.",
      });
      return;
    }

    const existingCenter = await MedicalCenter.findOne({ name });
    if (existingCenter) {
      res
        .status(400)
        .json({ message: "Un centro médico con este nombre ya existe." });
      return;
    }

    const newMedicalCenter = new MedicalCenter({ name, address, contactInfo });
    await newMedicalCenter.save();
    res.status(201).json(newMedicalCenter);
  } catch (error: any) {
    console.error("Error al crear centro médico:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Obtener todos los centros médicos (Usuarios autenticados) - ¡MODIFICADO PARA PAGINACIÓN Y FILTROS!
export const getAllMedicalCenters = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const nameFilter = (req.query.name as string) || "";

    let query: any = {};

    if (search) {
      // Búsqueda flexible por nombre, dirección o contacto (insensible a mayúsculas/minúsculas)
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { contactInfo: { $regex: search, $options: "i" } },
      ];
    }

    if (nameFilter) {
      // Filtro exacto por nombre
      query.name = nameFilter;
    }

    const totalCount = await MedicalCenter.countDocuments(query);
    const medicalCenters = await MedicalCenter.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      medicalCenters,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error: any) {
    console.error("Error al obtener centros médicos:", error.message);
    res.status(500).json({
      message: "Error interno del servidor al obtener centros médicos.",
    });
  }
};

// Obtener un centro médico por ID (Usuarios autenticados)
export const getMedicalCenterById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

// Actualizar un centro médico por ID (Solo administradores)
export const updateMedicalCenter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, address, contactInfo } = req.body;

    const updatedMedicalCenter = await MedicalCenter.findByIdAndUpdate(
      req.params.id,
      { name, address, contactInfo },
      { new: true, runValidators: true }
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

// Eliminar un centro médico por ID (Solo administradores)
export const deleteMedicalCenter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

// Exportar centros médicos a Excel
export const exportMedicalCentersToExcel = async (
  req: Request,
  res: Response
) => {
  try {
    const { search, name } = req.query;

    let query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { contactInfo: { $regex: search, $options: "i" } },
      ];
    }
    if (name) {
      query.name = name;
    }

    const medicalCenters = await MedicalCenter.find(query).lean<
      IMedicalCenter[]
    >();

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Centros Médicos");

    worksheet.columns = [
      { header: "Nombre", key: "name", width: 30 },
      { header: "Dirección", key: "address", width: 40 },
      { header: "Contacto", key: "contactInfo", width: 30 },
      { header: "Fecha Creación", key: "createdAt", width: 20 },
      { header: "Última Actualización", key: "updatedAt", width: 20 },
    ];

    medicalCenters.forEach((center) => {
      worksheet.addRow({
        name: center.name,
        address: center.address || "N/A",
        contactInfo: center.contactInfo || "N/A",
        createdAt: center.createdAt
          ? new Date(center.createdAt).toLocaleDateString()
          : "N/A",
        updatedAt: center.updatedAt
          ? new Date(center.updatedAt).toLocaleDateString()
          : "N/A",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=CentrosMedicos_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting medical centers to Excel:", error);
    res
      .status(500)
      .json({ message: "Error al exportar centros médicos a Excel." });
  }
};

// Exportar centros médicos a Word
export const exportMedicalCentersToWord = async (
  req: Request,
  res: Response
) => {
  try {
    const { search, name } = req.query;

    let query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { contactInfo: { $regex: search, $options: "i" } },
      ];
    }
    if (name) {
      query.name = name;
    }

    const medicalCenters = await MedicalCenter.find(query).lean<
      IMedicalCenter[]
    >();

    // Crear el documento de Word
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Reporte de Centros Médicos",
                  bold: true,
                  size: 36, // 18pt en docx
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Fecha del reporte: ${new Date().toLocaleDateString()}`,
                  size: 24, // 12pt en docx
                }),
              ],
            }),
            new Paragraph({ text: "" }), // Espacio

            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Nombre")],
                      borders: {
                        top: { style: BorderStyle.SINGLE },
                        bottom: { style: BorderStyle.SINGLE },
                        left: { style: BorderStyle.SINGLE },
                        right: { style: BorderStyle.SINGLE },
                      },
                    }), // <--- CORREGIDO
                    new TableCell({
                      children: [new Paragraph("Dirección")],
                      borders: {
                        top: { style: BorderStyle.SINGLE },
                        bottom: { style: BorderStyle.SINGLE },
                        left: { style: BorderStyle.SINGLE },
                        right: { style: BorderStyle.SINGLE },
                      },
                    }), // <--- CORREGIDO
                    new TableCell({
                      children: [new Paragraph("Contacto")],
                      borders: {
                        top: { style: BorderStyle.SINGLE },
                        bottom: { style: BorderStyle.SINGLE },
                        left: { style: BorderStyle.SINGLE },
                        right: { style: BorderStyle.SINGLE },
                      },
                    }), // <--- CORREGIDO
                    new TableCell({
                      children: [new Paragraph("Fecha Creación")],
                      borders: {
                        top: { style: BorderStyle.SINGLE },
                        bottom: { style: BorderStyle.SINGLE },
                        left: { style: BorderStyle.SINGLE },
                        right: { style: BorderStyle.SINGLE },
                      },
                    }), // <--- CORREGIDO
                  ],
                }),
                ...medicalCenters.map(
                  (center) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(center.name)],
                          borders: {
                            top: { style: BorderStyle.SINGLE },
                            bottom: { style: BorderStyle.SINGLE },
                            left: { style: BorderStyle.SINGLE },
                            right: { style: BorderStyle.SINGLE },
                          },
                        }), // <--- CORREGIDO
                        new TableCell({
                          children: [new Paragraph(center.address || "N/A")],
                          borders: {
                            top: { style: BorderStyle.SINGLE },
                            bottom: { style: BorderStyle.SINGLE },
                            left: { style: BorderStyle.SINGLE },
                            right: { style: BorderStyle.SINGLE },
                          },
                        }), // <--- CORREGIDO
                        new TableCell({
                          children: [
                            new Paragraph(center.contactInfo || "N/A"),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE },
                            bottom: { style: BorderStyle.SINGLE },
                            left: { style: BorderStyle.SINGLE },
                            right: { style: BorderStyle.SINGLE },
                          },
                        }), // <--- CORREGIDO
                        new TableCell({
                          children: [
                            new Paragraph(
                              center.createdAt
                                ? new Date(
                                    center.createdAt
                                  ).toLocaleDateString()
                                : "N/A"
                            ),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE },
                            bottom: { style: BorderStyle.SINGLE },
                            left: { style: BorderStyle.SINGLE },
                            right: { style: BorderStyle.SINGLE },
                          },
                        }), // <--- CORREGIDO y comprobación
                      ],
                    })
                ),
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });

    // Empaquetar el documento y enviarlo como respuesta
    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=CentrosMedicos_${new Date()
        .toISOString()
        .slice(0, 10)}.docx`
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting medical centers to Word:", error);
    res
      .status(500)
      .json({ message: "Error al exportar centros médicos a Word." });
  }
};

// NUEVA FUNCIÓN: Obtener Existencias de Alimentos por Centro Médico (RF-7)
export const getMedicalCenterInventory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // ID del centro médico

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "ID de centro médico inválido." });
      return;
    }

    const medicalCenter = await MedicalCenter.findById(id);
    if (!medicalCenter) {
      res.status(404).json({ message: "Centro médico no encontrado." });
      return;
    }

    // Realizar una agregación para sumar las cantidades de alimentos para este centro médico
    const inventory = await FoodEntry.aggregate([
      {
        $match: {
          medicalCenter: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $unwind: "$entryItems", // Desestructurar el array entryItems
      },
      {
        $group: {
          _id: "$entryItems.food", // Agrupar por el ID del alimento
          totalQuantity: { $sum: "$entryItems.quantity" }, // Sumar las cantidades
        },
      },
      {
        $lookup: {
          // Unir con la colección de alimentos para obtener los detalles del alimento
          from: "foods",
          localField: "_id",
          foreignField: "_id",
          as: "foodDetails",
        },
      },
      {
        $unwind: "$foodDetails", // Desestructurar el array foodDetails (será un solo elemento)
      },
      {
        $lookup: {
          // Unir con la colección de unidades de medida para obtener los detalles de la unidad
          from: "unitsofmeasurements",
          localField: "foodDetails.unitOfMeasurement",
          foreignField: "_id",
          as: "unitDetails",
        },
      },
      {
        $unwind: {
          path: "$unitDetails",
          preserveNullAndEmptyArrays: true, // Permitir que sea null si no hay unidad
        },
      },
      {
        $project: {
          // Seleccionar y renombrar los campos de salida
          _id: 0,
          food: {
            _id: "$foodDetails._id",
            name: "$foodDetails.name",
            description: "$foodDetails.description",
            unitOfMeasurement: {
              _id: "$unitDetails._id",
              name: "$unitDetails.name",
              symbol: "$unitDetails.symbol",
            },
          },
          totalQuantity: 1,
        },
      },
    ]);

    res.status(200).json({
      medicalCenter: {
        _id: medicalCenter._id,
        name: medicalCenter.name,
        address: medicalCenter.address,
        contactInfo: medicalCenter.contactInfo,
      },
      inventory,
    });
  } catch (error: any) {
    console.error(
      "Error al obtener existencias del centro médico:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener existencias." });
  }
};
