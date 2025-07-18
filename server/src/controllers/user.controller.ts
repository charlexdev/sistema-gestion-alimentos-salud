import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import bcrypt from "bcryptjs";
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
  AlignmentType,
  VerticalAlign,
  BorderStyle,
  //ShadingType,
  ImageRun,
} from "docx";

const handleControllerError = (
  res: Response,
  error: unknown,
  message: string
) => {
  console.error(message, error);
  if (error instanceof Error) {
    return res.status(500).json({ message: error.message });
  }
  res.status(500).json({ message: "Error interno del servidor." });
};

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const role = (req.query.role as "admin" | "user") || undefined;

    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const totalItems = await User.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const users = await User.find(query)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ users, totalItems, totalPages, currentPage: page });
  } catch (error) {
    handleControllerError(res, error, "Error al obtener usuarios:");
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!isValidObjectId(userId)) {
      res.status(400).json({ message: "ID de usuario inválido." });
      return;
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado." });
      return;
    }
    res.json(user.toObject({ getters: true, virtuals: false }));
  } catch (error) {
    handleControllerError(res, error, "Error al obtener usuario por ID:");
  }
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({
        message:
          "Todos los campos obligatorios son requeridos (username, email, password).",
      });
      return;
    }

    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: "El usuario con este email ya existe." });
      return;
    }
    user = await User.findOne({ username });
    if (user) {
      res.status(400).json({ message: "El nombre de usuario ya existe." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await newUser.save();
    res.status(201).json({
      message: "Usuario creado exitosamente.",
      user: newUser.toObject({ getters: true, virtuals: false }),
    });
  } catch (error) {
    handleControllerError(res, error, "Error al crear usuario:");
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;
    const userId = req.params.id;

    console.log("BACKEND LOG (5): updateUser - Recibida solicitud PUT.");
    console.log(
      "BACKEND LOG (6): updateUser - ID de los parámetros de la URL (req.params.id):",
      userId
    );
    console.log(
      "BACKEND LOG (7): updateUser - Cuerpo de la solicitud (req.body):",
      req.body
    );

    if (!userId) {
      console.error(
        "BACKEND LOG: updateUser - ¡userId es undefined o null en el controlador!"
      );
      res.status(400).json({
        message: "ID de usuario no proporcionado para la actualización.",
      });
      return;
    }

    if (!isValidObjectId(userId)) {
      console.error(
        "BACKEND LOG: updateUser - ID de usuario no válido para ObjectId:",
        userId
      );
      res
        .status(400)
        .json({ message: "ID de usuario proporcionado no es válido." });
      return;
    }

    if (!password) {
      res.status(400).json({
        message: "La contraseña es obligatoria para actualizar el usuario.",
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado." });
      return;
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    res.json({
      message: "Usuario actualizado exitosamente.",
      user: user.toObject({ getters: true, virtuals: false }),
    });
  } catch (error) {
    handleControllerError(res, error, "Error al actualizar usuario:");
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId) {
      res.status(400).json({
        message: "ID de usuario no proporcionado para la eliminación.",
      });
      return;
    }

    if (!isValidObjectId(userId)) {
      res
        .status(400)
        .json({ message: "ID de usuario proporcionado no es válido." });
      return;
    }

    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      res.status(404).json({ message: "Usuario no encontrado para eliminar." });
      return;
    }
    res.json({ message: "Usuario eliminado exitosamente." });
  } catch (error) {
    handleControllerError(res, error, "Error al eliminar usuario:");
  }
};

export const exportUsersToExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const role = (req.query.role as "admin" | "user") || undefined;

    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const users: (IUser & { _id: any })[] = await User.find(query)
      .select("-password")
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Usuarios");

    const headerRowColor = "ADD8E6"; // Azul claro para el fondo de las cabeceras
    const textColor = "1F4E79"; // Azul oscuro para el texto
    const borderColor = "4682B4"; // Azul medio para los bordes

    worksheet.columns = [
      { header: "ID", key: "_id", width: 30 },
      { header: "Username", key: "username", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Rol", key: "role", width: 15 },
      { header: "Fecha de Creación", key: "createdAt", width: 20 },
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

    users.forEach((user) => {
      const row = worksheet.addRow({
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
          ? new Date(user.createdAt).toLocaleString("es-ES")
          : "",
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
      "attachment; filename=" + `usuarios_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    handleControllerError(res, error, "Error al exportar usuarios a Excel:");
  }
};

export const exportUsersToWord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const role = (req.query.role as "admin" | "user") || undefined;

    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const users: (IUser & { _id: any })[] = await User.find(query)
      .select("-password")
      .lean();

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

    const tableHeaderCells = ["Username", "Email", "Rol", "Fecha Creación"].map(
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

    users.forEach((user) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: user.username,
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
                      text: user.email,
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
                      text: user.role,
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
                      text: user.createdAt
                        ? new Date(user.createdAt).toLocaleString("es-ES")
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
                  text: "Informe de Usuarios",
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
                  text: "Detalles de Usuarios",
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
      "attachment; filename=" + `usuarios_${Date.now()}.docx`
    );
    res.send(buffer);
  } catch (error) {
    handleControllerError(res, error, "Error al exportar usuarios a Word:");
  }
};
