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
import { format, parseISO, addWeeks, addMonths, addYears } from "date-fns"; // Importar funciones de date-fns
import {
  DownloadIcon,
  FileTextIcon,
  PlusIcon,
  XIcon,
  CalendarIcon,
} from "lucide-react"; // Import CalendarIcon
import { useUser } from "@/stores/auth";

// Shadcn UI imports for calendar
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils"; // Import cn utility

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
  const [totalItems, setTotalItems] = useState<number>(0); // Added for consistency
  const [searchQuery, setSearchQuery] = useState<string>("");

  // --- MODIFICACIÓN: VALOR POR DEFECTO A "all" EN LUGAR DE "" ---
  const [selectedMedicalCenter, setSelectedMedicalCenter] =
    useState<string>("all");
  const [selectedType, setSelectedType] = useState<
    "weekly" | "monthly" | "annual" | "all"
  >("all");
  const [selectedStatus, setSelectedStatus] = useState<
    "active" | "concluded" | "all"
  >("all");
  // ---------------------------------------------------------------

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
    status: "active",
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
      // --- APLICAR FILTROS (MODIFICADO PARA "all") ---
      if (selectedMedicalCenter !== "all") {
        params.medicalCenterId = selectedMedicalCenter;
      }
      if (selectedType !== "all") {
        params.type = selectedType;
      }
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }
      // ------------------------------------------------

      const response = await foodPlanService.getFoodPlans(params);
      setFoodPlans(response.data);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
      setTotalItems(response.totalItems); // Set totalItems
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
  }, [
    currentPage,
    limit,
    searchQuery,
    selectedMedicalCenter, // Dependencia de filtro
    selectedType, // Dependencia de filtro
    selectedStatus, // Dependencia de filtro
  ]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  // Use a separate useEffect for fetching food plans based on dependencies
  useEffect(() => {
    fetchFoodPlans();
  }, [
    fetchFoodPlans,
    currentPage,
    searchQuery,
    selectedMedicalCenter,
    selectedType,
    selectedStatus,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset a la primera página en cada nueva búsqueda o filtro
    // fetchFoodPlans will be called by the useEffect when searchQuery, selectedMedicalCenter, etc. change
  };

  // --- HANDLERS PARA LOS NUEVOS FILTROS (MODIFICADOS PARA "all") ---
  const handleMedicalCenterFilterChange = (value: string) => {
    setSelectedMedicalCenter(value);
    setCurrentPage(1); // Reset page when filter changes
  };

  const handleTypeFilterChange = (
    value: "weekly" | "monthly" | "annual" | "all"
  ) => {
    setSelectedType(value);
    setCurrentPage(1); // Reset page when filter changes
  };

  const handleStatusFilterChange = (value: "active" | "concluded" | "all") => {
    setSelectedStatus(value);
    setCurrentPage(1); // Reset page when filter changes
  };
  // -----------------------------------------------------------------

  const openCreateDialog = () => {
    setCurrentFoodPlan(null);
    setFormValues({
      name: "",
      medicalCenter: "",
      type: "weekly",
      startDate: "",
      endDate: "",
      plannedFoods: [],
      status: "active",
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
          : plan.medicalCenter?._id || "", // Ensure it's always a string
      type: plan.type,
      startDate: format(parseISO(plan.startDate as string), "yyyy-MM-dd"), // Asegura formato ISO para input date
      endDate: format(parseISO(plan.endDate as string), "yyyy-MM-dd"), // Asegura formato ISO para input date
      plannedFoods: plan.plannedFoods.map((pf) => ({
        food: typeof pf.food === "string" ? pf.food : pf.food._id,
        provider:
          typeof pf.provider === "string" ? pf.provider : pf.provider._id,
        quantity: pf.quantity,
      })),
      status: plan.status,
    });
    setIsUpsertDialogOpen(true);
  };

  // Función auxiliar para calcular la fecha de fin
  const calculateEndDate = (
    startDate: string,
    type: "weekly" | "monthly" | "annual"
  ): string => {
    if (!startDate) return "";
    const start = parseISO(startDate);
    let endDate: Date;

    switch (type) {
      case "weekly":
        endDate = addWeeks(start, 1);
        break;
      case "monthly":
        endDate = addMonths(start, 1);
        break;
      case "annual":
        endDate = addYears(start, 1);
        break;
      default:
        return "";
    }
    return format(endDate, "yyyy-MM-dd");
  };

  // Keep handleFormChange for non-date inputs
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  // Modificación adicional para la selección de tipo de plan
  const handleTypeChange = (value: "weekly" | "monthly" | "annual") => {
    setFormValues((prev) => {
      const updatedValues = { ...prev, type: value };
      if (prev.startDate) {
        updatedValues.endDate = calculateEndDate(prev.startDate, value);
      }
      return updatedValues;
    });
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
          [field]: Number(value), // Convertir a número explícitamente
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
        !formValues.status
      ) {
        toast.error("Por favor, complete todos los campos obligatorios.");
        setIsLoading(false);
        return;
      }

      // Validar longitud del nombre
      if (formValues.name.length < 6 || formValues.name.length > 40) {
        toast.error(
          "El nombre del plan de alimento debe tener entre 6 y 40 caracteres."
        );
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
        // Validar cantidad de alimentos planificados
        if (pf.quantity < 1 || pf.quantity > 10000000000) {
          toast.error(
            `La cantidad para el alimento debe estar entre 1 y 10,000,000,000.`
          );
          setIsLoading(false);
          return;
        }
      }

      // Convertir fechas a objetos Date y luego a ISO string
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

      const updatedTotalItems = totalItems - 1;

      if (foodPlans.length === 1 && currentPage > 1 && updatedTotalItems > 0) {
        setCurrentPage(currentPage - 1);
      } else if (updatedTotalItems === 0) {
        setCurrentPage(1);
      } else {
        fetchFoodPlans();
      }
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
      const params: FoodPlanQueryParams = {
        page: 1, // Export all pages
        limit: totalItems > 0 ? totalItems : 10000, // Fetch all if totalItems is known, else a large number
      };
      if (searchQuery) {
        params.search = searchQuery;
      }
      // --- APLICAR FILTROS (MODIFICADO PARA "all") ---
      if (selectedMedicalCenter !== "all") {
        params.medicalCenterId = selectedMedicalCenter;
      }
      if (selectedType !== "all") {
        params.type = selectedType;
      }
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }
      // ------------------------------------------------

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
      const params: FoodPlanQueryParams = {
        page: 1, // Export all pages
        limit: totalItems > 0 ? totalItems : 10000, // Fetch all if totalItems is known, else a large number
      };
      if (searchQuery) {
        params.search = searchQuery;
      }
      // --- APLICAR FILTROS (MODIFICADO PARA "all") ---
      if (selectedMedicalCenter !== "all") {
        params.medicalCenterId = selectedMedicalCenter;
      }
      if (selectedType !== "all") {
        params.type = selectedType;
      }
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }
      // ------------------------------------------------

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
    <div className="container mx-auto py-10">
      <h2 className="text-3xl font-bold tracking-tight mb-8">
        Gestión de Planes de Alimentos
      </h2>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex items-center justify-between mb-6">
        <Input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <div className="flex space-x-2">
          {isAdmin && (
            <Button onClick={openCreateDialog}>Crear Plan de Alimento</Button>
          )}
          <Button
            variant="excel"
            onClick={handleExportExcel}
            disabled={isLoading}
          >
            <DownloadIcon className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button
            variant="word"
            onClick={handleExportWord}
            disabled={isLoading}
          >
            <FileTextIcon className="mr-2 h-4 w-4" /> Word
          </Button>
        </div>
      </div>

      {/* --- SELECTORES DE FILTRO (MODIFICADOS) --- */}
      <div className="flex items-center space-x-4 mb-6">
        <Select
          value={selectedMedicalCenter}
          onValueChange={handleMedicalCenterFilterChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Centro Médico" />
          </SelectTrigger>
          <SelectContent>
            {/* CAMBIO AQUI: value="all" en lugar de value="" */}
            <SelectItem value="all">Todos los Centros</SelectItem>
            {medicalCenters.map((center) => (
              <SelectItem key={center._id} value={center._id}>
                {center.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={handleTypeFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Tipo de Plan" />
          </SelectTrigger>
          <SelectContent>
            {/* CAMBIO AQUI: value="all" en lugar de value="" */}
            <SelectItem value="all">Todos los Tipos</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="annual">Anual</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Estado" />
          </SelectTrigger>
          <SelectContent>
            {/* CAMBIO AQUI: value="all" en lugar de value="" */}
            <SelectItem value="all">Todos los Estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="concluded">Concluido</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* ------------------------------------------- */}

      <p className="mb-2 text-sm text-yellow-600">
        Total de planes de alimentos: {totalItems}
      </p>

      <div className="rounded-md border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            {/* Fix hydration error: Ensure no whitespace between TableRow and its first TableHead */}
            <TableRow>
              <TableHead className="w-[180px]">Nombre</TableHead>
              <TableHead className="w-[180px]">Centro Médico</TableHead>
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead className="w-[120px]">Fecha Inicio</TableHead>
              <TableHead className="w-[120px]">Fecha Fin</TableHead>
              {/* Nuevo: Columna para Alimentos Planificados */}
              <TableHead className="w-[250px]">
                Alimentos Planificados
              </TableHead>
              <TableHead className="w-[100px]">Estado</TableHead>
              <TableHead className="w-[100px] text-right">
                Cant. Plan.
              </TableHead>
              <TableHead className="w-[100px] text-right">Cant. Real</TableHead>
              <TableHead className="w-[100px] text-right">
                % Completado
              </TableHead>
              {isAdmin && ( // Only show actions column if admin
                <TableHead className="w-[150px] text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 11 : 10} /* Adjusted colspan */
                  className="text-center py-8"
                >
                  Cargando planes de alimentos...
                </TableCell>
              </TableRow>
            ) : foodPlans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 11 : 10} /* Adjusted colspan */
                  className="text-center py-8"
                >
                  No se encontraron planes de alimentos.
                </TableCell>
              </TableRow>
            ) : (
              foodPlans.map((plan) => (
                // Fix hydration error: Ensure no whitespace between TableRow and its first TableCell
                <TableRow key={plan._id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    {typeof plan.medicalCenter === "string"
                      ? medicalCenters.find(
                          (mc) => mc._id === plan.medicalCenter
                        )?.name || "N/A"
                      : plan.medicalCenter?.name || "N/A"}
                  </TableCell>
                  {/* Modificación para mostrar el tipo de plan en español */}
                  <TableCell>
                    {plan.type === "weekly"
                      ? "Semanal"
                      : plan.type === "monthly"
                      ? "Mensual"
                      : plan.type === "annual"
                      ? "Anual"
                      : plan.type}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(plan.startDate as string), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(plan.endDate as string), "dd/MM/yyyy")}
                  </TableCell>
                  {/* Nuevo: Celda para Alimentos Planificados */}
                  <TableCell>
                    {plan.plannedFoods.length > 0 ? (
                      <ul className="list-disc list-inside text-sm">
                        {plan.plannedFoods.map((pf, pfIndex) => (
                          <li key={pfIndex}>
                            {typeof pf.food === "string"
                              ? foods.find((f) => f._id === pf.food)?.name ||
                                "N/A"
                              : pf.food?.name || "N/A"}{" "}
                            ({pf.quantity})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "Ninguno"
                    )}
                  </TableCell>
                  {/* Modificación para mostrar el estado en español */}
                  <TableCell>
                    {plan.status === "active"
                      ? "Activo"
                      : plan.status === "concluded"
                      ? "Concluido"
                      : plan.status}
                  </TableCell>
                  <TableCell className="text-right">
                    {plan.totalPlannedQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {plan.realQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {plan.percentageCompleted}%
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
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
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : undefined
              }
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
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Dialog open={isUpsertDialogOpen} onOpenChange={setIsUpsertDialogOpen}>
        {/* CAMBIO AQUI: Aumentado el sm:max-w para dar más espacio horizontal */}
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
          <form
            onSubmit={handleUpsertSubmit}
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
              <SelectTrigger>
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
            <Label htmlFor="type" className="text-right">
              Tipo de Plan
            </Label>
            <Select
              value={formValues.type}
              onValueChange={handleTypeChange} // Usar la nueva función aquí
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="annual">Anual</SelectItem>
              </SelectContent>
            </Select>

            {/* Shadcn UI Calendar for Start Date */}
            <Label htmlFor="startDate" className="text-right">
              Fecha Inicio
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formValues.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formValues.startDate ? (
                    format(parseISO(formValues.startDate), "PPP")
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    formValues.startDate
                      ? parseISO(formValues.startDate)
                      : undefined
                  }
                  onSelect={(date) => {
                    setFormValues((prev) => {
                      const updatedValues = {
                        ...prev,
                        startDate: date ? format(date, "yyyy-MM-dd") : "",
                      };
                      // Recalculate endDate if startDate or type changes
                      if (date && prev.type) {
                        updatedValues.endDate = calculateEndDate(
                          format(date, "yyyy-MM-dd"),
                          prev.type
                        );
                      }
                      return updatedValues;
                    });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Shadcn UI Calendar for End Date */}
            <Label htmlFor="endDate" className="text-right">
              Fecha Fin
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formValues.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formValues.endDate ? (
                    format(parseISO(formValues.endDate), "PPP")
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    formValues.endDate
                      ? parseISO(formValues.endDate)
                      : undefined
                  }
                  onSelect={(date) =>
                    setFormValues((prev) => ({
                      ...prev,
                      endDate: date ? format(date, "yyyy-MM-dd") : "",
                    }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

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
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="concluded">Concluido</SelectItem>
              </SelectContent>
            </Select>

            <h3 className="text-lg font-semibold mt-4 col-span-2">
              Alimentos Planificados
            </h3>
            {formValues.plannedFoods.map((pf, index) => (
              <div
                key={index}
                // Ajuste de columnas para dar más espacio a la cantidad
                className="grid grid-cols-12 items-center gap-4 border p-3 rounded-md relative col-span-2"
              >
                <div className="col-span-4">
                  {" "}
                  {/* Reducido de 5 a 4 */}
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
                  {" "}
                  {/* Reducido de 5 a 4 */}
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
                <div className="col-span-2">
                  {" "}
                  {/* Aumentado de 1 a 2 para más espacio */}
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
                <div className="col-span-2 flex justify-end">
                  {" "}
                  {/* Ajustado de 1 a 2 para sumar 12 columnas en total */}
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
              className="mt-2 w-full col-span-2"
              variant="outline"
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Añadir Alimento Planificado
            </Button>

            <DialogFooter className="mt-6 col-span-2">
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
