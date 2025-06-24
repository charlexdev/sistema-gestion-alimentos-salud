import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import authService from "../api/services/auth";

const PrivateRoute: React.FC = () => {
  const currentUser = authService.getCurrentUser();

  // return currentUser ? <Outlet /> : <Navigate to="/login" />;
  return <Outlet />;
};

export default PrivateRoute;
