// client/src/pages/ProvidersPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  IProvider,
  ProviderFormValues,
  ProviderQueryParams,
  ProviderListResponse,
} from "../types/provider";
import providerService from "../services/provider.service";
import type { AxiosRequestConfig } from "axios";
import { toast } from "sonner";
// Importaciones de componentes Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
// Importa íconos de lucide-react para exportar
import { DownloadIcon, FileTextIcon } from "lucide-react";

// === DEFINICIÓN LOCAL DE TIPO PARA ERRORES DE AXIOS CON RESPUESTA ===
// Esto permite acceder a `error.response.data` de forma segura.
interface AxiosErrorWithResponse<T = unknown> extends Error {
  isAxiosError: true;
  response: {
    data?: T; // Aquí puede ir un objeto con `message` u otros datos de error del backend
    status: number;
    statusText: string;
  };
  message: string;
  name: string;
  stack?: string;
  code?: string;
  config: AxiosRequestConfig;
}

// === FUNCIÓN DE GUARDIA DE TIPO PARA VERIFICAR AxiosError CON RESPUESTA ===
// Utilizada para asegurarse de que el error es un error de Axios con una respuesta.
function isAxiosErrorWithData<T = { message?: string }>(
  error: unknown
): error is AxiosErrorWithResponse<T> {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  // Se asume que `error` podría ser un AxiosError
  const potentialAxiosError = error as Partial<AxiosErrorWithResponse<T>>;
  return (
    potentialAxiosError.isAxiosError === true &&
    potentialAxiosError.response !== undefined &&
    potentialAxiosError.response !== null
  );
}

const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<IProvider | null>(
    null
  );
  const [formValues, setFormValues] = useState<ProviderFormValues>({
    name: "",
    contactInfo: "",
    address: "",
  });

  const limit = 10; // Número de elementos por página

  // `useCallback` para memorizar la función y evitar re-renders innecesarios
  const fetchProviders = useCallback(async () => {
    try {
      const params: ProviderQueryParams = {
        page: currentPage,
        limit: limit,
        search: searchQuery,
      };
      // La respuesta del servicio `getProviders` debe coincidir con `ProviderListResponse`
      const response: ProviderListResponse = await providerService.getProviders(
        params
      );
      setProviders(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      // Muestra un toast con un mensaje de error genérico o específico si es un error de Axios
      if (isAxiosErrorWithData(error)) {
        toast.error(
          error.response?.data?.message || "Error al cargar los proveedores."
        );
      } else {
        toast.error("Error al cargar los proveedores.");
      }
    }
  }, [currentPage, searchQuery, limit]); // Dependencias del useCallback

  // `useEffect` para cargar proveedores cuando cambian la página o la búsqueda
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Resetear a la primera página en cada búsqueda
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleCreateClick = () => {
    setCurrentProvider(null);
    setFormValues({ name: "", contactInfo: "", address: "" });
    setIsFormOpen(true);
  };

  const handleEditClick = (provider: IProvider) => {
    setCurrentProvider(provider);
    setFormValues({
      name: provider.name,
      contactInfo: provider.contactInfo || "",
      address: provider.address || "",
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (provider: IProvider) => {
    setCurrentProvider(provider);
    setIsConfirmDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentProvider) {
        await providerService.updateProvider(currentProvider._id, formValues);
        toast.success("Proveedor actualizado exitosamente.");
      } else {
        await providerService.createProvider(formValues);
        toast.success("Proveedor creado exitosamente.");
      }
      setIsFormOpen(false);
      fetchProviders(); // Recargar la lista después de crear/actualizar
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      if (isAxiosErrorWithData(error)) {
        // Acceder a .data.message de forma segura
        toast.error(
          error.response?.data?.message || "Error al guardar el proveedor."
        );
      } else {
        toast.error("Error al guardar el proveedor.");
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (currentProvider) {
      try {
        await providerService.deleteProvider(currentProvider._id);
        toast.success("Proveedor eliminado exitosamente.");
        setIsConfirmDeleteOpen(false);
        fetchProviders(); // Recargar la lista después de eliminar
      } catch (error) {
        console.error("Error al eliminar proveedor:", error);
        if (isAxiosErrorWithData(error)) {
          // Acceder a .data.message de forma segura
          toast.error(
            error.response?.data?.message || "Error al eliminar el proveedor."
          );
        } else {
          toast.error("Error al eliminar el proveedor.");
        }
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const params: ProviderQueryParams = {
        page: 1, // Para exportar, usualmente se quiere todo, o se aplica el filtro actual
        limit: totalItems > 0 ? totalItems : 10000, // Obtener todos los items para exportar, o un número grande si totalItems es 0
        search: searchQuery,
      };
      const data = await providerService.exportProvidersToExcel(params);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `proveedores_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Proveedores exportados a Excel exitosamente.");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      if (isAxiosErrorWithData(error)) {
        toast.error(
          error.response?.data?.message || "Error al exportar a Excel."
        );
      } else {
        toast.error("Error al exportar a Excel.");
      }
    }
  };

  const handleExportWord = async () => {
    try {
      const params: ProviderQueryParams = {
        page: 1,
        limit: totalItems > 0 ? totalItems : 10000, // Obtener todos los items para exportar
        search: searchQuery,
      };
      const data = await providerService.exportProvidersToWord(params);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `proveedores_${Date.now()}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Proveedores exportados a Word exitosamente.");
    } catch (error) {
      console.error("Error al exportar a Word:", error);
      if (isAxiosErrorWithData(error)) {
        toast.error(
          error.response?.data?.message || "Error al exportar a Word."
        );
      } else {
        toast.error("Error al exportar a Word.");
      }
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-3xl font-bold tracking-tight mb-8">Proveedores</h2>

      <div className="flex items-center justify-between mb-6">
        <Input
          placeholder="Buscar proveedor..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <div className="flex space-x-2">
          <Button onClick={handleCreateClick}>Agregar Nuevo Proveedor</Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <DownloadIcon className="mr-2 h-4 w-4" /> Exportar a Excel
          </Button>
          <Button variant="outline" onClick={handleExportWord}>
            <FileTextIcon className="mr-2 h-4 w-4" /> Exportar a Word
          </Button>
        </div>
      </div>
      <p className="mb-2 text-sm text-gray-600">
        Total de proveedores: {totalItems}
      </p>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Información de Contacto</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length > 0 ? (
              providers.map((provider) => (
                <TableRow key={provider._id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>{provider.contactInfo}</TableCell>
                  <TableCell>{provider.address}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(provider)}
                      className="mr-2"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(provider)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No hay proveedores.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-8">
          {" "}
          {/* O "mt-4" para que coincida si quieres */}
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                // Opcional: Añade la clase para deshabilitar visualmente
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={i + 1 === currentPage}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                // Opcional: Añade la clase para deshabilitar visualmente
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
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentProvider ? "Editar Proveedor" : "Agregar Nuevo Proveedor"}
            </DialogTitle>
            <DialogDescription>
              {currentProvider
                ? "Realiza cambios en el proveedor existente aquí."
                : "Añade un nuevo proveedor a tu base de datos."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={formValues.name}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactInfo" className="text-right">
                Contacto
              </Label>
              <Input
                id="contactInfo"
                value={formValues.contactInfo}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Dirección
              </Label>
              <Input
                id="address"
                value={formValues.address}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Guardar cambios</Button>
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
              el proveedor "{currentProvider?.name}" de la base de datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProvidersPage;
