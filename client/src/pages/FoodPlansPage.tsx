// client/src/pages/FoodPlansPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  IFoodPlan,
  FoodPlanFormValues,
  FoodPlanQueryParams,
  IPlannedFood,
} from "../types/foodPlan";
import type { IMedicalCenter } from "../types/medicalCenter";
import type { IFood } from "../types/food";
import type { IProvider } from "../types/provider";
import foodPlanService from "../api/services/foodPlanService";
import medicalCenterService from "../api/services/medicalCenterService";
import foodService from "../api/services/food";
import providerService from "../api/services/provider";
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
import { format, parseISO } from "date-fns";
import { DownloadIcon, FileTextIcon, PlusIcon, XIcon } from "lucide-react";
import { useUser } from "@/stores/auth";

// === DEFINICIÓN LOCAL DE TIPO PARA ERRORES DE AXIOS CON RESPUESTA ===
interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}

const FoodPlansPage: React.FC = () => {
  const [foodPlans, setFoodPlans] = useState<IFoodPlan[]>([]);
  const [medicalCenters, setMedicalCenters] = useState<IMedicalCenter[]>([]);
  const [foods, setFoods] = useState<IFood[]>([]);
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación y búsqueda
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [limit] = useState<number>(10); // Número de elementos por página

  // Diálogo de creación/edición
  const [isUpsertDialogOpen, setIsUpsertDialogOpen] = useState<boolean>(false);
  const [currentFoodPlan, setCurrentFoodPlan] = useState<IFoodPlan | null>(
    null
  );
  const [formValues, setFormValues] = useState<FoodPlanFormValues>({
    name: "",
    medicalCenter: "", // ID del centro médico
    type: "weekly", // Valor por defecto
    startDate: "",
    endDate: "",
    plannedFoods: [], // Array de alimentos planificados
    status: "active", // <--- AÑADE ESTA LÍNEA AQUÍ
  });

  // Diálogo de confirmación de eliminación
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] =
    useState<boolean>(false);

  const user = useUser();
  const isAdmin = user?.role === "admin";

  const fetchDependencies = useCallback(async () => {
    try {
      const [medicalCentersResponse, foodsResponse, providersResponse] =
        await Promise.all([
          medicalCenterService.getMedicalCenters({ limit: 9999 }), // Obtener todos
          foodService.getFoods({ limit: 9999 }), // Obtener todos
          providerService.getProviders({ limit: 9999 }), // Obtener todos
        ]);
      setMedicalCenters(medicalCentersResponse.data);
      setFoods(foodsResponse.data);
      setProviders(providersResponse.data);
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error al cargar dependencias:", apiError);
      toast.error(
        apiError.response?.data?.message ||
          "Error al cargar datos para formularios."
      );
    }
  }, []);

  const fetchFoodPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: FoodPlanQueryParams = {
        page: currentPage,
        limit: limit,
      };
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await foodPlanService.getFoodPlans(params);
      setFoodPlans(response.data);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error al obtener planes de alimentos:", apiError);
      setError(
        apiError.response?.data?.message ||
          "Error al cargar planes de alimentos."
      );
      toast.error(
        apiError.response?.data?.message ||
          "Error al cargar planes de alimentos."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery]);

  useEffect(() => {
    fetchDependencies();
    fetchFoodPlans();
  }, [fetchDependencies, fetchFoodPlans]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset a la primera página en cada nueva búsqueda
    fetchFoodPlans();
  };

  const openCreateDialog = () => {
    setCurrentFoodPlan(null);
    setFormValues({
      name: "",
      medicalCenter: "",
      type: "weekly",
      startDate: "",
      endDate: "",
      plannedFoods: [],
      status: "active", // <--- AÑADE ESTA LÍNEA AQUÍ
    });
    setIsUpsertDialogOpen(true);
  };

  const openEditDialog = (plan: IFoodPlan) => {
    setCurrentFoodPlan(plan);
    setFormValues({
      name: plan.name,
      medicalCenter:
        typeof plan.medicalCenter === "string"
          ? plan.medicalCenter
          : plan.medicalCenter._id,
      type: plan.type,
      startDate: format(parseISO(plan.startDate as string), "yyyy-MM-dd"), // Asegura formato ISO para input date
      endDate: format(parseISO(plan.endDate as string), "yyyy-MM-dd"), // Asegura formato ISO para input date
      plannedFoods: plan.plannedFoods.map((pf) => ({
        food: typeof pf.food === "string" ? pf.food : pf.food._id,
        provider:
          typeof pf.provider === "string" ? pf.provider : pf.provider._id,
        quantity: pf.quantity,
      })),
      status: plan.status, // <--- AÑADE ESTA LÍNEA AQUÍ
    });
    setIsUpsertDialogOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handlePlannedFoodChange = (
    index: number,
    field: keyof IPlannedFood,
    value: string | number
  ) => {
    setFormValues((prev) => {
      const updatedPlannedFoods = [...prev.plannedFoods];
      if (field === "quantity") {
        updatedPlannedFoods[index] = {
          ...updatedPlannedFoods[index],
          [field]: Number(value),
        };
      } else {
        updatedPlannedFoods[index] = {
          ...updatedPlannedFoods[index],
          [field]: value,
        };
      }
      return { ...prev, plannedFoods: updatedPlannedFoods };
    });
  };

  const addPlannedFood = () => {
    setFormValues((prev) => ({
      ...prev,
      plannedFoods: [
        ...prev.plannedFoods,
        { food: "", provider: "", quantity: 0 }, // Valores iniciales
      ],
    }));
  };

  const removePlannedFood = (index: number) => {
    setFormValues((prev) => {
      const updatedPlannedFoods = [...prev.plannedFoods];
      updatedPlannedFoods.splice(index, 1);
      return { ...prev, plannedFoods: updatedPlannedFoods };
    });
  };

  const handleUpsertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validaciones básicas de formulario
      if (
        !formValues.name ||
        !formValues.medicalCenter ||
        !formValues.type ||
        !formValues.startDate ||
        !formValues.endDate ||
        !formValues.status // <--- AÑADE ESTA VALIDACIÓN
      ) {
        toast.error("Por favor, complete todos los campos obligatorios.");
        setIsLoading(false);
        return;
      }

      for (const pf of formValues.plannedFoods) {
        if (!pf.food || !pf.provider || pf.quantity <= 0) {
          toast.error(
            "Todos los alimentos planificados deben tener un alimento, un proveedor y una cantidad válida."
          );
          setIsLoading(false);
          return;
        }
      }

      // Convertir fechas a objetos Date
      const dataToSend: FoodPlanFormValues = {
        ...formValues,
        startDate: new Date(formValues.startDate).toISOString(),
        endDate: new Date(formValues.endDate).toISOString(),
      };

      if (currentFoodPlan) {
        await foodPlanService.updateFoodPlan(currentFoodPlan._id, dataToSend);
        toast.success("Plan de alimento actualizado exitosamente.");
      } else {
        await foodPlanService.createFoodPlan(dataToSend);
        toast.success("Plan de alimento creado exitosamente.");
      }
      setIsUpsertDialogOpen(false);
      fetchFoodPlans(); // Recargar la lista
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error al guardar plan de alimento:", apiError);
      setError(
        apiError.response?.data?.message || "Error al guardar plan de alimento."
      );
      toast.error(
        apiError.response?.data?.message || "Error al guardar plan de alimento."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (plan: IFoodPlan) => {
    setCurrentFoodPlan(plan);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentFoodPlan) return;

    setIsLoading(true);
    setError(null);
    try {
      await foodPlanService.deleteFoodPlan(currentFoodPlan._id);
      toast.success("Plan de alimento eliminado exitosamente.");
      setIsConfirmDeleteOpen(false);
      fetchFoodPlans(); // Recargar la lista
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error al eliminar plan de alimento:", apiError);
      setError(
        apiError.response?.data?.message ||
          "Error al eliminar plan de alimento."
      );
      toast.error(
        apiError.response?.data?.message ||
          "Error al eliminar plan de alimento."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsLoading(true);
      const params: FoodPlanQueryParams = {};
      if (searchQuery) {
        params.search = searchQuery;
      }
      const data = await foodPlanService.exportFoodPlansToExcel(params);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "planes_alimentos.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Planes de alimentos exportados a Excel exitosamente.");
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error al exportar a Excel:", apiError);
      toast.error(
        apiError.response?.data?.message ||
          "Error al exportar planes de alimentos a Excel."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsLoading(true);
      const params: FoodPlanQueryParams = {};
      if (searchQuery) {
        params.search = searchQuery;
      }
      const data = await foodPlanService.exportFoodPlansToWord(params);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "planes_alimentos.docx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Planes de alimentos exportados a Word exitosamente.");
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error al exportar a Word:", apiError);
      toast.error(
        apiError.response?.data?.message ||
          "Error al exportar planes de alimentos a Word."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Gestión de Planes de Alimentos
      </h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Buscar por nombre o centro médico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <Button onClick={handleSearch}>Buscar</Button>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExportExcel} disabled={isLoading}>
            <DownloadIcon className="mr-2 h-4 w-4" /> Exportar Excel
          </Button>
          <Button onClick={handleExportWord} disabled={isLoading}>
            <FileTextIcon className="mr-2 h-4 w-4" /> Exportar Word
          </Button>
          {isAdmin && (
            <Button onClick={openCreateDialog}>Crear Plan de Alimento</Button>
          )}
        </div>
      </div>

      <div className="rounded-md border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="w-[180px]">Nombre</TableHead>
              <TableHead className="w-[180px]">Centro Médico</TableHead>
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead className="w-[120px]">Fecha Inicio</TableHead>
              <TableHead className="w-[120px]">Fecha Fin</TableHead>
              <TableHead className="w-[100px]">Estado</TableHead>
              <TableHead className="w-[100px] text-right">
                Cant. Plan.
              </TableHead>
              <TableHead className="w-[100px] text-right">Cant. Real</TableHead>
              <TableHead className="w-[100px] text-right">
                % Completado
              </TableHead>
              <TableHead className="w-[150px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Cargando planes de alimentos...
                </TableCell>
              </TableRow>
            ) : foodPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  No se encontraron planes de alimentos.
                </TableCell>
              </TableRow>
            ) : (
              foodPlans.map((plan) => (
                <TableRow key={plan._id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    {typeof plan.medicalCenter === "string"
                      ? plan.medicalCenter // Should not happen if populated
                      : plan.medicalCenter?.name || "N/A"}
                  </TableCell>
                  <TableCell>{plan.type}</TableCell>
                  <TableCell>
                    {format(parseISO(plan.startDate as string), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(plan.endDate as string), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{plan.status}</TableCell>
                  <TableCell className="text-right">
                    {plan.totalPlannedQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {plan.realQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {plan.percentageCompleted}%
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(plan)}
                          className="mr-2"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(plan)}
                        >
                          Eliminar
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              isActive={currentPage > 1}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                onClick={() => handlePageChange(i + 1)}
                isActive={currentPage === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              isActive={currentPage < totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Dialog open={isUpsertDialogOpen} onOpenChange={setIsUpsertDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentFoodPlan ? "Editar" : "Crear"} Plan de Alimento
            </DialogTitle>
            <DialogDescription>
              {currentFoodPlan
                ? "Modifica los detalles del plan de alimento."
                : "Añade un nuevo plan de alimento a la base de datos."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpsertSubmit} className="grid gap-4 py-4">
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
              <Label htmlFor="medicalCenter" className="text-right">
                Centro Médico
              </Label>
              <Select
                value={formValues.medicalCenter}
                onValueChange={(value) =>
                  setFormValues((prev) => ({ ...prev, medicalCenter: value }))
                }
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un centro médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicalCenters.map((center) => (
                    <SelectItem key={center._id} value={center._id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo de Plan
              </Label>
              <Select
                value={formValues.type}
                onValueChange={(value) =>
                  setFormValues((prev) => ({
                    ...prev,
                    type: value as "weekly" | "monthly" | "annual",
                  }))
                }
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Fecha Inicio
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formValues.startDate}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Fecha Fin
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formValues.endDate}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            {/* Nuevo campo para el estado */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
              <Select
                value={formValues.status}
                onValueChange={(value) =>
                  setFormValues((prev) => ({
                    ...prev,
                    status: value as "active" | "concluded",
                  }))
                }
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="concluded">Concluido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <h3 className="text-lg font-semibold mt-4 col-span-4">
              Alimentos Planificados
            </h3>
            {formValues.plannedFoods.map((pf, index) => (
              <div
                key={index}
                className="grid grid-cols-10 items-center gap-2 border p-3 rounded-md relative"
              >
                <div className="col-span-4">
                  <Label htmlFor={`food-${index}`} className="sr-only">
                    Alimento
                  </Label>
                  <Select
                    value={pf.food}
                    onValueChange={(value) =>
                      handlePlannedFoodChange(index, "food", value)
                    }
                    required
                  >
                    <SelectTrigger id={`food-${index}`}>
                      <SelectValue placeholder="Selecciona alimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {foods.map((food) => (
                        <SelectItem key={food._id} value={food._id}>
                          {food.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Label htmlFor={`provider-${index}`} className="sr-only">
                    Proveedor
                  </Label>
                  <Select
                    value={pf.provider}
                    onValueChange={(value) =>
                      handlePlannedFoodChange(index, "provider", value)
                    }
                    required
                  >
                    <SelectTrigger id={`provider-${index}`}>
                      <SelectValue placeholder="Selecciona proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider._id} value={provider._id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor={`quantity-${index}`} className="sr-only">
                    Cantidad
                  </Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    value={pf.quantity}
                    onChange={(e) =>
                      handlePlannedFoodChange(index, "quantity", e.target.value)
                    }
                    min="0"
                    required
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePlannedFood(index)}
                  >
                    <XIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              onClick={addPlannedFood}
              className="mt-2 w-full"
              variant="outline"
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Añadir Alimento Planificado
            </Button>

            <DialogFooter className="mt-6">
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
              el plan de alimento "{currentFoodPlan?.name}" de la base de datos.
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

export default FoodPlansPage;
