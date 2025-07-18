import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "admin" | "user";
      };
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "No hay token, autorización denegada." });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET no está definida en las variables de entorno.");
      res.status(500).json({
        message: "Error interno del servidor: JWT_SECRET no configurada.",
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      user: { id: string; role: "admin" | "user" };
    };
    req.user = decoded.user;
    next();
  } catch (error: any) {
    console.error("Error en el middleware de autenticación:", error.message);
    res.status(403).json({ message: "Token no es válido o ha expirado." });
    return;
  }
};

export const authorizeRole = (roles: Array<"admin" | "user">) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        message: "Acceso denegado: No tienes los permisos necesarios.",
      });
      return;
    }
    next();
  };
};
