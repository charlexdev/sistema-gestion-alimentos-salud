// src/components/PrivateRoute.tsx
import { useUser } from "@/stores/auth"; //
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

interface PrivateRouteProps {
  allowedRoles?: Array<"admin" | "user">; // Hazlo opcional si no todas las rutas necesitan comprobación de rol
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const currentUser = useUser(); //

  if (!currentUser) {
    // Si no hay usuario autenticado, redirige a la página de login
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles permitidos y el usuario no tiene uno de ellos
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirige a una página de acceso denegado o al dashboard
    // Podrías crear una página "/unauthorized" para un mejor UX
    return <Navigate to="/" replace />; // Redirige al dashboard por defecto
  }

  // Si el usuario está autenticado y tiene un rol permitido (o no se especificó rol)
  return <Outlet />;
};

export default PrivateRoute;
