// client/src/components/Navbar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import authService from "../api/services/auth";
import { Button } from "@/components/ui/button"; // Asumiendo que usas shadcn/ui

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser(); // Obtiene la información del usuario actual

  const handleLogout = () => {
    authService.logout(); // Llama a la función de logout del servicio
    navigate("/login"); // Redirige al usuario a la página de login
    // toast.info('Sesión cerrada.'); // Opcional: una notificación de sesión cerrada
  };

  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <div className="text-xl font-bold">Sistema de Gestión de Alimentos</div>
      <div>
        {currentUser ? ( // Si hay un usuario logueado, muestra su nombre y el botón de cerrar sesión
          <div className="flex items-center gap-4">
            <span>Bienvenido, {currentUser.email}</span>{" "}
            {/* Muestra el email del usuario */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-white hover:bg-gray-700"
            >
              Cerrar Sesión
            </Button>
          </div>
        ) : (
          // Esto no debería verse si PrivateRoute funciona correctamente, pero es un fallback
          <Button
            onClick={() => navigate("/login")}
            variant="ghost"
            className="text-white hover:bg-gray-700"
          >
            Iniciar Sesión
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
