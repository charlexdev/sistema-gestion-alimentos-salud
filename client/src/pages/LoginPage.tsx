// client/src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { AxiosRequestConfig } from "axios";

// === DEFINICIÓN LOCAL DE TIPO PARA ERRORES DE AXIOS CON RESPUESTA ===
// Esta interfaz define la estructura esperada de un error de Axios que incluye una respuesta del servidor.
// Se ha eliminado 'request?: any;' para evitar el error de ESLint.
interface AxiosErrorWithResponse<T = unknown> extends Error {
  isAxiosError: true;
  response: {
    data?: T;
    status: number;
    statusText: string;
    headers: Record<string, string | number | string[]>;
    config: AxiosRequestConfig;
  };
  message: string;
  name: string;
  stack?: string;
  code?: string;
  config: AxiosRequestConfig;
}

// === FUNCIÓN DE GUARDIA DE TIPO PARA VERIFICAR AxiosError CON RESPUESTA ===
// Esta función es un "type guard" que nos permite verificar si un valor de tipo 'unknown'
// es en realidad una instancia de 'AxiosErrorWithResponse'.
function isAxiosErrorWithData<T = unknown>(
  error: unknown
): error is AxiosErrorWithResponse<T> {
  // Primero, verificamos que el error es un objeto y no es nulo.
  if (typeof error !== "object" || error === null) {
    return false;
  }
  // Hacemos un "casting" parcial para poder acceder a 'isAxiosError' y 'response'.
  const potentialAxiosError = error as Partial<AxiosErrorWithResponse<T>>;
  return (
    potentialAxiosError.isAxiosError === true && // Comprobamos la bandera de Axios
    potentialAxiosError.response !== undefined && // Y que tiene una propiedad 'response'
    potentialAxiosError.response !== null
  );
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState(""); // Estado para el correo electrónico
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.login(email, password); // Llama a la función de login con email y password
      toast.success("¡Inicio de sesión exitoso!");
      navigate("/medical-centers"); // Redirige a la página de centros médicos tras un login exitoso
    } catch (error: unknown) {
      // Captura el error como 'unknown' para mayor seguridad
      console.error("Login failed:", error);
      let errorMessage = "Ocurrió un error inesperado al iniciar sesión.";

      // Usa el guardián de tipo para obtener el mensaje de error del backend si está disponible
      if (isAxiosErrorWithData<{ message: string }>(error)) {
        // Asume que el backend devuelve un objeto { message: "..." } en caso de error
        errorMessage =
          error.response?.data?.message ||
          "Credenciales inválidas. Inténtalo de nuevo.";
      }
      toast.error(errorMessage); // Muestra el mensaje de error al usuario
    } finally {
      setLoading(false); // Restablece el estado de carga
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Iniciar Sesión
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email" // Tipo "email" para validación HTML5 básica
              placeholder="tu@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Actualiza el estado del email
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Actualiza el estado de la contraseña
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
