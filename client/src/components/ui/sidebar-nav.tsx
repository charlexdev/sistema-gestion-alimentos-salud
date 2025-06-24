// frontend/src/components/ui/sidebar-nav.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/classname";
import { buttonVariants } from "./button";

interface NavItem {
  href: string;
  title: string;
  icon?: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  isSidebarOpen: boolean;
}

export function SidebarNav({
  className,
  isSidebarOpen,
  ...props
}: SidebarNavProps) {
  const location = useLocation();

  const navSections: NavSection[] = [
    {
      title: "Gestión de Usuarios",
      items: [
        {
          title: "Usuarios",
          href: "/users",
          // icon: <UsersIcon className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Gestión de Datos",
      items: [
        {
          title: "Centros Médicos",
          href: "/medical-centers",
          // icon: <Building2Icon className="h-4 w-4" />,
        },
        {
          title: "Proveedores",
          href: "/providers",
          // icon: <TruckIcon className="h-4 w-4" />,
        },
        {
          title: "Unidades de Medida",
          href: "/units-of-measurement",
          // icon: <RulerIcon className="h-4 w-4" />,
        },
        {
          title: "Alimentos",
          href: "/foods",
          // icon: <AppleIcon className="h-4 w-4" />,
        },
        {
          title: "Planes de Alimentos",
          href: "/plans",
          // icon: <ClipboardListIcon className="h-4 w-4" />,
        },
        {
          title: "Entradas de Alimentos",
          href: "/food-entries",
          // icon: <ArrowLeftRightIcon className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Gráficas",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          // icon: <BarChart2Icon className="h-4 w-4" />,
        },
      ],
    },
  ];

  return (
    <nav
      className={cn("flex flex-col space-y-4 flex-grow", className)}
      {...props}
    >
      {navSections.map((section, sectionIndex) => (
        <div key={section.title} className="space-y-2">
          {isSidebarOpen && (
            <h3 className="text-lg font-semibold text-gray-700">
              {section.title}
            </h3>
          )}
          <div className="flex flex-col space-y-1">
            {section.items.map((item) =>
              isSidebarOpen ? (
                // Cuando el sidebar está abierto, es un Link normal y activo
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    location.pathname === item.href
                      ? "bg-gray-200 hover:bg-gray-200" // Resaltado completo con hover
                      : "hover:bg-transparent hover:underline",
                    "justify-start"
                  )}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.title}
                </Link>
              ) : (
                // Cuando el sidebar está cerrado, es un div no interactivo
                <div
                  key={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    // APLICAMOS BG-GRAY-200 SOLO SI isSidebarOpen ES TRUE
                    // Y si la ruta coincide, para que NO se resalte cuando está colapsado
                    location.pathname === item.href && isSidebarOpen
                      ? "bg-gray-200" // Solo el color de fondo si está abierto
                      : "bg-transparent", // Siempre transparente si está colapsado o no es la ruta
                    "flex justify-center w-full cursor-default"
                  )}
                  title={item.title}
                >
                  {item.icon && <span className="mr-0">{item.icon}</span>}
                </div>
              )
            )}
          </div>
          {isSidebarOpen && sectionIndex < navSections.length - 1 && (
            <hr className="my-4 border-gray-200" />
          )}
        </div>
      ))}
    </nav>
  );
}
