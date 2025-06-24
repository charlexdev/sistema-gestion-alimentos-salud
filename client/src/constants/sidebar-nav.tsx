import {
  UsersIcon,
  Building2Icon,
  TruckIcon,
  RulerIcon,
  AppleIcon,
  ClipboardListIcon,
  ArrowLeftRightIcon,
  BarChart2Icon,
} from "lucide-react";

export const links = [
  {
    title: "Gestión de Usuarios",
    items: [
      {
        title: "Usuarios",
        href: "/users",
        icon: <UsersIcon className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Gestión de Datos",
    items: [
      {
        title: "Centros Médicos",
        href: "/medical-centers",
        icon: <Building2Icon className="h-4 w-4" />,
      },
      {
        title: "Proveedores",
        href: "/providers",
        icon: <TruckIcon className="h-4 w-4" />,
      },
      {
        title: "Unidades de Medida",
        href: "/units-of-measurement",
        icon: <RulerIcon className="h-4 w-4" />,
      },
      {
        title: "Alimentos",
        href: "/foods",
        icon: <AppleIcon className="h-4 w-4" />,
      },
      {
        title: "Planes de Alimentos",
        href: "/plans",
        icon: <ClipboardListIcon className="h-4 w-4" />,
      },
      {
        title: "Entradas de Alimentos",
        href: "/food-entries",
        icon: <ArrowLeftRightIcon className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Gráficas",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: <BarChart2Icon className="h-4 w-4" />,
      },
    ],
  },
];
