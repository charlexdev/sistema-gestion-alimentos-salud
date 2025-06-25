// src/api/schemas/user.ts

// Define la interfaz del usuario tal como la recibe el frontend de tu backend
export interface User {
  id: string;
  _id?: string; // <--- ¡NUEVO! Añade esta línea para incluir _id (opcional)
  username: string;
  email: string;
  role: "admin" | "user"; // <--- ¡Importante! Asegurarse de que sea este tipo
}
