import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";

// Función para registrar un nuevo usuario
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({
        message:
          "Por favor, introduce todos los campos requeridos: username, email, password.",
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

    // Asegurarse de que el rol es 'admin' o 'user'
    const finalRole = role === "admin" ? "admin" : "user";

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: finalRole, // Usar el rol sanitizado
    });

    await newUser.save();

    const payload = {
      user: {
        id: newUser.id,
        role: newUser.role,
      },
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET no está definida en las variables de entorno.");
      res.status(500).json({
        message: "Error interno del servidor: JWT_SECRET no configurada.",
      });
      return;
    }

    jwt.sign(payload, jwtSecret, { expiresIn: "1h" }, (err, token) => {
      if (err) {
        console.error("Error al firmar JWT:", err);
        res
          .status(500)
          .json({ message: "Error al generar token de autenticación." });
        return;
      }
      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role === "admin" ? "admin" : "user", // <-- Asegurarse de que el rol es "admin" o "user" aquí también
        },
      });
    });
  } catch (error: any) {
    console.error("Error al registrar usuario:", error.message);
    res.status(500).json({ message: "Error interno del servidor." });
    return;
  }
};

// Función para iniciar sesión
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ message: "Por favor, introduce email y contraseña." });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Credenciales inválidas." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Credenciales inválidas." });
      return;
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET no está definida en las variables de entorno.");
      res.status(500).json({
        message: "Error interno del servidor: JWT_SECRET no configurada.",
      });
      return;
    }

    jwt.sign(payload, jwtSecret, { expiresIn: "1h" }, (err, token) => {
      if (err) {
        console.error("Error al firmar JWT:", err);
        res
          .status(500)
          .json({ message: "Error al generar token de autenticación." });
        return;
      }
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role === "admin" ? "admin" : "user", // <-- Asegurarse de que el rol es "admin" o "user" aquí
        },
      });
    });
  } catch (error: any) {
    console.error("Error al iniciar sesión:", error.message);
    res.status(500).json({ message: "Error interno del servidor." });
    return;
  }
};

// Función para obtener los datos del usuario autenticado (ruta protegida)
export const getAuthenticatedUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        message: "Usuario no autenticado o ID de usuario no disponible.",
      });
      return;
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado." });
      return;
    }
    // Cuando el usuario es obtenido directamente de la BD, su rol ya debería ser el tipo correcto
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role === "admin" ? "admin" : "user", // Asegurarse de que el rol sea "admin" o "user" al devolverlo
    });
  } catch (error: any) {
    console.error("Error al obtener usuario autenticado:", error.message);
    res.status(500).json({ message: "Error interno del servidor." });
    return;
  }
};
