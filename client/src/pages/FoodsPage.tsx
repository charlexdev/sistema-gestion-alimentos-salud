// client/src/pages/FoodsPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { IFood, FoodFormValues, FoodQueryParams } from "../types/food";
import type { IUnitOfMeasurement } from "../types/unitOfMeasurement";
import foodService from "../api/services/food";
import unitOfMeasurementService from "../api/services/unit-measurement";
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

// Import useUser hook from auth store
import { useUser } from "@/stores/auth";

// Import Select components from shadcn/ui
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const FoodsPage: React.FC = () => {
  const [foods, setFoods] = useState<IFood[]>([]);
  const [unitsOfMeasurement, setUnitsOfMeasurement] = useState<
    IUnitOfMeasurement[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUnitOfMeasurementId, setSelectedUnitOfMeasurementId] =
    useState<string>("all"); // Cambiado el valor inicial a "all" para el filtro

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [currentFood, setCurrentFood] = useState<IFood | null>(null);

  // Estado del formulario
  const [formValues, setFormValues] = useState<FoodFormValues>({
    name: "",
    unitOfMeasurementId: "",
    description: "",
  });

  // Get the logged-in user from the Zustand store
  const user = useUser();
  const isAdmin = user?.role === "admin"; // Check if the user has the 'admin' role

  const handleAxiosError = useCallback(
    (error: unknown, entityName: string) => {
      if (isAxiosErrorWithData(error)) {
        toast.error(
          error.response.data?.message ||
            `Error al ${
              entityName === "alimentos" ? "cargar" : "gestionar"
            } ${entityName}. Por favor, inténtalo de nuevo.`
        );
      } else {
        toast.error(
          `Ocurrió un error inesperado al ${
            entityName === "alimentos" ? "cargar" : "gestionar"
          } ${entityName}. Por favor, inténtalo de nuevo.`
        );
      }
      setError(`Error al ${entityName}.`);
    },
    [setError]
  );

  const fetchFoods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: FoodQueryParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      };

      // Incluir la unidad de medida seleccionada si existe y no es "all"
      if (
        selectedUnitOfMeasurementId &&
        selectedUnitOfMeasurementId !== "all"
      ) {
        params.unitOfMeasurementId = selectedUnitOfMeasurementId;
      }

      const response = await foodService.getFoods(params);

      setFoods(response.data || []);
      setTotalItems(response.totalItems);
      setTotalPages(response.totalPages);
    } catch (error) {
      handleAxiosError(error, "alimentos");
      setFoods([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    selectedUnitOfMeasurementId,
    handleAxiosError,
    setError,
  ]); // Añadir selectedUnitOfMeasurementId como dependencia

  const fetchUnitsOfMeasurement = useCallback(async () => {
    try {
      const response = await unitOfMeasurementService.getUnitsOfMeasurement({});
      setUnitsOfMeasurement(response.unitOfMeasurements);
    } catch (error) {
      handleAxiosError(error, "unidades de medida");
    }
  }, [handleAxiosError]);

  useEffect(() => {
    fetchFoods();
    fetchUnitsOfMeasurement();
  }, [fetchFoods, fetchUnitsOfMeasurement]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  // Handler for select changes in the form. Value for select is passed directly.
  const handleSelectFormChange = (id: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (formValues.name.length < 2 || formValues.name.length > 40) {
      toast.error("El nombre debe tener entre 2 y 40 caracteres.");
      return;
    }

    if (
      formValues.description &&
      (formValues.description.length < 6 || formValues.description.length > 40)
    ) {
      toast.error(
        "La descripción debe tener entre 6 y 40 caracteres o estar vacía."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (currentFood) {
        await foodService.updateFood(currentFood._id, formValues);
        toast.success("Alimento actualizado exitosamente.");
      } else {
        await foodService.createFood(formValues);
        toast.success("Alimento creado exitosamente.");
      }
      setIsFormModalOpen(false);
      setFormValues({ name: "", unitOfMeasurementId: "", description: "" });
      setCurrentFood(null);
      fetchFoods();
    } catch (error) {
      handleAxiosError(error, "alimento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    setFormValues({ name: "", unitOfMeasurementId: "", description: "" });
    setCurrentFood(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (food: IFood) => {
    setCurrentFood(food);
    setFormValues({
      name: food.name,
      unitOfMeasurementId:
        typeof food.unitOfMeasurement === "object"
          ? food.unitOfMeasurement._id
          : food.unitOfMeasurement,
      description: food.description || "",
    });
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (food: IFood) => {
    setCurrentFood(food);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentFood) return;

    setIsLoading(true);
    setError(null);
    try {
      await foodService.deleteFood(currentFood._id);
      toast.success("Alimento eliminado exitosamente.");
      setIsConfirmDeleteOpen(false);
      setCurrentFood(null);

      const newTotalItems = totalItems - 1;
      const newTotalPages = Math.max(
        1,
        Math.ceil(newTotalItems / itemsPerPage)
      );

      if (
        foods.length === 1 &&
        currentPage > 1 &&
        currentPage > newTotalPages
      ) {
        setCurrentPage((prev) => prev - 1);
      } else if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      } else {
        fetchFoods();
      }
    } catch (error) {
      handleAxiosError(error, "alimento");
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

  // Nuevo manejador para el cambio de unidad de medida
  const handleUnitOfMeasurementChange = (value: string) => {
    setSelectedUnitOfMeasurementId(value);
    setCurrentPage(1); // Reiniciar a la primera página al cambiar el filtro
  };

  const handleExportToExcel = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FoodQueryParams = {
        search: searchTerm,
      };
      if (
        selectedUnitOfMeasurementId &&
        selectedUnitOfMeasurementId !== "all"
      ) {
        // Incluir la unidad de medida en la exportación
        params.unitOfMeasurementId = selectedUnitOfMeasurementId;
      }
      const blob = await foodService.exportFoodsToExcel(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `alimentos_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Alimentos exportados a Excel exitosamente.");
    } catch (error) {
      handleAxiosError(error, "exportar a Excel");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedUnitOfMeasurementId, handleAxiosError]);

  const handleExportToWord = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FoodQueryParams = {
        search: searchTerm,
      };
      if (
        selectedUnitOfMeasurementId &&
        selectedUnitOfMeasurementId !== "all"
      ) {
        // Incluir la unidad de medida en la exportación
        params.unitOfMeasurementId = selectedUnitOfMeasurementId;
      }
      const blob = await foodService.exportFoodsToWord(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `alimentos_${Date.now()}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Alimentos exportados a Word exitosamente.");
    } catch (error) {
      handleAxiosError(error, "exportar a Word");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedUnitOfMeasurementId, handleAxiosError]);

  if (isLoading && foods.length === 0) {
    return <div className="text-center py-4">Cargando alimentos...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Alimentos</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <Input
          type="text"
          placeholder="Buscar por nombre"
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm"
        />

        {/* Combined div for Unit of Measurement Selector and Buttons */}
        <div className="flex w-full md:w-auto gap-2 items-center">
          {/* Replaced native select with shadcn/ui Select component */}
          <Select
            onValueChange={handleUnitOfMeasurementChange}
            value={selectedUnitOfMeasurementId}
          >
            <SelectTrigger className="h-10 w-full md:max-w-[180px]">
              <SelectValue placeholder="Todas las Unidades" />
            </SelectTrigger>
            <SelectContent>
              {/* Changed value from "" to "all" */}
              <SelectItem value="all">Todas las Unidades</SelectItem>
              {unitsOfMeasurement.map((unit) => (
                <SelectItem key={unit._id} value={unit._id}>
                  {unit.name} ({unit.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdmin && (
            <Button onClick={handleCreateClick} className="w-full md:w-auto">
              Agregar Alimento
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
        Total de alimentos: {totalItems}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Unidad de Medida</TableHead>
              <TableHead>Descripción</TableHead>
              {isAdmin && (
                <TableHead className="text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {foods.length > 0 ? (
              foods.map((food) => (
                <TableRow key={food._id}>
                  <TableCell className="font-medium">{food.name}</TableCell>
                  <TableCell>
                    {typeof food.unitOfMeasurement === "object"
                      ? food.unitOfMeasurement.name
                      : "Cargando..."}
                  </TableCell>
                  <TableCell>{food.description || "N/A"}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(food)}
                        className="mr-2"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(food)}
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
                  colSpan={isAdmin ? 4 : 3}
                  className="text-center py-4"
                >
                  No se encontraron alimentos.
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

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentFood ? "Editar Alimento" : "Crear Alimento"}
            </DialogTitle>
            <DialogDescription>
              {currentFood
                ? "Edita los detalles del alimento."
                : "Crea un nuevo alimento aquí."}
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
                <Label htmlFor="unitOfMeasurementId" className="text-right">
                  Unidad de Medida
                </Label>
                {/* Updated onValueChange for form select */}
                <Select
                  onValueChange={(value) =>
                    handleSelectFormChange("unitOfMeasurementId", value)
                  }
                  value={formValues.unitOfMeasurementId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione una unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Changed value from "" to a valid string for the form's initial empty state */}
                    <SelectItem value="none">Seleccione una unidad</SelectItem>
                    {unitsOfMeasurement.map((unit) => (
                      <SelectItem key={unit._id} value={unit._id}>
                        {unit.name} ({unit.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descripción
                </Label>
                <Input
                  id="description"
                  value={formValues.description}
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

      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el alimento "{currentFood?.name}" de la base de datos.
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

export default FoodsPage;
