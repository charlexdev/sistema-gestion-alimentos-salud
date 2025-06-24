import { useMutation } from "@tanstack/react-query";
import type { RegisterData } from "@/api/schemas/register"; // Importa el tipo RegisterData
import auth from "@/api/services/auth"; // Importa el servicio de autenticación
import { useNavigate } from "react-router-dom"; // Para redireccionar después del registro
import { useAuthActions } from "@/stores/auth"; // Para iniciar sesión automáticamente después del registro

export const useRegister = () => {
  const navigate = useNavigate(); // Hook para la navegación
  const { setToken, setUser } = useAuthActions(); // Acciones para actualizar el estado de autenticación

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      // Define la función de mutación que toma RegisterData
      // Llama a tu servicio de autenticación para registrar al usuario
      // Asumiendo que 'auth' tiene un método 'register' que maneja la llamada a la API
      const res = await auth.register(data.username, data.email, data.password); // Asumiendo que 'auth.register' toma username, email y contraseña

      if (!res.token) {
        throw new Error("No se pudo registrar la cuenta. Inténtalo de nuevo.");
      }

      // Opcional: Iniciar sesión automáticamente al usuario después del registro exitoso
      setToken(res.token);
      setUser(res.user);

      // Redirigir al usuario a la página principal o al panel de control después del registro
      navigate("/");
      return res;
    },
    onSuccess: () => {
      // Opcional: Puedes añadir lógica adicional aquí si el registro es exitoso
      console.log("¡Registro exitoso!");
    },
    onError: (error) => {
      // Opcional: Manejar errores, por ejemplo, mostrando un mensaje al usuario
      console.error("Error durante el registro:", error.message);
      // Aquí podrías usar una librería de toasts/notificaciones para mostrar el error al usuario
    },
  });
};
