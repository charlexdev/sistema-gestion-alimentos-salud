// frontend/src/layouts/MainLayout.tsx
import { Header } from "@/components/Header";
import { links } from "@/constants/sidebar-nav";
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import {
  Sidebar,
  SidebarBody,
  SidebarSectionGroup,
} from "../components/Sidebar";

import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/classname";
import { AlertTriangle } from "lucide-react"; // Importar el icono AlertTriangle

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleAccessDenied = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAlert) {
      timer = setTimeout(() => {
        setShowAlert(false);
        setAlertMessage("");
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showAlert]);

  return (
    <div className="flex w-full h-screen rounded-md border border-border bg-background md:flex-row ">
      <Sidebar
        open={isSidebarOpen}
        setOpen={setIsSidebarOpen}
        animate={true}
        onAccessDenied={handleAccessDenied}
      >
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
      <div className="w-full h-full bg-background flex flex-col">
        <Header />
        <main className="p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {showAlert && (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          )}
        >
          <Alert
            className={cn(
              "max-w-md w-full p-4 pointer-events-auto",
              "shadow-lg rounded-lg border border-muted bg-muted flex items-center justify-between" // Añadido flex y justify-between para distribuir el contenido
            )}
          >
            <span className="text-yellow-400">{alertMessage}</span>{" "}
            {/* El mensaje de la alerta */}
            <AlertTriangle className="h-6 w-6 text-yellow-400 ml-2" />{" "}
            {/* Icono de peligro a la derecha, más grande y del mismo color */}
          </Alert>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
