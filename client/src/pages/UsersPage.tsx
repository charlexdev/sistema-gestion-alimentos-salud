// client/src/pages/UsersPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { User } from "@/api/schemas/user";
import type { UserFormValues, UserQueryParams } from "@/types/user";
import userService from "@/api/services/user.service";
import type { AxiosRequestConfig } from "axios";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DownloadIcon, FileTextIcon } from "lucide-react";
import { useUser } from "@/stores/auth";

// === DEFINICIÓN LOCAL DE TIPO PARA ERRORES DE AXIOS CON RESPUESTA ===
interface ApiError {
  message: string;
}

interface AxiosErrorWithResponse<T = ApiError> extends Error {
  isAxiosError: true;
  response: {
    data?: T;
    status: number;
    statusText: string;
    headers?: Record<string, string>;
    config: AxiosRequestConfig;
    request?: unknown;
  };
  message: string;
  name: string;
  stack?: string;
  code?: string;
  config: AxiosRequestConfig;
  request?: unknown;
}

function isAxiosErrorWithData<T = ApiError>(
  error: unknown
): error is AxiosErrorWithResponse<T> {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const potentialAxiosError = error as Partial<AxiosErrorWithResponse<T>>;
  if (potentialAxiosError.isAxiosError !== true) {
    return false;
  }

  if (
    potentialAxiosError.response === undefined ||
    potentialAxiosError.response.data === undefined ||
    typeof potentialAxiosError.response.data !== "object" ||
    potentialAxiosError.response.data === null ||
    !("message" in potentialAxiosError.response.data)
  ) {
    return false;
  }

  return true;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<
    (User & { _id?: string }) | null
  >(null);

  const [formValues, setFormValues] = useState<UserFormValues>({
    username: "",
    email: "",
    password: "",
    role: "user",
  });
  const [isEditMode, setIsEditMode] = useState(false);

  const authenticatedUser = useUser(); // Usuario logueado
  const userRole = authenticatedUser?.role;

  const handleAxiosError = useCallback(
    (error: unknown, entityName: string) => {
      if (isAxiosErrorWithData(error)) {
        toast.error(
          error.response.data?.message ||
            `Error al ${
              entityName === "usuarios" ? "cargar" : "gestionar"
            } ${entityName}. Por favor, inténtalo de nuevo.`
        );
      } else {
        toast.error(
          `Ocurrió un error inesperado al ${
            entityName === "usuarios" ? "cargar" : "gestionar"
          } ${entityName}. Por favor, inténtalo de nuevo.`
        );
      }
      setError(`Error al ${entityName}.`);
    },
    [setError]
  );

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: UserQueryParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      };
      const response = await userService.getUsers(params);

      setUsers(response.users || []);
      setTotalItems(response.totalItems);
      setTotalPages(response.totalPages);
    } catch (error) {
      handleAxiosError(error, "usuarios");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, handleAxiosError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isEditMode && currentUser) {
        const dataToUpdate: UserFormValues = {
          username: formValues.username,
          email: formValues.email,
          password: formValues.password,
          role: formValues.role,
        };

        if (!dataToUpdate.password) {
          toast.error(
            "La contraseña es obligatoria para actualizar el usuario."
          );
          setIsLoading(false);
          return;
        }

        const userIdToUpdate = currentUser.id || currentUser._id;
        // console.log("FRONTEND LOG (3): handleSubmit - Modo edición. ID a enviar:", userIdToUpdate); // Mantener para depuración si es necesario
        // console.log("FRONTEND LOG (4): handleSubmit - Datos a enviar para actualización:", dataToUpdate); // Mantener para depuración si es necesario

        if (!userIdToUpdate) {
          console.error(
            "FRONTEND ERROR: ID de usuario es undefined o null al intentar actualizar."
          );
          toast.error(
            "Error: ID de usuario no disponible para la actualización."
          );
          setIsLoading(false);
          return;
        }

        await userService.updateUser(userIdToUpdate, dataToUpdate);
        toast.success("Usuario actualizado exitosamente.");
      } else {
        if (!formValues.password) {
          toast.error("La contraseña es requerida para nuevos usuarios.");
          setIsLoading(false);
          return;
        }
        await userService.createUser(formValues);
        toast.success("Usuario creado exitosamente.");
      }
      setIsFormModalOpen(false);
      setFormValues({ username: "", email: "", password: "", role: "user" });
      setCurrentUser(null);
      setIsEditMode(false);
      fetchUsers();
    } catch (error) {
      handleAxiosError(error, "usuario");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    setFormValues({ username: "", email: "", password: "", role: "user" });
    setCurrentUser(null);
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (user: User & { _id?: string }) => {
    // console.log("FRONTEND LOG (1): handleEditClick - Usuario recibido:", user); // Mantener para depuración si es necesario
    // console.log("FRONTEND LOG (2): handleEditClick - ID del usuario (user.id):", user.id); // Mantener para depuración si es necesario
    // console.log("FRONTEND LOG (2a): handleEditClick - ID del usuario (user._id):", user._id); // Mantener para depuración si es necesario

    setCurrentUser(user);
    setFormValues({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
    });
    setIsEditMode(true);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (user: User & { _id?: string }) => {
    setCurrentUser(user);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentUser) return;

    // Obtiene el ID del usuario que se intenta eliminar, priorizando 'id'
    const userIdToDelete = currentUser.id || currentUser._id;
    // Obtiene el ID del usuario logueado
    const loggedInUserId = authenticatedUser?.id || authenticatedUser?._id; // Usa id o _id para el usuario autenticado también

    // === INICIO CAMBIO PARA IMPEDIR AUTO-ELIMINACIÓN ===
    if (userIdToDelete === loggedInUserId) {
      toast.error("No puedes eliminar tu propio usuario.");
      setIsConfirmDeleteOpen(false);
      setIsLoading(false); // Asegúrate de que el loading se resetee si estaba activo
      return;
    }
    // === FIN CAMBIO ===

    setIsLoading(true);
    setError(null);
    try {
      if (!userIdToDelete) {
        console.error(
          "FRONTEND ERROR: ID de usuario es undefined o null al intentar eliminar."
        );
        toast.error("Error: ID de usuario no disponible para la eliminación.");
        setIsLoading(false);
        return;
      }
      await userService.deleteUser(userIdToDelete);
      toast.success("Usuario eliminado exitosamente.");
      setIsConfirmDeleteOpen(false);
      setCurrentUser(null);
      fetchUsers();
    } catch (error) {
      handleAxiosError(error, "usuario");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleExportToExcel = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: UserQueryParams = {
        search: searchTerm,
      };
      const blob = await userService.exportUsersToExcel(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `usuarios_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Usuarios exportados a Excel exitosamente.");
    } catch (error) {
      handleAxiosError(error, "exportar a Excel");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, handleAxiosError]);

  const handleExportToWord = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: UserQueryParams = {
        search: searchTerm,
      };
      const blob = await userService.exportUsersToWord(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `usuarios_${Date.now()}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Usuarios exportados a Word exitosamente.");
    } catch (error) {
      handleAxiosError(error, "exportar a Word");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, handleAxiosError]);

  if (isLoading && users.length === 0) {
    return <div className="text-center py-4">Cargando usuarios...</div>;
  }

  if (userRole !== "admin") {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        Acceso denegado. Solo los administradores pueden gestionar usuarios.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <Input
          type="text"
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <div className="flex w-full md:w-auto gap-2">
          {userRole === "admin" && (
            <Button onClick={handleCreateClick} className="w-full md:w-auto">
              Agregar Usuario
            </Button>
          )}
          <Button
            onClick={handleExportToExcel}
            className="w-full md:w-auto"
            variant="outline"
            disabled={isLoading}
          >
            <DownloadIcon className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button
            onClick={handleExportToWord}
            className="w-full md:w-auto"
            variant="outline"
            disabled={isLoading}
          >
            <FileTextIcon className="mr-2 h-4 w-4" /> Word
          </Button>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-600">
        Total de usuarios: {totalItems}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              {userRole === "admin" && (
                <TableHead className="text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id || user._id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  {userRole === "admin" && (
                    <TableCell className="text-right flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(user)}
                        className="mr-2"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                        // === Modificado: Deshabilitar si es el usuario logueado ===
                        disabled={
                          isLoading ||
                          (user.id || user._id) ===
                            (authenticatedUser?.id || authenticatedUser?._id)
                        }
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={userRole === "admin" ? 4 : 3}
                  className="text-center py-4"
                >
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : undefined}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => handlePageChange(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              aria-disabled={currentPage === totalPages}
              tabIndex={currentPage === totalPages ? -1 : undefined}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Modal de Creación/Edición */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Usuario" : "Crear Usuario"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Edita los detalles del usuario. La contraseña es obligatoria."
                : "Crea un nuevo usuario aquí. La contraseña es obligatoria."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={formValues.username}
                  onChange={handleFormChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formValues.email}
                  onChange={handleFormChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formValues.password}
                  onChange={handleFormChange}
                  className="col-span-3"
                  required={true}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rol
                </Label>
                <select
                  id="role"
                  value={formValues.role}
                  onChange={handleFormChange}
                  className="col-span-3 border rounded-md p-2"
                  required
                  // === Modificado: Deshabilitar el cambio de rol si es el usuario logueado ===
                  disabled={
                    isEditMode &&
                    (currentUser?.id || currentUser?._id) ===
                      (authenticatedUser?.id || authenticatedUser?._id)
                  }
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el usuario "{currentUser?.username}" de la base de datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={
                isLoading ||
                // === Modificado: Deshabilitar si es el usuario logueado ===
                (currentUser?.id || currentUser?._id) ===
                  (authenticatedUser?.id || authenticatedUser?._id)
              }
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
