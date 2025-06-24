// src/api/responses/register-response.ts

import type { User } from "../schemas/user"; // Importa la interfaz User

export interface RegisterResponse {
  token: string;
  user: User; // <--- Ahora usa la interfaz User definida correctamente
}
