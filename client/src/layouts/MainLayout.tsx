// frontend/src/layouts/MainLayout.tsx
import { Header } from "@/components/Header";
import { links } from "@/constants/sidebar-nav";
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import {
  Sidebar,
  SidebarBody,
  SidebarSectionGroup,
} from "../components/Sidebar";

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    // CAMBIO CLAVE AQUÍ: De 'flex-1' a 'h-screen'
    <div className="flex w-full h-screen rounded-md border border-border bg-background md:flex-row ">
      <Sidebar open={isSidebarOpen} setOpen={setIsSidebarOpen} animate={true}>
        <SidebarBody>
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarSectionGroup key={idx} section={link} />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      {/* Añade 'flex flex-col' al contenedor del Header y main para organizar su contenido verticalmente */}
      <div className="w-full h-full bg-background flex flex-col">
        <Header />
        {/* Añade 'flex-1 overflow-y-auto' a main para que ocupe el espacio restante y tenga scroll si es necesario */}
        <main className="p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
