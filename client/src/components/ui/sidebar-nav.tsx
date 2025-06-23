// frontend/src/components/ui/sidebar-nav.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

interface NavItem {
  href: string;
  title: string;
  icon?: React.ReactNode; // Si tienes iconos para los elementos
}

interface NavSection {
  title: string; // Título de la sección (ej. "Gestión de Usuarios")
  items: NavItem[];
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: NavItem[]; // Esta propiedad ya no sería tan relevante directamente si usamos secciones
}

export function SidebarNav({ className, ...props }: SidebarNavProps) {
  const location = useLocation();

  const navSections: NavSection[] = [
    {
      title: "Usuarios",
      items: [
        {
          title: "Usuarios",
          href: "/users", // Asumiendo que tendrás una ruta para la lista de usuarios
        },
        // {
        //   title: "Roles y Permisos", // Si en el futuro añades gestión de roles
        //   href: "/roles",
        // },
      ],
    },
    {
      title: "Gestión de Datos",
      items: [
        {
          title: "Centros Médicos",
          href: "/medical-centers",
        },
        {
          title: "Proveedores",
          href: "/providers",
        },
        {
          title: "Unidades de Medida",
          href: "/units-of-measurement",
        },
        {
          title: "Alimentos",
          href: "/foods",
        },
        {
          title: "Planes de Alimentos",
          href: "/plans",
        },
        {
          title: "Entradas de Alimentos",
          href: "/food-entries",
        },
      ],
    },
    {
      title: "Gráficas",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard", // Para futuras gráficas
        },
        // {
        //   title: "Generar Reportes",
        //   href: "/reports",
        // },
      ],
    },
  ];

  return (
    <nav className={cn("flex flex-col space-y-4", className)} {...props}>
      {navSections.map((section, sectionIndex) => (
        <div key={section.title} className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">
            {section.title}
          </h3>
          <div className="flex flex-col space-y-1">
            {section.items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  location.pathname === item.href
                    ? "bg-gray-200 hover:bg-gray-200"
                    : "hover:bg-transparent hover:underline",
                  "justify-start"
                )}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.title}
              </Link>
            ))}
          </div>
          {sectionIndex < navSections.length - 1 && (
            <hr className="my-4 border-gray-200" />
          )}{" "}
          {/* Separador entre secciones */}
        </div>
      ))}
    </nav>
  );
}

export default SidebarNav;
