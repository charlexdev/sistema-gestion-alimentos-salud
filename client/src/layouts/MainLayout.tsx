// frontend/src/layouts/MainLayout.tsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { SidebarNav } from "../components/ui/sidebar-nav";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { MenuIcon, XIcon } from "lucide-react";

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar de Navegación */}
      <aside
        className={cn(
          "bg-gray-50 p-4 shadow-md transition-all duration-300 ease-in-out flex flex-col",
          // *** CAMBIO CLAVE AQUÍ: Aumentar el ancho de la sidebar ***
          isSidebarOpen ? "w-72 border-r" : "w-16 border-r-0" // Probamos con w-72 (288px)
          // Si con w-72 aún se corta, prueba con w-80 (320px)
        )}
      >
        {/* Encabezado del Sidebar */}
        <div
          className={cn(
            "flex items-center mb-8",
            "w-full", // Es importante que este div ocupe todo el ancho disponible DENTRO del aside
            isSidebarOpen ? "justify-between" : "justify-center"
            // No añadimos 'px-' explícito aquí, confiamos en el 'p-4' del 'aside'
            // para el padding general y que 'justify-between' lo respete.
          )}
        >
          {isSidebarOpen && (
            // `flex-grow` permite que el texto ocupe el espacio restante.
            // `mr-2` da una pequeña separación entre el texto y el botón.
            // `whitespace-nowrap` mantiene el texto en una sola línea.
            // `overflow-hidden` y `text-ellipsis` son un buen fallback
            // si el texto aún así no cabe del todo (mostrará "Admin Dashboar...").
            <div className="text-2xl font-bold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis mr-2 flex-grow">
              Admin Dashboard
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="flex-none" // Asegura que el botón no se encoja ni se agrande
          >
            {isSidebarOpen ? (
              <XIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Pasa isSidebarOpen a SidebarNav */}
        <SidebarNav isSidebarOpen={isSidebarOpen} />
      </aside>

      {/* Contenido Principal */}
      <main
        className={cn(
          "flex-1 p-8 bg-gray-100 transition-all duration-300 ease-in-out"
        )}
      >
        <Navbar />
        <div className="mt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
