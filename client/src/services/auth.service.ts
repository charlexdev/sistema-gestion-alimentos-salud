// client/src/services/auth.service.ts
import api from "./api"; // Importa la instancia de Axios configurada

interface LoginResponse {
  token: string;
  user: {
    _id: string;
    email: string; // La autenticación es con email
    role: "admin" | "user"; // Ajusta esto según los roles que tengas en tu backend
    // Puedes añadir otros campos del usuario que devuelva tu backend aquí (ej. name, etc.)
  };
}

const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    // Envía el email y la contraseña a tu ruta de login en el backend
    // Asumiendo que tu ruta de login es POST /api/auth/login
    const response = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    });

    if (response.data && response.data.token) {
      localStorage.setItem("userToken", response.data.token); // Clave para el token
      localStorage.setItem("currentUser", JSON.stringify(response.data.user)); // Almacena los datos del usuario
      console.log("Token y datos de usuario guardados en localStorage.");
    }
    return response.data;
  } catch (error) {
    console.error("Error en el login:", error);
    throw error; // Propaga el error para que el componente lo maneje
  }
};

const logout = () => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("currentUser");
  console.log("Token y datos de usuario eliminados de localStorage.");
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem("currentUser");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error("Error al parsear currentUser de localStorage", e);
      return null;
    }
  }
  return null;
};

const getToken = () => {
  return localStorage.getItem("userToken");
};

export default {
  login,
  logout,
  getCurrentUser,
  getToken,
};
