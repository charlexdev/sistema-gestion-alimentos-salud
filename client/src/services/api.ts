// client/src/services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // ASEGÚRATE DE QUE ESTA ES LA URL DE TU BACKEND
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // La clave 'userToken' debe coincidir con la clave usada al guardar en localStorage
    const token = localStorage.getItem("userToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la respuesta es 401 (Unauthorized) o 403 (Forbidden), limpia el token
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.error("Autenticación fallida o token inválido. Limpiando token.");
      localStorage.removeItem("userToken");
      localStorage.removeItem("currentUser");
      // Puedes añadir una redirección a '/login' aquí si quieres que el usuario siempre
      // sea redirigido automáticamente al fallar la autenticación en cualquier petición.
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
