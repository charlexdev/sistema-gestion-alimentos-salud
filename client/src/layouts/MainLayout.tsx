// frontend/src/layouts/MainLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar"; // Importa el Navbar que contiene el botón de cerrar sesión
import { SidebarNav } from "../components/ui/sidebar-nav"; // Se mantiene, ya que tu layout lo usa

const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar de Navegación */}
      <aside className="w-64 border-r bg-gray-50 p-4 shadow-md">
        <div className="mb-8 text-2xl font-bold text-gray-800">
          Admin Dashboard
        </div>
        <SidebarNav /> {/* Componente de navegación de la sidebar */}
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 bg-gray-100">
        <Navbar />{" "}
        {/* AÑADIDO: El Navbar para la navegación superior y el botón de cerrar sesión */}
        <div className="mt-8">
          {" "}
          {/* Opcional: Margen superior para separar el contenido del Navbar */}
          <Outlet />{" "}
          {/* Aquí se renderizará el contenido de la ruta actual (ej. MedicalCentersPage) */}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
