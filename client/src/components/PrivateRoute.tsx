// client/src/components/PrivateRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import authService from "../services/auth.service";

const PrivateRoute: React.FC = () => {
  const currentUser = authService.getCurrentUser(); // Verifica si hay un usuario logueado

  // Si no hay un usuario logueado (o token), redirige a la página de login
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
