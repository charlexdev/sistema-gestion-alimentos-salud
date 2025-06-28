// client/src/pages/UnitsOfMeasurementPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  IUnitOfMeasurement,
  UnitOfMeasurementFormValues,
  UnitOfMeasurementQueryParams,
  UnitOfMeasurementListResponse, // <- Este es el tipo que estamos usando
} from "../types/unitOfMeasurement";
import unitOfMeasurementService from "../api/services/unit-measurement";
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
interface ApiError {
  message?: string; // message can be optional
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

// === FUNCIÓN DE GUARDIA DE TIPO PARA VERIFICAR AxiosError CON RESPUESTA ===
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
    !("message" in potentialAxiosError.response.data) // Check for message property within data
  ) {
    return false;
  }

  return true;
}

const UnitsOfMeasurementPage: React.FC = () => {
  const [units, setUnits] = useState<IUnitOfMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Cambiado de 'loading' a 'isLoading'
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0); // Cambiado de 'totalItems' a 'totalCount'
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] =
    useState<boolean>(false);
  const [currentUnit, setCurrentUnit] = useState<IUnitOfMeasurement | null>(
    null
  );
  const [formValues, setFormValues] = useState<UnitOfMeasurementFormValues>({
    name: "",
    symbol: "",
  });

  const handleAxiosError = useCallback(
    (error: unknown, entityName: string) => {
      if (isAxiosErrorWithData(error)) {
        toast.error(
          error.response.data?.message ||
            `Error al ${
              entityName === "unidades de medida" ? "cargar" : "gestionar"
            } ${entityName}. Por favor, inténtalo de nuevo.`
        );
      } else {
        toast.error(
          `Ocurrió un error inesperado al ${
            entityName === "unidades de medida" ? "cargar" : "gestionar"
          } ${entityName}. Por favor, inténtalo de nuevo.`
        );
      }
      setError(`Error al ${entityName}.`);
    },
    [setError]
  );

  const fetchUnits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: UnitOfMeasurementQueryParams = {
        page: currentPage,
        limit: 10,
        search: searchQuery,
      };
      const response: UnitOfMeasurementListResponse =
        await unitOfMeasurementService.getUnitsOfMeasurement(params);

      // --- NEW: Client-side sorting by creation time (oldest first, newest last) ---
      // Creates a shallow copy to avoid mutating the original array received from the API
      const sortedUnits = [...response.unitOfMeasurements].sort((a, b) => {
        // Attempt to get timestamps from 'createdAt' field. Handle potential missing/invalid dates.
        const dateA = a.createdAt
          ? new Date(a.createdAt as string | Date).getTime()
          : NaN;
        const dateB = b.createdAt
          ? new Date(b.createdAt as string | Date).getTime()
          : NaN;

        // If both dates are invalid, maintain their relative order
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        // If only dateA is invalid, 'a' comes after 'b' (invalid dates go to the end)
        if (isNaN(dateA)) return 1;
        // If only dateB is invalid, 'b' comes after 'a' (invalid dates go to the end)
        if (isNaN(dateB)) return -1;

        // Sort by date ascending (oldest first, newest last)
        return dateA - dateB;
      });

      setUnits(sortedUnits);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err: unknown) {
      handleAxiosError(err, "unidades de medida");
      setUnits([]);
      setTotalPages(1); // Reset total pages on error
      setTotalCount(0); // Reset total count on error
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, handleAxiosError]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Manejadores de cambios en filtros y paginación
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Manejadores del modal de creación/edición
  const handleCreateClick = () => {
    setCurrentUnit(null);
    setFormValues({ name: "", symbol: "" });
    setIsModalOpen(true);
  };

  const handleEditClick = (unit: IUnitOfMeasurement) => {
    setCurrentUnit(unit);
    setFormValues({ name: unit.name, symbol: unit.symbol || "" });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentUnit(null);
    setFormValues({ name: "", symbol: "" });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Se agrega para el estado de carga del formulario
    setError(null);
    try {
      if (currentUnit) {
        // Editar unidad
        await unitOfMeasurementService.updateUnitOfMeasurement(
          currentUnit._id,
          formValues
        );
        toast.success("Unidad de medida actualizada exitosamente.");
      } else {
        // Crear unidad
        await unitOfMeasurementService.createUnitOfMeasurement(formValues);
        toast.success("Unidad de medida creada exitosamente.");
      }
      handleModalClose();
      // Siempre vuelve a cargar los datos para asegurar la consistencia y el orden correcto
      // ya que la lógica de ordenamiento está en fetchUnits.
      fetchUnits();
    } catch (err: unknown) {
      handleAxiosError(err, "unidad de medida");
    } finally {
      setIsLoading(false); // Se agrega para finalizar el estado de carga
    }
  };

  // Manejadores de eliminación
  const handleDeleteClick = (unit: IUnitOfMeasurement) => {
    setCurrentUnit(unit);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentUnit) return; // Se añade una guarda

    setIsLoading(true); // Se agrega para el estado de carga de la eliminación
    setError(null);
    try {
      await unitOfMeasurementService.deleteUnitOfMeasurement(currentUnit._id);
      toast.success("Unidad de medida eliminada exitosamente.");
      setIsConfirmDeleteOpen(false);
      setCurrentUnit(null); // Limpiar currentUnit después de eliminar

      // Lógica de paginación similar a FoodsPage
      const newTotalCount = totalCount - 1;
      const newTotalPages = Math.max(
        1,
        Math.ceil(newTotalCount / 10) // 10 es itemsPerPage fijo
      );

      if (
        units.length === 1 &&
        currentPage > 1 &&
        currentPage > newTotalPages
      ) {
        setCurrentPage((prev) => prev - 1);
      } else if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      } else {
        fetchUnits(); // Re-fetch para actualizar la lista y su orden
      }
    } catch (err: unknown) {
      handleAxiosError(err, "unidad de medida");
    } finally {
      setIsLoading(false); // Se agrega para finalizar el estado de carga
    }
  };

  // --- Manejadores de Eventos de Exportación ---
  const handleExportToExcel = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: UnitOfMeasurementQueryParams = {
        search: searchQuery,
      };
      const blob = await unitOfMeasurementService.exportUnitsToExcel(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `UnidadesDeMedida_${Date.now()}.xlsx`; // Formato de nombre de archivo similar
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Reporte de unidades de medida exportado a Excel.");
    } catch (error: unknown) {
      handleAxiosError(error, "exportar a Excel");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, handleAxiosError]);

  const handleExportToWord = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: UnitOfMeasurementQueryParams = {
        search: searchQuery,
      };
      const blob = await unitOfMeasurementService.exportUnitsToWord(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `UnidadesDeMedida_${Date.now()}.docx`; // Formato de nombre de archivo similar
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Reporte de unidades de medida exportado a Word.");
    } catch (error: unknown) {
      handleAxiosError(error, "exportar a Word");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, handleAxiosError]);

  if (isLoading && units.length === 0) {
    return (
      <div className="text-center py-4">Cargando unidades de medida...</div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Unidades de Medida</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <Input
          type="text"
          placeholder="Buscar por nombre o símbolo"
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />

        <div className="flex w-full md:w-auto gap-2">
          <Button onClick={handleCreateClick} className="w-full md:w-auto">
            Crear Unidad de Medida
          </Button>
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
        Total de unidades de medida: {totalCount}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Símbolo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.length > 0 ? (
              units.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>{unit.symbol || "N/A"}</TableCell>
                  <TableCell className="text-right flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(unit)}
                      className="mr-2"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(unit)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No se encontraron unidades de medida.
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
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentUnit
                ? "Editar Unidad de Medida"
                : "Crear Nueva Unidad de Medida"}
            </DialogTitle>
            <DialogDescription>
              {currentUnit
                ? "Realiza cambios a esta unidad de medida."
                : "Añade una nueva unidad de medida a tu inventario."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
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
                <Label htmlFor="symbol" className="text-right">
                  Símbolo
                </Label>
                <Input
                  id="symbol"
                  value={formValues.symbol}
                  onChange={handleFormChange}
                  className="col-span-3"
                />
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
              la unidad de medida "{currentUnit?.name}" de la base de datos.
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
              disabled={isLoading}
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnitsOfMeasurementPage;
