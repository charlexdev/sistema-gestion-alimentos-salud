// client/src/pages/UnitsOfMeasurementPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  IUnitOfMeasurement,
  UnitOfMeasurementFormValues,
  UnitOfMeasurementQueryParams,
  UnitOfMeasurementListResponse,
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

// Import useUser hook from auth store (NEW)
import { useUser } from "@/stores/auth"; //

// === DEFINICIÓN LOCAL DE TIPO PARA ERRORES DE AXIOS CON RESPUESTA ===
interface ApiError {
  message?: string;
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
    !("message" in potentialAxiosError.response.data)
  ) {
    return false;
  }

  return true;
}

const UnitsOfMeasurementPage: React.FC = () => {
  const [units, setUnits] = useState<IUnitOfMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
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

  // Get the logged-in user from the Zustand store (NEW)
  const user = useUser();
  const isAdmin = user?.role === "admin"; // Check if the user has the 'admin' role

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

      const sortedUnits = [...response.unitOfMeasurements].sort((a, b) => {
        const dateA = a.createdAt
          ? new Date(a.createdAt as string | Date).getTime()
          : NaN;
        const dateB = b.createdAt
          ? new Date(b.createdAt as string | Date).getTime()
          : NaN;

        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;

        return dateA - dateB;
      });

      setUnits(sortedUnits);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err: unknown) {
      handleAxiosError(err, "unidades de medida");
      setUnits([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, handleAxiosError]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
    setIsLoading(true);
    setError(null);

    // Validate name length
    if (formValues.name.length < 2 || formValues.name.length > 40) {
      toast.error("El nombre debe tener entre 2 y 40 caracteres.");
      setIsLoading(false);
      return;
    }

    // Validate symbol length
    if (
      (formValues.symbol ?? "").length < 2 ||
      (formValues.symbol ?? "").length > 6
    ) {
      toast.error("El símbolo debe tener entre 2 y 6 caracteres.");
      setIsLoading(false);
      return;
    }

    try {
      if (currentUnit) {
        await unitOfMeasurementService.updateUnitOfMeasurement(
          currentUnit._id,
          formValues
        );
        toast.success("Unidad de medida actualizada exitosamente.");
      } else {
        await unitOfMeasurementService.createUnitOfMeasurement(formValues);
        toast.success("Unidad de medida creada exitosamente.");
      }
      handleModalClose();
      fetchUnits();
    } catch (err: unknown) {
      handleAxiosError(err, "unidad de medida");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (unit: IUnitOfMeasurement) => {
    setCurrentUnit(unit);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentUnit) return;

    setIsLoading(true);
    setError(null);
    try {
      await unitOfMeasurementService.deleteUnitOfMeasurement(currentUnit._id);
      toast.success("Unidad de medida eliminada exitosamente.");
      setIsConfirmDeleteOpen(false);
      setCurrentUnit(null);

      const newTotalCount = totalCount - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotalCount / 10));

      if (
        units.length === 1 &&
        currentPage > 1 &&
        currentPage > newTotalPages
      ) {
        setCurrentPage((prev) => prev - 1);
      } else if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      } else {
        fetchUnits();
      }
    } catch (err: unknown) {
      handleAxiosError(err, "unidad de medida");
    } finally {
      setIsLoading(false);
    }
  };

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
      a.download = `UnidadesDeMedida_${Date.now()}.xlsx`;
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
      a.download = `UnidadesDeMedida_${Date.now()}.docx`;
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
          placeholder="Buscar unidad de medida..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />

        <div className="flex w-full md:w-auto gap-2">
          {isAdmin && ( // Conditional rendering for "Crear Unidad de Medida" button
            <Button onClick={handleCreateClick} className="w-full md:w-auto">
              Agregar Unidad de Medida
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
        Total de unidades de medida: {totalCount}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Símbolo</TableHead>
              {isAdmin && ( // Conditional rendering for "Acciones" table header
                <TableHead className="text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.length > 0 ? (
              units.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>{unit.symbol || "N/A"}</TableCell>
                  {isAdmin && ( // Conditional rendering for "Acciones" table cells
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
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 3 : 2} // Adjust colspan based on isAdmin
                  className="text-center py-4"
                >
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

      {/* Modal de Creación/Edición (Only admins can open, so no need for isAdmin check here) */}
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
                  maxLength={6} // Changed from 5 to 6 to allow 6 characters
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

      {/* Modal de Confirmación de Eliminación (Only admins can open, so no need for isAdmin check here) */}
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
