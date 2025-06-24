// client/src/pages/PlansPage.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  IPlan,
  PlanFormValues,
  PlanQueryParams,
  PlanType,
} from "../types/plan";
import type { IMedicalCenter } from "../types/medicalCenter";
import type { IFood } from "../types/food";
import type { IProvider } from "../types/provider";

import planService from "../api/services/plan";
import medicalCenterService from "../api/services/medical-center";
import foodService from "../api/services/food";
import providerService from "../api/services/provider";

import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  PlusCircle,
  Trash2,
  DownloadIcon,
  FileTextIcon,
} from "lucide-react"; // Añadidos DownloadIcon y FileTextIcon
import { cn } from "@/lib/classname";

// === DEFINICIÓN LOCAL DE TIPO PARA ERRORES DE AXIOS CON RESPUESTA ===
interface ApiError {
  message: string;
}

interface AxiosErrorWithResponse<T = ApiError> extends Error {
  response?: {
    data: T;
    status: number;
    headers?: Record<string, string>;
  };
  isAxiosError: boolean;
}

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [medicalCenters, setMedicalCenters] = useState<IMedicalCenter[]>([]);
  const [foods, setFoods] = useState<IFood[]>([]);
  const [providers, setProviders] = useState<IProvider[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<IPlan | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [search, setSearch] = useState("");
  const [filterMedicalCenterId, setFilterMedicalCenterId] = useState<
    string | ""
  >("");
  const [filterPlanType, setFilterPlanType] = useState<PlanType | "">("");
  const [filterAggregateBy, setFilterAggregateBy] = useState<
    "none" | "monthly" | "annual"
  >("none");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const initialFormValues: PlanFormValues = {
    name: "",
    startDate: format(new Date(), "yyyy-MM-dd", { locale: es }),
    endDate: format(new Date(), "yyyy-MM-dd", { locale: es }),
    medicalCenterId: "",
    planType: "weekly",
    foodItems: [{ foodId: "", quantity: 0, providerId: "" }],
  };
  const [formValues, setFormValues] =
    useState<PlanFormValues>(initialFormValues);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const actualParams: PlanQueryParams = {
        page: currentPage,
        limit,
        search,
      };

      if (filterMedicalCenterId) {
        actualParams.medicalCenterId = filterMedicalCenterId;
      }

      if (filterPlanType) {
        actualParams.planType = filterPlanType;
      }

      if (filterAggregateBy !== "none" && filterDate) {
        actualParams.aggregateBy = filterAggregateBy;

        let startOfRange: Date = new Date();
        let endOfRange: Date = new Date();

        if (filterAggregateBy === "monthly") {
          startOfRange = new Date(
            filterDate.getFullYear(),
            filterDate.getMonth(),
            1
          );
          endOfRange = new Date(
            filterDate.getFullYear(),
            filterDate.getMonth() + 1,
            0
          );
        } else if (filterAggregateBy === "annual") {
          startOfRange = new Date(filterDate.getFullYear(), 0, 1);
          endOfRange = new Date(filterDate.getFullYear(), 11, 31);
        }
        actualParams.startDate = startOfRange.toISOString();
        actualParams.endDate = endOfRange.toISOString();
      }

      const response = await planService.getPlans(actualParams);
      setPlans(response.plans);
      setTotalItems(response.totalCount);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error al obtener planes:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message || "Error al cargar los planes."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    search,
    limit,
    filterMedicalCenterId,
    filterPlanType,
    filterAggregateBy,
    filterDate,
  ]);

  const fetchMasterData = useCallback(async () => {
    try {
      const medicalCentersResponse =
        await medicalCenterService.getMedicalCenters({
          page: 1,
          limit: 100,
        });
      setMedicalCenters(medicalCentersResponse.medicalCenters);

      const foodsResponse = await foodService.getFoods({
        page: 1,
        limit: 100,
      });
      setFoods(foodsResponse.data);

      const providersResponse = await providerService.getProviders({
        page: 1,
        limit: 100,
      });
      setProviders(providersResponse.data);
    } catch (error) {
      console.error("Error al cargar datos maestros:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message ||
          "Error al cargar datos necesarios para el formulario."
      );
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (isModalOpen) {
      fetchMasterData();
    }
  }, [isModalOpen, fetchMasterData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleMedicalCenterFilterChange = (value: string) => {
    setFilterMedicalCenterId(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handlePlanTypeFilterChange = (value: PlanType | "") => {
    setFilterPlanType(value);
    setCurrentPage(1);
  };

  const handleAggregateByChange = (value: "none" | "monthly" | "annual") => {
    setFilterAggregateBy(value);
    if (value === "none") {
      setFilterDate(undefined);
    }
    setCurrentPage(1);
  };

  const handleDateFilterChange = (date: Date | undefined) => {
    setFilterDate(date);
    setCurrentPage(1);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFoodItemChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newFoodItems = [...formValues.foodItems];
    newFoodItems[index] = { ...newFoodItems[index], [field]: value };
    setFormValues((prev) => ({ ...prev, foodItems: newFoodItems }));
  };

  const handleAddFoodItem = () => {
    setFormValues((prev) => ({
      ...prev,
      foodItems: [
        ...prev.foodItems,
        { foodId: "", quantity: 0, providerId: "" },
      ],
    }));
  };

  const handleRemoveFoodItem = (index: number) => {
    setFormValues((prev) => ({
      ...prev,
      foodItems: prev.foodItems.filter((_, i) => i !== index),
    }));
  };

  const handleOpenModal = (plan?: IPlan) => {
    if (plan) {
      setCurrentPlan(plan);
      setFormValues({
        name: plan.name,
        startDate: plan.startDate
          ? format(parseISO(plan.startDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd", { locale: es }),
        endDate: plan.endDate
          ? format(parseISO(plan.endDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd", { locale: es }),
        medicalCenterId:
          // Asegúrate de que medicalCenter no sea null/undefined antes de acceder a _id
          plan.medicalCenter
            ? typeof plan.medicalCenter === "string"
              ? plan.medicalCenter
              : plan.medicalCenter?._id || ""
            : "",
        planType: plan.planType,
        foodItems: plan.foodItems.map((item) => ({
          foodId:
            typeof item.food === "string" ? item.food : item.food?._id || "",
          quantity: item.quantity,
          providerId:
            typeof item.provider === "string"
              ? item.provider
              : item.provider?._id || "",
        })),
      });
    } else {
      setCurrentPlan(null);
      setFormValues(initialFormValues);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPlan(null);
    setFormValues(initialFormValues);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (currentPlan) {
        await planService.updatePlan(currentPlan._id, formValues);
        toast.success("Plan actualizado exitosamente.");
      } else {
        await planService.createPlan(formValues);
        toast.success("Plan creado exitosamente.");
      }
      handleCloseModal();
      fetchPlans();
    } catch (error) {
      console.error("Error al guardar plan:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message || "Error al guardar el plan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = (plan: IPlan) => {
    setCurrentPlan(plan);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentPlan) return;
    setIsLoading(true);
    try {
      await planService.deletePlan(currentPlan._id);
      toast.success("Plan eliminado exitosamente.");
      setIsConfirmDeleteOpen(false);
      fetchPlans();
    } catch (error) {
      console.error("Error al eliminar plan:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message || "Error al eliminar el plan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- Funciones de Exportación ---
  const generateExportQueryParams = useCallback((): PlanQueryParams => {
    const params: PlanQueryParams = {
      search,
    };

    if (filterMedicalCenterId) {
      params.medicalCenterId = filterMedicalCenterId;
    }
    if (filterPlanType) {
      params.planType = filterPlanType;
    }

    if (filterAggregateBy !== "none" && filterDate) {
      params.aggregateBy = filterAggregateBy;
      let startOfRange: Date = new Date();
      let endOfRange: Date = new Date();

      if (filterAggregateBy === "monthly") {
        startOfRange = new Date(
          filterDate.getFullYear(),
          filterDate.getMonth(),
          1
        );
        endOfRange = new Date(
          filterDate.getFullYear(),
          filterDate.getMonth() + 1,
          0
        );
      } else if (filterAggregateBy === "annual") {
        startOfRange = new Date(filterDate.getFullYear(), 0, 1);
        endOfRange = new Date(filterDate.getFullYear(), 11, 31);
      }
      params.startDate = startOfRange.toISOString();
      params.endDate = endOfRange.toISOString();
    }
    return params;
  }, [
    search,
    filterMedicalCenterId,
    filterPlanType,
    filterAggregateBy,
    filterDate,
  ]);

  const handleExportToExcel = async () => {
    setIsLoading(true);
    try {
      const params = generateExportQueryParams();
      const blob = await planService.exportPlansToExcel(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "planes.xlsx"; // Nombre del archivo
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Planes exportados a Excel exitosamente.");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message || "Error al exportar a Excel."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToWord = async () => {
    setIsLoading(true);
    try {
      const params = generateExportQueryParams();
      const blob = await planService.exportPlansToWord(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "planes.docx"; // Nombre del archivo
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Planes exportados a Word exitosamente.");
    } catch (error) {
      console.error("Error al exportar a Word:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message || "Error al exportar a Word."
      );
    } finally {
      setIsLoading(false);
    }
  };
  // --- Fin Funciones de Exportación ---

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Gestión de Planes
      </h1>

      {/* Controles de Filtro y Búsqueda */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {" "}
        {/* Ajuste a 5 columnas para pantallas grandes */}
        <Input
          placeholder="Buscar por nombre de plan..."
          value={search}
          onChange={handleSearchChange}
          className="col-span-full md:col-span-2 lg:col-span-2 xl:col-span-1"
        />
        {/* Filtro por Centro Médico */}
        <Select
          value={filterMedicalCenterId}
          onValueChange={handleMedicalCenterFilterChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por centro médico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Centros Médicos</SelectItem>
            {medicalCenters.map((center) => (
              <SelectItem key={center._id} value={center._id}>
                {center.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Filtro por Tipo de Plan */}
        <Select
          value={filterPlanType}
          onValueChange={handlePlanTypeFilterChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por tipo de plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Tipos</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="annual">Anual</SelectItem>
          </SelectContent>
        </Select>
        {/* Filtro de Agregación */}
        <Select
          value={filterAggregateBy}
          onValueChange={handleAggregateByChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Agrupar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin agrupación</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="annual">Anual</SelectItem>
          </SelectContent>
        </Select>
        {/* Selector de Fecha para Agregación */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !filterDate && "text-muted-foreground",
                filterAggregateBy === "none" && "pointer-events-none opacity-50"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filterDate ? (
                format(filterDate, "PPP", { locale: es })
              ) : (
                <span>Seleccionar fecha para agrupación</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filterDate}
              onSelect={handleDateFilterChange}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
        {/* Botones de acción (Crear y Exportar) */}
        <Button
          onClick={() => handleOpenModal()}
          className="w-full col-span-full md:col-span-2 lg:col-span-1"
        >
          Crear Nuevo Plan
        </Button>
        <Button
          onClick={handleExportToExcel}
          variant="outline"
          className="w-full col-span-full md:col-span-1 lg:col-span-1"
          disabled={isLoading}
        >
          <DownloadIcon className="mr-2 h-4 w-4" /> Exportar a Excel
        </Button>
        <Button
          onClick={handleExportToWord}
          variant="outline"
          className="w-full col-span-full md:col-span-1 lg:col-span-1"
          disabled={isLoading}
        >
          <FileTextIcon className="mr-2 h-4 w-4" /> Exportar a Word
        </Button>
      </div>

      {/* Indicador de total de planes */}
      <div className="mb-4 text-gray-600">
        {isLoading ? (
          <span>Cargando total de planes...</span>
        ) : (
          <span>Total de planes: {totalItems}</span>
        )}
      </div>

      {/* Tabla de Planes */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Plan</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Fin</TableHead>
              <TableHead>Centro Médico</TableHead>
              <TableHead>Tipo de Plan</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Cargando planes...
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No se encontraron planes.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan._id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    {plan.startDate
                      ? format(parseISO(plan.startDate), "PP", { locale: es })
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {plan.endDate
                      ? format(parseISO(plan.endDate), "PP", { locale: es })
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {/* CORRECCIÓN: Comprobar si plan.medicalCenter existe antes de acceder a .name */}
                    {plan.medicalCenter
                      ? typeof plan.medicalCenter === "string"
                        ? plan.medicalCenter
                        : plan.medicalCenter.name
                      : "N/A"}
                  </TableCell>
                  <TableCell>{plan.planType}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(plan)}
                      className="mr-2"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePlan(plan)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={
                currentPage === 1
                  ? undefined
                  : () => handlePageChange(Math.max(1, currentPage - 1))
              }
              className={cn(
                currentPage === 1 && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, index) => (
            <PaginationItem key={index}>
              <PaginationLink
                onClick={() => handlePageChange(index + 1)}
                isActive={currentPage === index + 1}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={
                currentPage === totalPages
                  ? undefined
                  : () =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              className={cn(
                currentPage === totalPages && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Modal de Creación/Edición */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentPlan ? "Editar Plan" : "Crear Nuevo Plan"}
            </DialogTitle>
            <DialogDescription>
              {currentPlan
                ? "Modifica los detalles del plan existente."
                : "Crea un nuevo plan de alimentos."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePlan} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre del Plan
              </Label>
              <Input
                id="name"
                name="name"
                value={formValues.name}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="medicalCenterId" className="text-right">
                Centro Médico
              </Label>
              <Select
                name="medicalCenterId"
                value={formValues.medicalCenterId}
                onValueChange={(value) =>
                  handleSelectChange("medicalCenterId", value)
                }
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
              <Label htmlFor="planType" className="text-right">
                Tipo de Plan
              </Label>
              <Select
                name="planType"
                value={formValues.planType}
                onValueChange={(value: PlanType) =>
                  handleSelectChange("planType", value)
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona tipo de plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fechas de Inicio y Fin del Plan */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Fecha de Inicio
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formValues.startDate}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Fecha de Fin
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formValues.endDate}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>

            {/* Ítems de Alimento del Plan */}
            <div className="col-span-full border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Ítems de Alimento</h3>
              {formValues.foodItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-6 items-center gap-4 mb-4 p-3 border rounded-md"
                >
                  {/* Selector de Alimento */}
                  <Label
                    htmlFor={`foodId-${index}`}
                    className="md:col-span-1 text-right"
                  >
                    Alimento
                  </Label>
                  <Select
                    name="foodId"
                    value={item.foodId}
                    onValueChange={(value) =>
                      handleFoodItemChange(index, "foodId", value)
                    }
                  >
                    <SelectTrigger className="md:col-span-2">
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

                  {/* Cantidad */}
                  <Label
                    htmlFor={`quantity-${index}`}
                    className="md:col-span-1 text-right"
                  >
                    Cantidad
                  </Label>
                  <Input
                    id={`quantity-${index}`}
                    name="quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleFoodItemChange(
                        index,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className="md:col-span-1"
                    min="0"
                    required
                  />

                  {/* Selector de Proveedor */}
                  <Label
                    htmlFor={`providerId-${index}`}
                    className="md:col-span-1 text-right"
                  >
                    Proveedor
                  </Label>
                  <Select
                    name="providerId"
                    value={item.providerId}
                    onValueChange={(value) =>
                      handleFoodItemChange(index, "providerId", value)
                    }
                  >
                    <SelectTrigger className="md:col-span-2">
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

                  {/* Botón de Eliminar Ítem */}
                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveFoodItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="col-span-full flex justify-center mt-4">
                <Button
                  type="button"
                  onClick={handleAddFoodItem}
                  variant="outline"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ítem de
                  Alimento
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Plan"}
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
              el plan "{currentPlan?.name}" de la base de datos.
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

export default PlansPage;
