import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extender el Request de Express para añadir la propiedad 'user'.
// Esta declaración global DEBE estar al principio del archivo,
// fuera de cualquier bloque de código (como funciones o clases),
// para que TypeScript la reconozca globalmente en todo el proyecto.
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
  // Tipo de retorno 'void'
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "No hay token, autorización denegada." });
    return; // Asegura que la función termina aquí
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET no está definida en las variables de entorno.");
      res
        .status(500)
        .json({
          message: "Error interno del servidor: JWT_SECRET no configurada.",
        });
      return; // Asegura que la función termina aquí
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      user: { id: string; role: "admin" | "user" };
    };
    req.user = decoded.user;
    next(); // Llama a next para pasar al siguiente middleware/controlador
    // No se necesita 'return;' aquí porque next() toma el control del flujo
  } catch (error: any) {
    console.error("Error en el middleware de autenticación:", error.message);
    res.status(403).json({ message: "Token no es válido o ha expirado." });
    return; // Asegura que la función termina aquí
  }
};

export const authorizeRole = (roles: Array<"admin" | "user">) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Tipo de retorno 'void'
    if (!req.user || !roles.includes(req.user.role)) {
      res
        .status(403)
        .json({
          message: "Acceso denegado: No tienes los permisos necesarios.",
        });
      return; // Asegura que la función termina aquí
    }
    next(); // Llama a next para pasar al siguiente middleware/controlador
  };
};
