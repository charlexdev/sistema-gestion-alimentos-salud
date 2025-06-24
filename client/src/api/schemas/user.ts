// src/api/schemas/user.ts

// Define la interfaz del usuario tal como la recibe el frontend de tu backend
export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user"; // <--- ¡Importante! Asegurarse de que sea este tipo
}
