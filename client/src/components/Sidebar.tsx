// Sidebar.tsx
import { cn } from "@/lib/classname";
import { Menu, X } from "lucide-react";
import { createContext, useContext, useMemo, useState } from "react"; // Añadido Dispatch, SetStateAction
import { useUser } from "@/stores/auth";

// Ya no necesitamos importar Alert aquí, se gestiona en MainLayout
// import { Alert, AlertDescription } from "./ui/alert";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  // Eliminadas: showAlert: boolean;
  // Eliminadas: alertMessage: string;
  onAccessDenied: (message: string) => void; // Solo mantenemos la función
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
  onAccessDenied: onAccessDeniedProp, // Recibe la prop onAccessDenied de MainLayout
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  onAccessDenied: (message: string) => void; // Prop onAccessDenied
}) => {
  const [openState, setOpenState] = useState(false);
  // Eliminados: localShowAlert, localAlertMessage y su useEffect

  const open = useMemo(() => openProp ?? openState, [openProp, openState]);
  const setOpen = useMemo(
    () => setOpenProp ?? setOpenState,
    [setOpenProp, setOpenState]
  );

  // Usa la prop onAccessDenied directamente
  const onAccessDeniedContext = useMemo(
    () => onAccessDeniedProp,
    [onAccessDeniedProp]
  );

  const value = useMemo(
    () => ({
      open,
      setOpen,
      animate,
      // Eliminados: showAlert, alertMessage
      onAccessDenied: onAccessDeniedContext, // Usa la función de la prop
    }),
    [open, setOpen, animate, onAccessDeniedContext]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
  onAccessDenied, // Recibe la prop onAccessDenied
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  onAccessDenied: (message: string) => void; // Prop onAccessDenied
}) => {
  return (
    <SidebarProvider
      open={open}
      setOpen={setOpen}
      animate={animate}
      onAccessDenied={onAccessDenied} // Pasa la prop a SidebarProvider
    >
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<"div">) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar(); // Eliminados: showAlert, alertMessage

  return (
    <div
      className={cn(
        "h-full pt-4 pb-2 px-2 hidden shadow-sm border-r md:flex md:flex-col bg-background relative",
        "transition-all duration-300 ease-in-out",
        open ? "w-[300px]" : "w-[60px]", // Ajuste para evitar `items-start` en el estado contraído
        className
      )}
      {...props}
    >
      <div className="w-full flex justify-center">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="text-foreground p-1 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Eliminado: el renderizado de Alert aquí */}

      {children}
    </div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 p-2 flex flex-row md:hidden items-center justify-between bg-background w-full"
        )}
        {...props}
      >
        <div className="flex justify-start z-20 w-full">
          <Menu className="text-foreground" onClick={() => setOpen(!open)} />
        </div>
        {open && (
          <div
            className={cn(
              "fixed h-full w-full inset-0 bg-background p-10 z-[100] flex flex-col justify-between",
              className
            )}
          >
            <div
              className="absolute right-10 top-10 z-50 text-foreground"
              onClick={() => setOpen(!open)}
            >
              <X />
            </div>
            {children}
          </div>
        )}
      </div>
    </>
  );
};

export const SidebarSectionGroup = ({
  section,
}: {
  section: SidebarSection;
}) => {
  const { open, animate } = useSidebar();

  return (
    <div className="mb-6">
      <h4
        className={cn(
          "text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2 px-2",
          animate && !open && "hidden opacity-0",
          (animate && open) ||
            (!animate && open) ||
            (!animate && !open && "inline-block opacity-100") // Lógica ajustada
        )}
      >
        {section.title}
      </h4>

      <div className="flex flex-col gap-1">
        {section.items.map((item) => (
          <SidebarLink key={item.href} link={item} />
        ))}
      </div>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: SidebarItem;
  className?: string;
}) => {
  const { open, animate, onAccessDenied } = useSidebar();
  const user = useUser();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (link.href === "/users" && user?.role === "user") {
      e.preventDefault();
      onAccessDenied(
        "Esta funcionalidad está reservada para administradores del sistema."
      );
    }
  };

  return (
    <a
      href={link.href}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-md hover:bg-muted transition",
        className
      )}
      {...props}
    >
      {link.icon}
      <span
        className={cn(
          "text-sm text-muted-foreground group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre",
          animate && !open && "hidden opacity-0",
          (animate && open) ||
            (!animate && open) ||
            (!animate && !open && "inline-block opacity-100") // Lógica ajustada
        )}
      >
        {link.title}
      </span>
    </a>
  );
};
