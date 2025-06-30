import {
  UsersIcon,
  Building2Icon,
  TruckIcon,
  RulerIcon,
  AppleIcon,
  ClipboardListIcon, // Para Planes de Alimentos
  ArrowLeftRightIcon, // Para Entradas de Alimentos
  PackageIcon, // Para Stock
  BarChart2Icon,
  // No necesitamos UtensilsCrossedIcon ni FileBarChartIcon si no se usan esas páginas
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
        title: "Planes de Alimentos", // Una de las 4 páginas a asegurar
        href: "/foodplans",
        icon: <ClipboardListIcon className="h-4 w-4" />,
      },
      {
        title: "Entradas de Alimentos", // Otra de las 4 páginas a asegurar
        href: "/food-entries",
        icon: <ArrowLeftRightIcon className="h-4 w-4" />,
      },
      {
        title: "Stock de Alimentos", // Otra de las 4 páginas a asegurar
        href: "/stock",
        icon: <PackageIcon className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Gráficas", // Manteniendo el título original si no hay reportes dedicados
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: <BarChart2Icon className="h-4 w-4" />,
      },
      // Eliminadas las rutas de ejemplo FoodConsumptions y Reports
    ],
  },
];
