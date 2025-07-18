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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<"admin" | "user" | "all">("all");

  const authenticatedUser = useUser();
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
        // Convert "all" to an empty string for the API, or simply omit the role parameter
        ...(roleFilter !== "all" && { role: roleFilter as "admin" | "user" }), // This line ensures 'role' is only included if not 'all'
      };
      const response = await userService.getUsers(params);

      setUsers(response.users || []);
      setTotalItems(response.totalItems);
      setTotalPages(response.totalPages);

      // Logic to redirect to previous page if current page becomes empty after a deletion
      if (
        response.users &&
        response.users.length === 0 &&
        currentPage > 1 &&
        response.totalPages < currentPage
      ) {
        setCurrentPage((prevPage) => prevPage - 1);
      }
    } catch (error) {
      handleAxiosError(error, "usuarios");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, roleFilter, handleAxiosError]);

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

    // Email validation on change
    if (id === "email") {
      if (value.length > 50) {
        setEmailError("El correo no puede exceder los 50 caracteres.");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value !== "") {
        // Only show format error if not empty
        setEmailError("El correo electrónico no tiene un formato válido.");
      } else {
        setEmailError(null);
      }
    }

    // Username validation on change
    if (id === "username") {
      if (value.length < 6 || value.length > 40) {
        setUsernameError(
          "El nombre de usuario debe tener entre 6 y 40 caracteres."
        );
      } else {
        setUsernameError(null);
      }
    }

    // Password validation on change
    if (id === "password") {
      if (value.length > 0 && (value.length < 6 || value.length > 40)) {
        // Only validate if password is not empty
        setPasswordError("La contraseña debe tener entre 6 y 40 caracteres.");
      } else {
        setPasswordError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Final email validation before submission
    if (formValues.email.length > 50) {
      toast.error("El correo no puede exceder los 50 caracteres.");
      setIsLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      toast.error("El correo electrónico no tiene un formato válido.");
      setIsLoading(false);
      return;
    }

    // Final username validation
    if (formValues.username.length < 6 || formValues.username.length > 40) {
      toast.error("El nombre de usuario debe tener entre 6 y 40 caracteres.");
      setIsLoading(false);
      return;
    }

    // Final password validation
    if (formValues.password.length < 6 || formValues.password.length > 40) {
      toast.error("La contraseña debe tener entre 6 y 40 caracteres.");
      setIsLoading(false);
      return;
    }

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
      setEmailError(null); // Clear error on successful submission
      setUsernameError(null);
      setPasswordError(null);
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
    setEmailError(null); // Clear error when opening for creation
    setUsernameError(null);
    setPasswordError(null);
  };

  const handleEditClick = (user: User & { _id?: string }) => {
    setCurrentUser(user);
    setFormValues({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
    });
    setIsEditMode(true);
    setIsFormModalOpen(true);
    setEmailError(null); // Clear error when opening for editing
    setUsernameError(null);
    setPasswordError(null);
  };

  const handleDeleteClick = (user: User & { _id?: string }) => {
    setCurrentUser(user);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentUser) return;

    const userIdToDelete = currentUser.id || currentUser._id;
    const loggedInUserId = authenticatedUser?.id || authenticatedUser?._id;

    if (userIdToDelete === loggedInUserId) {
      toast.error("No puedes eliminar tu propio usuario.");
      setIsConfirmDeleteOpen(false);
      setIsLoading(false);
      return;
    }

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
      fetchUsers(); // Re-fetch users after deletion
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

  const handleRoleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement> | { target: { value: string } }
  ) => {
    // Map "all" from SelectItem back to "" for your roleFilter state/query params
    const selectedValue = e.target.value;
    setRoleFilter(selectedValue as "admin" | "user" | "all"); // Update state with "all"
    setCurrentPage(1);
  };

  const handleExportToExcel = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: UserQueryParams = {
        search: searchTerm,
        ...(roleFilter !== "all" && { role: roleFilter as "admin" | "user" }),
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
  }, [searchTerm, roleFilter, handleAxiosError]);

  const handleExportToWord = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: UserQueryParams = {
        search: searchTerm,
        ...(roleFilter !== "all" && { role: roleFilter as "admin" | "user" }),
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
  }, [searchTerm, roleFilter, handleAxiosError]);

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

  const isFormValid =
    !emailError &&
    !usernameError &&
    !passwordError &&
    formValues.username.length >= 6 &&
    formValues.username.length <= 40 &&
    formValues.email.length > 0 &&
    formValues.email.length <= 50 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email) &&
    ((isEditMode &&
      formValues.password.length >= 6 &&
      formValues.password.length <= 40) ||
      (!isEditMode &&
        formValues.password.length >= 6 &&
        formValues.password.length <= 40));

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

        {/* MODIFIED: Combined role filter and buttons into a single flex container */}
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-2">
          <Select
            onValueChange={(value) =>
              handleRoleFilterChange({
                target: { value },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
            value={roleFilter}
          >
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Todos los Roles" />
            </SelectTrigger>
            <SelectContent>
              {/* MODIFIED: Changed value from "" to "all" */}
              <SelectItem value="all">Todos los Roles</SelectItem>
              <SelectItem value="user">Usuario</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
          {userRole === "admin" && (
            <Button onClick={handleCreateClick} className="w-full md:w-auto">
              Agregar Usuario
            </Button>
          )}
          <Button
            onClick={handleExportToExcel}
            className="w-full md:w-auto"
            variant="excel"
            disabled={isLoading}
          >
            <DownloadIcon className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button
            onClick={handleExportToWord}
            className="w-full md:w-auto"
            variant="word"
            disabled={isLoading}
          >
            <FileTextIcon className="mr-2 h-4 w-4" /> Word
          </Button>
        </div>
      </div>

      <div className="mb-2 text-sm text-yellow-600">
        Total de usuarios: {totalItems}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre de Usuario</TableHead>
              <TableHead>Correo</TableHead>
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

      {/* Pagination: Always show if totalItems > 0 */}
      {totalItems > 0 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : undefined}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : undefined
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
      )}

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
                <div className="col-span-3 flex flex-col">
                  <Input
                    id="username"
                    value={formValues.username}
                    onChange={handleFormChange}
                    required
                    minLength={6}
                    maxLength={40}
                  />
                  {usernameError && (
                    <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                  )}
                </div>
              </div>
              {/* MODIFIED: Email input and error message contained in a flex column */}
              <div className="grid grid-cols-4 items-start gap-4">
                {" "}
                {/* Changed items-center to items-start for label alignment with multi-line content */}
                <Label htmlFor="email" className="text-right pt-2">
                  {" "}
                  {/* Added pt-2 to align label with top of input */}
                  Email
                </Label>
                <div className="col-span-3 flex flex-col">
                  <Input
                    id="email"
                    type="email"
                    value={formValues.email}
                    onChange={handleFormChange}
                    required
                    maxLength={50} // HTML5 max length as an initial guard
                  />
                  {emailError && (
                    <p className="text-red-500 text-sm mt-1">{emailError}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Contraseña
                </Label>
                <div className="col-span-3 flex flex-col">
                  <Input
                    id="password"
                    type="password"
                    value={formValues.password}
                    onChange={handleFormChange}
                    required={true}
                    minLength={6}
                    maxLength={40}
                  />
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rol
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleFormChange({
                      target: { id: "role", value },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  value={formValues.role}
                  disabled={
                    isEditMode &&
                    (currentUser?.id || currentUser?._id) ===
                      (authenticatedUser?.id || authenticatedUser?._id)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading || !isFormValid}>
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
