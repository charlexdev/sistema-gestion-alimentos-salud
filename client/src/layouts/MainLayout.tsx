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
    <div className="flex w-full flex-1 flex-col rounded-md border border-border bg-background md:flex-row ">
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
      <div className="w-full h-full bg-background">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
