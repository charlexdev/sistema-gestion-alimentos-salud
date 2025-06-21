// client/src/pages/UnitsOfMeasurementPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  IUnitOfMeasurement,
  UnitOfMeasurementFormValues,
  UnitOfMeasurementQueryParams,
  UnitOfMeasurementListResponse, // <- Este es el tipo que estamos usando
} from "../types/unitOfMeasurement";
import unitOfMeasurementService from "../services/unitOfMeasurement.service";
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
interface AxiosErrorWithResponse<T = unknown> extends Error {
  isAxiosError: true;
  response: {
    data?: T;
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
function isAxiosErrorWithData<T = unknown>(
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
    potentialAxiosError.response === null
  ) {
    return false;
  }

  return true;
}

const UnitsOfMeasurementPage: React.FC = () => {
  const [units, setUnits] = useState<IUnitOfMeasurement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: UnitOfMeasurementQueryParams = {
        page: currentPage,
        limit: 10,
        search: searchQuery,
      };
      // Aquí es donde añadimos la anotación de tipo explícita
      const response: UnitOfMeasurementListResponse =
        await unitOfMeasurementService.getUnitsOfMeasurement(params);
      setUnits(response.unitOfMeasurements);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err: unknown) {
      console.error("Error fetching units of measurement:", err);
      if (isAxiosErrorWithData<{ message: string }>(err)) {
        setError(
          err.response.data?.message || "Error al cargar unidades de medida."
        );
      } else {
        setError("Ocurrió un error inesperado al cargar unidades de medida.");
      }
      setUnits([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

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
      fetchUnits();
    } catch (err: unknown) {
      console.error("Error saving unit of measurement:", err);
      if (isAxiosErrorWithData<{ message: string }>(err)) {
        toast.error(
          err.response.data?.message || "Error al guardar la unidad de medida."
        );
      } else {
        toast.error(
          "Ocurrió un error inesperado al guardar la unidad de medida."
        );
      }
    }
  };

  // Manejadores de eliminación
  const handleDeleteClick = (unit: IUnitOfMeasurement) => {
    setCurrentUnit(unit);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (currentUnit) {
      try {
        await unitOfMeasurementService.deleteUnitOfMeasurement(currentUnit._id);
        toast.success("Unidad de medida eliminada exitosamente.");
        setIsConfirmDeleteOpen(false);
        fetchUnits();
      } catch (err: unknown) {
        console.error("Error deleting unit of measurement:", err);
        if (isAxiosErrorWithData<{ message: string }>(err)) {
          toast.error(
            err.response.data?.message ||
              "Error al eliminar la unidad de medida."
          );
        } else {
          toast.error(
            "Ocurrió un error inesperado al eliminar la unidad de medida."
          );
        }
        setIsConfirmDeleteOpen(false);
      }
    }
  };

  // --- Manejadores de Eventos de Exportación ---
  const handleExportToExcel = async () => {
    try {
      const params: UnitOfMeasurementQueryParams = {
        search: searchQuery,
      };
      const blob = await unitOfMeasurementService.exportUnitsToExcel(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `UnidadesDeMedida_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Reporte de unidades de medida exportado a Excel.");
    } catch (error: unknown) {
      console.error("Error exporting to Excel:", error);
      if (isAxiosErrorWithData<{ message: string }>(error)) {
        toast.error(
          error.response.data?.message ||
            "No se pudo exportar el reporte a Excel."
        );
      } else {
        toast.error("Ocurrió un error inesperado al exportar el reporte.");
      }
    }
  };

  const handleExportToWord = async () => {
    try {
      const params: UnitOfMeasurementQueryParams = {
        search: searchQuery,
      };
      const blob = await unitOfMeasurementService.exportUnitsToWord(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `UnidadesDeMedida_${new Date()
        .toISOString()
        .slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Reporte de unidades de medida exportado a Word.");
    } catch (error: unknown) {
      console.error("Error exporting to Word:", error);
      if (isAxiosErrorWithData<{ message: string }>(error)) {
        toast.error(
          error.response.data?.message ||
            "No se pudo exportar el reporte a Word."
        );
      } else {
        toast.error("Ocurrió un error inesperado al exportar el reporte.");
      }
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gestión de Unidades de Medida</h1>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <Input
          type="text"
          placeholder="Buscar por nombre o símbolo..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm flex-1"
        />

        <Button onClick={handleCreateClick} className="ml-auto">
          Crear Unidad de Medida
        </Button>
        {/* BOTONES DE EXPORTACIÓN */}
        <Button
          onClick={handleExportToExcel}
          variant="outline"
          className="gap-2"
        >
          <DownloadIcon className="size-4" /> Exportar a Excel
        </Button>
        <Button
          onClick={handleExportToWord}
          variant="outline"
          className="gap-2"
        >
          <FileTextIcon className="size-4" /> Exportar a Word
        </Button>
      </div>

      {loading ? (
        <p>Cargando unidades de medida...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : units.length === 0 ? (
        <p>No se encontraron unidades de medida.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Símbolo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>{unit.symbol || "N/A"}</TableCell>
                  <TableCell className="text-right">
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
              ))}
            </TableBody>
          </Table>

          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-disabled={currentPage <= 1}
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                  className={
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-disabled={currentPage >= totalPages}
                  tabIndex={currentPage >= totalPages ? -1 : undefined}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Mostrando {units.length} de {totalCount} unidades de medida.
          </p>
        </>
      )}

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
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
              la unidad de medida "{currentUnit?.name}" de la base de datos.
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

export default UnitsOfMeasurementPage;
