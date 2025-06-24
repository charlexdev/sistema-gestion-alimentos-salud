import { useUser } from "@/stores/auth";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute: React.FC = () => {
  const currentUser = useUser();

  return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
