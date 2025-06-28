// client/src/pages/ProvidersPage.tsx
import React, { useState, useEffect, useCallback } from "react";
// Importamos los tipos directamente aquí para la demostración
// Idealmente, estos tipos deberían provenir de '../types/provider'
// Si estos tipos ya existen en tu archivo ../types/provider.ts,
// debes actualizar ese archivo y luego eliminar estas definiciones locales.

// === DEFINICIÓN LOCAL DE TIPOS ACTUALIZADOS ===
interface IProvider {
  _id: string;
  name: string;
  email?: string; // Nuevo campo para el correo
  phoneNumber?: string; // Nuevo campo para el número de teléfono fijo
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProviderFormValues {
  name: string;
  email?: string; // Nuevo campo en el formulario
  phoneNumber?: string; // Nuevo campo en el formulario
  address: string;
}

interface ProviderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface ProviderListResponse {
  data: IProvider[];
  totalPages: number;
  totalItems: number;
  currentPage: number;
}

// Fin de la definición de tipos locales (reemplazar por importación si ya existen)

import providerService from "../api/services/provider";
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
  // Estado inicial con los nuevos campos
  const [formValues, setFormValues] = useState<ProviderFormValues>({
    name: "",
    email: "",
    phoneNumber: "",
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

  // Función para manejar los cambios en los nuevos campos del formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleCreateClick = () => {
    setCurrentProvider(null);
    // Inicializar los nuevos campos como vacíos para un nuevo proveedor
    setFormValues({ name: "", email: "", phoneNumber: "", address: "" });
    setIsFormOpen(true);
  };

  const handleEditClick = (provider: IProvider) => {
    setCurrentProvider(provider);
    // Rellenar los campos del formulario con los datos del proveedor existente
    setFormValues({
      name: provider.name,
      email: provider.email || "", // Usar el nuevo campo 'email'
      phoneNumber: provider.phoneNumber || "", // Usar el nuevo campo 'phoneNumber'
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

    // Aseguramos que email y phoneNumber sean strings no nulos/undefined para las validaciones.
    const email = formValues.email?.trim() || "";
    const phoneNumber = formValues.phoneNumber?.trim() || "";

    // Regex para validar email (básico, puedes ajustarlo para ser más estricto)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    // Regex para validar número de teléfono fijo de 8 dígitos
    const phoneRegex = /^\d{8}$/;

    let isValid = true; // Bandera para controlar la validez del formulario

    // Validación: Al menos un método de contacto debe ser introducido
    if (!email && !phoneNumber) {
      toast.error("Introduzca al menos un método de contacto.");
      isValid = false;
    }

    // Validación del Email si se proporcionó
    if (email) {
      if (!emailRegex.test(email)) {
        toast.error("El formato del correo electrónico es inválido.");
        isValid = false;
      }
      if (email.length > 50) {
        toast.error("El correo electrónico no debe exceder los 50 caracteres.");
        isValid = false;
      }
    }

    // Validación del Número de Teléfono Fijo si se proporcionó
    if (phoneNumber) {
      // El regex /^\d{8}$/ ya asegura que tenga exactamente 8 dígitos.
      if (!phoneRegex.test(phoneNumber)) {
        toast.error(
          "El número de teléfono fijo debe tener exactamente 8 dígitos."
        );
        isValid = false;
      }
    }

    // Si alguna validación falló, detener el envío del formulario
    if (!isValid) {
      return;
    }

    try {
      if (currentProvider) {
        // Enviar los nuevos formValues con email y phoneNumber
        await providerService.updateProvider(currentProvider._id, formValues);
        toast.success("Proveedor actualizado exitosamente.");
      } else {
        // Enviar los nuevos formValues con email y phoneNumber
        await providerService.createProvider(formValues);
        toast.success("Proveedor creado exitosamente.");
      }
      setIsFormOpen(false);
      fetchProviders(); // Recargar la lista después de crear/actualizar
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      if (isAxiosErrorWithData(error)) {
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

        // Lógica para navegar a la página anterior si la página actual queda vacía
        const updatedTotalItems = totalItems - 1;

        if (
          providers.length === 1 &&
          currentPage > 1 &&
          updatedTotalItems > 0
        ) {
          // Si este era el último elemento en la página actual y no la primera página,
          // y aún quedan elementos en total, ir a la página anterior.
          setCurrentPage(currentPage - 1);
        } else if (updatedTotalItems === 0) {
          // Si todos los elementos son eliminados, reiniciar a la página 1
          setCurrentPage(1);
        } else {
          // De lo contrario, simplemente volver a cargar los proveedores para la página actual
          fetchProviders();
        }
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
              <TableHead>Correo Electrónico</TableHead> {/* Nuevo encabezado */}
              <TableHead>Teléfono Fijo</TableHead> {/* Nuevo encabezado */}
              <TableHead>Dirección</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length > 0 ? (
              providers.map((provider) => (
                <TableRow key={provider._id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>{provider.email}</TableCell> {/* Mostrar correo */}
                  <TableCell>{provider.phoneNumber}</TableCell>{" "}
                  {/* Mostrar teléfono */}
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
                <TableCell colSpan={5} className="text-center">
                  {" "}
                  {/* Aumentar colSpan a 5 */}
                  No hay proveedores.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* La paginación ahora se muestra siempre */}
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : undefined
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
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          {" "}
          {/* Ancho ajustado aquí */}
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
          {/* Formulario con la nueva estructura de cuadrícula */}
          <form
            onSubmit={handleFormSubmit}
            className="grid grid-cols-[auto_1fr] items-center gap-4 py-4"
          >
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={formValues.name}
              onChange={handleFormChange}
              required
            />

            {/* Sección de Información de Contacto - abarca ambas columnas */}
            <h4 className="col-span-2 text-left text-sm font-semibold mt-2 mb-1">
              Información de Contacto
            </h4>

            <Label htmlFor="email" className="text-right">
              Correo
            </Label>
            <Input
              id="email"
              type="email"
              value={formValues.email}
              onChange={handleFormChange}
              maxLength={50}
              placeholder="ejemplo@dominio.com"
            />

            <Label htmlFor="phoneNumber" className="text-right">
              Teléfono Fijo
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formValues.phoneNumber}
              onChange={handleFormChange}
              maxLength={8}
              placeholder="12345678"
            />

            <Label htmlFor="address" className="text-right">
              Dirección
            </Label>
            <Input
              id="address"
              value={formValues.address}
              onChange={handleFormChange}
            />

            <DialogFooter className="col-span-2">
              {" "}
              {/* Footer también abarca ambas columnas */}
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
