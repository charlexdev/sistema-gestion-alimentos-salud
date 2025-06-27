// Sidebar.tsx
import { cn } from "@/lib/classname";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { createContext, useContext, useMemo, useState } from "react";

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
  animate: boolean;
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
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = useMemo(() => openProp ?? openState, [openProp, openState]);
  const setOpen = useMemo(
    () => setOpenProp ?? setOpenState,
    [setOpenProp, setOpenState]
  );

  const value = useMemo(
    () => ({ open, setOpen, animate: animate }),
    [open, setOpen, animate]
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
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
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
  const { open, setOpen } = useSidebar();

  return (
    <div
      className={cn(
        "h-full py-2 px-2 hidden shadow-sm border-r md:flex md:flex-col bg-background relative", // ¡CAMBIO AQUÍ! 'px-2' para padding horizontal simétrico (8px izquierda y derecha)
        "transition-all duration-300 ease-in-out",
        open ? "w-[300px] items-start" : "w-[60px] items-center", // 'items-center' ya se encarga de centrar el contenido horizontalmente cuando está contraída
        className
      )}
      {...props}
    >
      {/* Contenedor del botón de toggle. Ahora centrado horizontalmente en la parte superior. */}
      {/* Se mantiene 'justify-center' para que el botón esté en el centro horizontal. */}
      <div className="w-full flex justify-center">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="text-foreground p-1 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

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
        {/* Botón de toggle para la sidebar móvil */}
        <div className="flex justify-start z-20 w-full">
          <Menu className="text-foreground" onClick={() => setOpen(!open)} />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
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
            </motion.div>
          )}
        </AnimatePresence>
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
          animate && open && "inline-block opacity-100",
          !animate && "inline-block opacity-100"
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
  const { open, animate } = useSidebar();
  return (
    <a
      href={link.href}
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
          animate && open && "inline-block opacity-100",
          !animate && "inline-block opacity-100"
        )}
      >
        {link.title}
      </span>
    </a>
  );
};
