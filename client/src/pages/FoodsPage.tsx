// client/src/pages/FoodsPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  IFood,
  FoodFormValues,
  FoodQueryParams,
  FoodListResponse,
} from "../types/food";
import type {
  IUnitOfMeasurement,
  UnitOfMeasurementListResponse, // Importa UnitOfMeasurementListResponse si la usas directamente
  UnitOfMeasurementQueryParams,
} from "../types/unitOfMeasurement";
import foodService from "../services/food.service"; // Asegúrate de la ruta correcta
import unitOfMeasurementService from "../services/unitOfMeasurement.service"; // Para obtener las unidades
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
} from "@/components/ui/select"; // Para el selector de unidad
import { DownloadIcon, FileTextIcon } from "lucide-react"; // Importa íconos para exportar

// === DEFINICIÓN LOCAL DE TIPO PARA ERRORES DE AXIOS CON RESPUESTA ===
interface AxiosErrorWithResponse<T = unknown> extends Error {
  isAxiosError: boolean;
  response?: {
    data: {
      message: string;
      errors?: T;
    };
    status: number;
    headers: AxiosRequestConfig["headers"];
  };
  request?: {
    responseURL: string;
    method: string;
    headers: AxiosRequestConfig["headers"];
  };
  config: AxiosRequestConfig;
}

