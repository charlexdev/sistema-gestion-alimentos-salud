// backend/src/controllers/user.controller.ts
import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";

// Helper para manejar errores
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

// Obtener todos los usuarios con paginación y búsqueda
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
      .select("-password") // No enviar la contraseña
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ users, totalItems, totalPages, currentPage: page });
  } catch (error) {
    handleControllerError(res, error, "Error al obtener usuarios:");
  }
};

// Obtener un usuario por ID
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id; // <-- Captura el ID aquí

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

// Crear un nuevo usuario
export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      res
        .status(400)
        .json({
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
      role: role || "user", // Default a 'user' si no se especifica
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

// Actualizar un usuario existente
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;
    const userId = req.params.id; // <-- ID que viene de la URL

    // --- INICIO LOGS DE DEPURACIÓN EN updateUser (BACKEND) ---
    console.log("BACKEND LOG (5): updateUser - Recibida solicitud PUT.");
    console.log(
      "BACKEND LOG (6): updateUser - ID de los parámetros de la URL (req.params.id):",
      userId
    ); // ¡ESTO ES CRUCIAL!
    console.log(
      "BACKEND LOG (7): updateUser - Cuerpo de la solicitud (req.body):",
      req.body
    );
    // --- FIN LOGS DE DEPURACIÓN EN updateUser (BACKEND) ---

    // La validación original de ID no proporcionado debe ir antes de isValidObjectId
    if (!userId) {
      console.error(
        "BACKEND LOG: updateUser - ¡userId es undefined o null en el controlador!"
      );
      res
        .status(400)
        .json({
          message: "ID de usuario no proporcionado para la actualización.",
        });
      return;
    }

    // Validación para asegurar que el ID es un ObjectId válido de Mongoose
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

    // La contraseña es obligatoria para la actualización
    if (!password) {
      res
        .status(400)
        .json({
          message: "La contraseña es obligatoria para actualizar el usuario.",
        });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado." });
      return;
    }

    // Actualizar campos si se proporcionan
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;

    // Siempre hashear y actualizar la contraseña ya que ahora es obligatoria
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

// Eliminar un usuario
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId) {
      res
        .status(400)
        .json({
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

    const result = await User.findByIdAndDelete(userId); // Cambiado a userId
    if (!result) {
      res.status(404).json({ message: "Usuario no encontrado para eliminar." });
      return;
    }
    res.json({ message: "Usuario eliminado exitosamente." });
  } catch (error) {
    handleControllerError(res, error, "Error al eliminar usuario:");
  }
};

// Exportar usuarios a Excel
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

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Usuarios");

    worksheet.columns = [
      { header: "ID", key: "_id", width: 30 },
      { header: "Username", key: "username", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Rol", key: "role", width: 15 },
      { header: "Fecha de Creación", key: "createdAt", width: 20 },
    ];

    users.forEach((user) => {
      worksheet.addRow({
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString("es-ES")
          : "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "usuarios.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    handleControllerError(res, error, "Error al exportar usuarios a Excel:");
  }
};

// Exportar usuarios a Word
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

    const docx = await import("docx");
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      WidthType,
      AlignmentType,
    } = docx;

    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun("Username")],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: 3000, type: WidthType.DXA },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun("Email")],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: 4000, type: WidthType.DXA },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun("Rol")],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: 1500, type: WidthType.DXA },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun("Fecha Creación")],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: 2500, type: WidthType.DXA },
          }),
        ],
      }),
      ...users.map(
        (user) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(user.username)] }),
              new TableCell({ children: [new Paragraph(user.email)] }),
              new TableCell({ children: [new Paragraph(user.role)] }),
              new TableCell({
                children: [
                  new Paragraph(user.createdAt?.toLocaleDateString() || ""),
                ],
              }),
            ],
          })
      ),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun("Listado de Usuarios")],
              alignment: AlignmentType.CENTER,
              heading: docx.HeadingLevel.HEADING_1,
            }),
            new Paragraph({ text: "" }),
            new Table({
              rows: tableRows,
              width: { size: 9000, type: WidthType.DXA },
              alignment: AlignmentType.CENTER,
            }),
          ],
        },
      ],
    });

    const b64string = await Packer.toBase64String(doc);
    const buffer = Buffer.from(b64string, "base64");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "usuarios.docx"
    );
    res.send(buffer);
  } catch (error) {
    handleControllerError(res, error, "Error al exportar usuarios a Word:");
  }
};
