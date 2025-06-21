// frontend/src/components/ui/sidebar-nav.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

interface NavItem {
  href: string;
  title: string;
  icon?: React.ReactNode;
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: NavItem[];
}

export function SidebarNav({ className, ...props }: SidebarNavProps) {
  const location = useLocation();

  const navItems: NavItem[] = [
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
  ];

  return (
    <nav className={cn("flex flex-col space-y-1", className)} {...props}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            location.pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start"
          )}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