const FoodsPage: React.FC = () => {
  const [foods, setFoods] = useState<IFood[]>([]);
  const [unitsOfMeasurement, setUnitsOfMeasurement] = useState<
    IUnitOfMeasurement[]
  >([]); // Estado para las unidades de medida
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [currentFood, setCurrentFood] = useState<IFood | null>(null); // Para editar o eliminar
  const [formValues, setFormValues] = useState<FoodFormValues>({
    name: "",
    unitOfMeasurementId: "", // ID de la unidad seleccionada
    description: "",
  });

  const limit = 10; // Items por página

  const fetchFoods = useCallback(async () => {
    try {
      const params: FoodQueryParams = {
        page: currentPage,
        limit: limit,
        search: searchQuery,
      };
      const response: FoodListResponse = await foodService.getFoods(params);
      setFoods(response.foods);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("Error al obtener alimentos:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message ||
          "Error al cargar los alimentos. Inténtalo de nuevo."
      );
    }
  }, [currentPage, searchQuery]);

  const fetchUnitsOfMeasurement = useCallback(async () => {
    try {
      const params: UnitOfMeasurementQueryParams = { limit: 1000 }; // Obtener todas o un número grande
      const response: UnitOfMeasurementListResponse =
        await unitOfMeasurementService.getUnitsOfMeasurement(params);
      setUnitsOfMeasurement(response.unitOfMeasurements);
    } catch (error) {
      console.error("Error al obtener unidades de medida:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message ||
          "Error al cargar las unidades de medida."
      );
    }
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  useEffect(() => {
    fetchUnitsOfMeasurement();
  }, [fetchUnitsOfMeasurement]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Resetear a la primera página en cada búsqueda
  };

  const handleCreateClick = () => {
    setCurrentFood(null); // No hay alimento actual, es una creación
    setFormValues({ name: "", unitOfMeasurementId: "", description: "" }); // Limpiar formulario
    setIsFormOpen(true);
  };

  const handleEditClick = (food: IFood) => {
    setCurrentFood(food);
    // Asegúrate de que unitOfMeasurement es un objeto y accede a su _id
    const unitId =
      typeof food.unitOfMeasurement === "object" &&
      food.unitOfMeasurement !== null
        ? food.unitOfMeasurement._id
        : "";
    setFormValues({
      name: food.name,
      unitOfMeasurementId: unitId,
      description: food.description || "",
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (food: IFood) => {
    setCurrentFood(food);
    setIsConfirmDeleteOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleUnitSelectChange = (value: string) => {
    setFormValues((prev) => ({ ...prev, unitOfMeasurementId: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentFood) {
        // Actualizar alimento existente
        await foodService.updateFood(currentFood._id, formValues);
        toast.success("Alimento actualizado exitosamente.");
      } else {
        // Crear nuevo alimento
        await foodService.createFood(formValues);
        toast.success("Alimento creado exitosamente.");
      }
      setIsFormOpen(false);
      fetchFoods(); // Recargar la lista de alimentos
    } catch (error) {
      console.error("Error al guardar alimento:", error);
      const axiosError = error as AxiosErrorWithResponse;
      const errorMessage =
        axiosError.response?.data?.message ||
        "Error al guardar el alimento. Inténtalo de nuevo.";
      toast.error(errorMessage);
    }
  };

  const handleConfirmDelete = async () => {
    if (currentFood) {
      try {
        await foodService.deleteFood(currentFood._id);
        toast.success("Alimento eliminado exitosamente.");
        setIsConfirmDeleteOpen(false);
        fetchFoods(); // Recargar la lista de alimentos
      } catch (error) {
        console.error("Error al eliminar alimento:", error);
        const axiosError = error as AxiosErrorWithResponse;
        toast.error(
          axiosError.response?.data?.message ||
            "Error al eliminar el alimento. Inténtalo de nuevo."
        );
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const params: FoodQueryParams = {
        search: searchQuery,
        limit: totalCount, // Para exportar todos los resultados de la búsqueda
      };
      const blob = await foodService.exportFoodsToExcel(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `alimentos_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Exportado a Excel exitosamente.");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message ||
          "Error al exportar a Excel. Inténtalo de nuevo."
      );
    }
  };

  const handleExportWord = async () => {
    try {
      const params: FoodQueryParams = {
        search: searchQuery,
        limit: totalCount, // Para exportar todos los resultados de la búsqueda
      };
      const blob = await foodService.exportFoodsToWord(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `alimentos_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Exportado a Word exitosamente.");
    } catch (error) {
      console.error("Error al exportar a Word:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message ||
          "Error al exportar a Word. Inténtalo de nuevo."
      );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Alimentos</h1>

      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Buscar alimentos..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <div className="flex space-x-2">
          <Button onClick={handleCreateClick}>Agregar Alimento</Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <DownloadIcon className="mr-2 h-4 w-4" /> Exportar Excel
          </Button>
          <Button variant="outline" onClick={handleExportWord}>
            <FileTextIcon className="mr-2 h-4 w-4" /> Exportar Word
          </Button>
        </div>
      </div>

      {foods.length === 0 && !searchQuery ? (
        <p className="text-center text-gray-500">
          No hay alimentos registrados. ¡Comienza agregando uno!
        </p>
      ) : foods.length === 0 && searchQuery ? (
        <p className="text-center text-gray-500">
          No se encontraron alimentos para la búsqueda "{searchQuery}".
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Unidad de Medida</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {foods.map((food) => (
              <TableRow key={food._id}>
                <TableCell className="font-medium">{food.name}</TableCell>
                <TableCell>
                  {
                    // Verifica si unitOfMeasurement es un objeto antes de acceder a 'name'
                    typeof food.unitOfMeasurement === "object" &&
                    food.unitOfMeasurement !== null
                      ? food.unitOfMeasurement.name
                      : "N/A"
                  }
                </TableCell>
                <TableCell>{food.description || "N/A"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => handleEditClick(food)}
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() =>
                  handlePageChange(currentPage > 1 ? currentPage - 1 : 1)
                }
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
                  onClick={() => handlePageChange(i + 1)}
                  isActive={i + 1 === currentPage}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(
                    currentPage < totalPages ? currentPage + 1 : totalPages
                  )
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
      )}

      {/* Modal de Creación/Edición */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentFood ? "Editar Alimento" : "Crear Alimento"}
            </DialogTitle>
            <DialogDescription>
              {currentFood
                ? "Modifica los detalles del alimento existente."
                : "Añade un nuevo alimento a tu inventario."}
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
              <Label htmlFor="unitOfMeasurementId" className="text-right">
                Unidad de Medida
              </Label>
              <Select
                value={formValues.unitOfMeasurementId}
                onValueChange={handleUnitSelectChange}
                // Si `unitOfMeasurementId` es vacío, significa que no se ha seleccionado nada.
                // Asegúrate de que el valor inicial sea una cadena vacía si `currentFood` no tiene unidad o es nuevo.
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una unidad" />
                </SelectTrigger>
                <SelectContent>
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
              el alimento "{currentFood?.name}" de la base de datos.
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

export default FoodsPage;
