// frontend/src/components/Header.tsx
import { useLogout } from "@/hooks/useLogout";
import { useUser } from "@/stores/auth";
import { Apple, LogOut } from "lucide-react"; // Menu y X ya no se importan aquí
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import React from "react";

export function Header() {
  const user = useUser();
  const { logout } = useLogout();

  if (!user) {
    return null;
  }

  const userName = user.username || "Usuario";
  const userRole = user.role || "Desconocido";

  const avatarInitials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "UN";

  return (
    <header className="border-b bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          {/* El botón de toggle de sidebar ha sido ELIMINADO de aquí. */}
          <Apple className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Sistema de Gestión de Alimentos
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Bienvenido, {userName}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="size-9 border-foreground border-2">
                  <AvatarFallback>{avatarInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userRole}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
