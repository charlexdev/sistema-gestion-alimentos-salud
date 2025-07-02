// client/src/pages/FoodEntriesPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  IFoodEntry,
  FoodEntryFormValues,
  FoodEntryQueryParams,
  IEnteredFood, // Import IEnteredFood type
} from "../types/foodEntry";
import type { IMedicalCenter } from "../types/medicalCenter";
import type { IProvider } from "../types/provider";
import type { IFood } from "../types/food";
import type { IFoodPlan } from "../types/foodPlan";
import foodEntryService from "../api/services/foodEntryService";
import medicalCenterService from "../api/services/medicalCenterService";
import providerService from "../api/services/provider";
import foodService from "../api/services/food";
import foodPlanService from "../api/services/foodPlanService";

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
// Removed Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useForm, useFieldArray, zodResolver, z
import { format, parseISO } from "date-fns"; // Import parseISO
import {
  Calendar as CalendarIcon,
  PlusIcon,
  XIcon, // Changed Trash2 to XIcon for consistency with FoodPlansPage
  DownloadIcon,
  FileTextIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// === IMPORTACIÓN: useUser hook desde auth store ===
import { useUser } from "@/stores/auth";

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const FoodEntriesPage: React.FC = () => {
  const [foodEntries, setFoodEntries] = useState<IFoodEntry[]>([]);
  const [medicalCenters, setMedicalCenters] = useState<IMedicalCenter[]>([]);
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [foods, setFoods] = useState<IFood[]>([]);
  const [foodPlans, setFoodPlans] = useState<IFoodPlan[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] =
    useState<boolean>(false);
  const [currentFoodEntry, setCurrentFoodEntry] = useState<IFoodEntry | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Nuevas variables de estado para los filtros
  const [filterMedicalCenterId, setFilterMedicalCenterId] =
    useState<string>("all"); // Default to "all"
  const [filterProviderId, setFilterProviderId] = useState<string>("all"); // Default to "all"
  const [filterFoodPlanId, setFilterFoodPlanId] = useState<string>("all"); // Default to "all"
  const [filterFoodId, setFilterFoodId] = useState<string>("all"); // Default to "all"

  // State for the form values, mirroring FoodPlansPage's formValues
  const [formValues, setFormValues] = useState<FoodEntryFormValues>({
    medicalCenter: "",
    provider: "",
    foodPlan: "",
    entryDate: format(new Date(), "yyyy-MM-dd"),
    enteredFoods: [{ food: "", quantity: 0 }],
  });

  // === OBTENER EL USUARIO Y SU ROL DESDE EL HOOK useUser ===
  const user = useUser();
  const isAdmin = user?.role === "admin";

  const fetchFoodEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FoodEntryQueryParams = {
        page: currentPage,
        limit: 10,
      };

      // Apply filters, adjusted for "all"
      if (filterMedicalCenterId !== "all") {
        params.medicalCenterId = filterMedicalCenterId;
      }
      if (filterProviderId !== "all") {
        params.providerId = filterProviderId;
      }
      if (filterFoodPlanId !== "all") {
        params.foodPlanId = filterFoodPlanId;
      }
      if (filterFoodId !== "all") {
        params.foodId = filterFoodId;
      }

      const response = await foodEntryService.getFoodEntries(params);
      setFoodEntries(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
    } catch (error) {
      console.error("Error fetching food entries:", error);
      toast.error("Error al cargar las entradas de alimentos.");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    filterMedicalCenterId,
    filterProviderId,
    filterFoodPlanId,
    filterFoodId,
  ]);

  const fetchDependencies = useCallback(async () => {
    try {
      const [medicalCentersRes, providersRes, foodsRes, foodPlansRes] =
        await Promise.all([
          medicalCenterService.getMedicalCenters({ limit: 1000 }),
          providerService.getProviders({ limit: 1000 }),
          foodService.getFoods({ limit: 1000 }),
          foodPlanService.getFoodPlans({ limit: 1000 }),
        ]);
      setMedicalCenters(medicalCentersRes.data);
      setProviders(providersRes.data);
      setFoods(foodsRes.data);
      setFoodPlans(foodPlansRes.data);
    } catch (error) {
      console.error("Error fetching dependencies:", error);
      toast.error("Error al cargar datos adicionales.");
    }
  }, []);

  useEffect(() => {
    fetchFoodEntries();
  }, [fetchFoodEntries]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleMedicalCenterFilterChange = (value: string) => {
    setFilterMedicalCenterId(value);
    setCurrentPage(1);
  };

  const handleProviderFilterChange = (value: string) => {
    setFilterProviderId(value);
    setCurrentPage(1);
  };

  const handleFoodPlanFilterChange = (value: string) => {
    setFilterFoodPlanId(value);
    setCurrentPage(1);
  };

  const handleFoodFilterChange = (value: string) => {
    setFilterFoodId(value);
    setCurrentPage(1);
  };

  const handleCreateClick = () => {
    setCurrentFoodEntry(null);
    setFormValues({
      medicalCenter: "",
      provider: "",
      foodPlan: "",
      entryDate: format(new Date(), "yyyy-MM-dd"),
      enteredFoods: [{ food: "", quantity: 0 }],
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (entry: IFoodEntry) => {
    setCurrentFoodEntry(entry);
    setFormValues({
      medicalCenter:
        typeof entry.medicalCenter === "object"
          ? entry.medicalCenter._id
          : entry.medicalCenter,
      provider:
        typeof entry.provider === "object"
          ? entry.provider._id
          : entry.provider,
      foodPlan:
        typeof entry.foodPlan === "object"
          ? entry.foodPlan._id
          : entry.foodPlan,
      entryDate: format(new Date(entry.entryDate), "yyyy-MM-dd"),
      enteredFoods: entry.enteredFoods.map((item) => ({
        food: typeof item.food === "object" ? item.food._id : item.food,
        quantity: item.quantity,
      })),
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (entry: IFoodEntry) => {
    setCurrentFoodEntry(entry);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentFoodEntry) return;
    setIsLoading(true);
    try {
      await foodEntryService.deleteFoodEntry(currentFoodEntry._id);
      toast.success("Entrada de alimento eliminada exitosamente.");
      setIsConfirmDeleteOpen(false);

      const updatedTotalItems = totalItems - 1;

      if (
        foodEntries.length === 1 &&
        currentPage > 1 &&
        updatedTotalItems > 0
      ) {
        setCurrentPage(currentPage - 1);
      } else if (updatedTotalItems === 0) {
        setCurrentPage(1);
      } else {
        fetchFoodEntries();
      }
    } catch (error) {
      console.error("Error deleting food entry:", error);
      const apiError = error as ApiError;
      toast.error(
        apiError.response?.data?.message ||
          "Error al eliminar la entrada de alimento."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // New handlers for enteredFoods array management
  const handleEnteredFoodChange = (
    index: number,
    field: keyof IEnteredFood,
    value: string | number
  ) => {
    setFormValues((prev) => {
      const updatedEnteredFoods = [...prev.enteredFoods];
      if (field === "quantity") {
        updatedEnteredFoods[index] = {
          ...updatedEnteredFoods[index],
          [field]: Number(value), // Ensure quantity is a number
        };
      } else if (field === "food") {
        // Explicitly handle 'food' field
        updatedEnteredFoods[index] = {
          ...updatedEnteredFoods[index],
          [field]: String(value), // Ensure food is a string
        };
      }
      return { ...prev, enteredFoods: updatedEnteredFoods };
    });
  };

  const addEnteredFood = () => {
    setFormValues((prev) => ({
      ...prev,
      enteredFoods: [...prev.enteredFoods, { food: "", quantity: 0 }],
    }));
  };

  const removeEnteredFood = (index: number) => {
    setFormValues((prev) => {
      const updatedEnteredFoods = [...prev.enteredFoods];
      updatedEnteredFoods.splice(index, 1);
      return { ...prev, enteredFoods: updatedEnteredFoods };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic form validations
      if (
        !formValues.medicalCenter ||
        !formValues.provider ||
        !formValues.foodPlan ||
        !formValues.entryDate
      ) {
        toast.error("Por favor, complete todos los campos obligatorios.");
        setIsLoading(false);
        return;
      }

      // Validate enteredFoods
      if (formValues.enteredFoods.length === 0) {
        toast.error("Debe añadir al menos un alimento ingresado.");
        setIsLoading(false);
        return;
      }

      for (const ef of formValues.enteredFoods) {
        if (!ef.food || ef.quantity <= 0) {
          toast.error(
            "Todos los alimentos ingresados deben tener un alimento y una cantidad válida (mayor que cero)."
          );
          setIsLoading(false);
          return;
        }
        if (ef.quantity < 0.01 || ef.quantity > 10000000000) {
          toast.error(
            `La cantidad para el alimento debe estar entre 0.01 y 10,000,000,000.`
          );
          setIsLoading(false);
          return;
        }
      }

      const dataToSend: FoodEntryFormValues = {
        ...formValues,
        entryDate: new Date(formValues.entryDate).toISOString(), // Ensure ISO string format
      };

      if (currentFoodEntry) {
        await foodEntryService.updateFoodEntry(
          currentFoodEntry._id,
          dataToSend
        );
        toast.success("Entrada de alimento actualizada exitosamente.");
      } else {
        await foodEntryService.createFoodEntry(dataToSend);
        toast.success("Entrada de alimento creada exitosamente.");
      }
      fetchFoodEntries();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving food entry:", error);
      const apiError = error as ApiError;
      toast.error(
        apiError.response?.data?.message ||
          "Error al guardar la entrada de alimento."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsLoading(true);
      const params: FoodEntryQueryParams = {
        page: 1,
        limit: totalItems > 0 ? totalItems : 10000,
      };
      if (filterMedicalCenterId !== "all") {
        params.medicalCenterId = filterMedicalCenterId;
      }
      if (filterProviderId !== "all") {
        params.providerId = filterProviderId;
      }
      if (filterFoodPlanId !== "all") {
        params.foodPlanId = filterFoodPlanId;
      }
      if (filterFoodId !== "all") {
        params.foodId = filterFoodId;
      }
      const data = await foodEntryService.exportFoodEntriesToExcel(params);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `entradas_alimentos_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Entradas de alimentos exportadas a Excel exitosamente.");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      const apiError = error as ApiError;
      toast.error(
        apiError.response?.data?.message || "Error al exportar a Excel."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsLoading(true);
      const params: FoodEntryQueryParams = {
        page: 1,
        limit: totalItems > 0 ? totalItems : 10000,
      };
      if (filterMedicalCenterId !== "all") {
        params.medicalCenterId = filterMedicalCenterId;
      }
      if (filterProviderId !== "all") {
        params.providerId = filterProviderId;
      }
      if (filterFoodPlanId !== "all") {
        params.foodPlanId = filterFoodPlanId;
      }
      if (filterFoodId !== "all") {
        params.foodId = filterFoodId;
      }
      const data = await foodEntryService.exportFoodEntriesToWord(params);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `entradas_alimentos_${Date.now()}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Entradas de alimentos exportadas a Word exitosamente.");
    } catch (error) {
      console.error("Error al exportar a Word:", error);
      const apiError = error as ApiError;
      toast.error(
        apiError.response?.data?.message || "Error al exportar a Word."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-3xl font-bold tracking-tight mb-8">
        Entradas de Alimentos
      </h2>

      {/* Contenedor de botones de acción y reportes, alineados a la derecha */}
      <div className="flex items-center justify-end space-x-2 mb-6">
        {/* BOTÓN "AGREGAR ENTRADA DE ALIMENTO" - Visible solo para administradores */}
        {isAdmin && (
          <Button onClick={handleCreateClick}>
            Agregar Entrada de Alimento
          </Button>
        )}
        <Button
          variant="excel"
          onClick={handleExportExcel}
          disabled={isLoading}
        >
          <DownloadIcon className="mr-2 h-4 w-4" /> Excel
        </Button>
        <Button variant="word" onClick={handleExportWord} disabled={isLoading}>
          <FileTextIcon className="mr-2 h-4 w-4" /> Word
        </Button>
      </div>

      {/* Contenedor de filtros, en una nueva línea, alineados a la izquierda */}
      <div className="flex items-center justify-start space-x-2 mb-6">
        <Select
          onValueChange={handleMedicalCenterFilterChange}
          value={filterMedicalCenterId}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Centro Médico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Centros Médicos</SelectItem>
            {medicalCenters.map((mc) => (
              <SelectItem key={mc._id} value={mc._id}>
                {mc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={handleProviderFilterChange}
          value={filterProviderId}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Proveedores</SelectItem>
            {providers.map((provider) => (
              <SelectItem key={provider._id} value={provider._id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={handleFoodPlanFilterChange}
          value={filterFoodPlanId}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Plan de Alimentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Planes</SelectItem>
            {foodPlans.map((plan) => (
              <SelectItem key={plan._id} value={plan._id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={handleFoodFilterChange} value={filterFoodId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Alimentos</SelectItem>
            {foods.map((food) => (
              <SelectItem key={food._id} value={food._id}>
                {food.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mb-2 text-sm text-yellow-600">
        Total de entradas de alimentos: {totalItems}
      </p>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha de Entrada</TableHead>
              <TableHead>Centro Médico</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Plan de Alimentos</TableHead>
              <TableHead>Alimentos Ingresados</TableHead>
              {/* COLUMNA DE ACCIONES - Visible solo para administradores */}
              {isAdmin && (
                <TableHead className="text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : foodEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center">
                  No hay entradas de alimentos.
                </TableCell>
              </TableRow>
            ) : (
              foodEntries.map((entry) => (
                <TableRow key={entry._id}>
                  <TableCell>
                    {new Date(entry.entryDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {typeof entry.medicalCenter === "object"
                      ? entry.medicalCenter.name
                      : medicalCenters.find(
                          (mc) => mc._id === entry.medicalCenter
                        )?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    {typeof entry.provider === "object"
                      ? entry.provider.name
                      : providers.find((p) => p._id === entry.provider)?.name ||
                        "N/A"}
                  </TableCell>
                  <TableCell>
                    {typeof entry.foodPlan === "object"
                      ? entry.foodPlan.name
                      : foodPlans.find((fp) => fp._id === entry.foodPlan)
                          ?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    {entry.enteredFoods.length > 0 ? (
                      <ul className="list-disc list-inside text-sm">
                        {entry.enteredFoods.map((enteredFood, index) => (
                          <li key={index}>
                            {typeof enteredFood.food === "object"
                              ? enteredFood.food.name
                              : foods.find((f) => f._id === enteredFood.food)
                                  ?.name || "N/A"}
                            : {enteredFood.quantity}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "Ninguno"
                    )}
                  </TableCell>
                  {/* BOTONES DE EDITAR Y ELIMINAR EN CADA FILA - Visibles solo para administradores */}
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleEditClick(entry)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(entry)}
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
      {isAdmin && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentFoodEntry
                  ? "Editar Entrada de Alimento"
                  : "Crear Entrada de Alimento"}
              </DialogTitle>
              <DialogDescription>
                {currentFoodEntry
                  ? "Modifica los detalles de la entrada de alimento."
                  : "Añade una nueva entrada de alimento aquí."}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-[auto_1fr] items-center gap-4 py-4"
            >
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
                  {medicalCenters.map((mc) => (
                    <SelectItem key={mc._id} value={mc._id}>
                      {mc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label htmlFor="provider" className="text-right">
                Proveedor
              </Label>
              <Select
                value={formValues.provider}
                onValueChange={(value) =>
                  setFormValues((prev) => ({ ...prev, provider: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider._id} value={provider._id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label htmlFor="foodPlan" className="text-right">
                Plan de Alimentos
              </Label>
              <Select
                value={formValues.foodPlan}
                onValueChange={(value) =>
                  setFormValues((prev) => ({ ...prev, foodPlan: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan de alimentos" />
                </SelectTrigger>
                <SelectContent>
                  {foodPlans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label htmlFor="entryDate" className="text-right">
                Fecha de Entrada
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formValues.entryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formValues.entryDate ? (
                      format(parseISO(formValues.entryDate), "PPP")
                    ) : (
                      <span>Selecciona una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formValues.entryDate
                        ? parseISO(formValues.entryDate)
                        : undefined
                    }
                    onSelect={(date) =>
                      setFormValues((prev) => ({
                        ...prev,
                        entryDate: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <h3 className="text-lg font-semibold mt-4 col-span-2">
                Alimentos Ingresados
              </h3>
              {formValues.enteredFoods.map((ef, index) => (
                <div
                  key={index}
                  className="grid grid-cols-10 items-center gap-4 border p-3 rounded-md relative col-span-2"
                >
                  <div className="col-span-6">
                    <Label htmlFor={`food-${index}`} className="sr-only">
                      Alimento
                    </Label>
                    <Select
                      value={ef.food}
                      onValueChange={(value) =>
                        handleEnteredFoodChange(index, "food", value)
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
                  <div className="col-span-2">
                    <Label htmlFor={`quantity-${index}`} className="sr-only">
                      Cantidad
                    </Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      value={ef.quantity}
                      onChange={(e) =>
                        handleEnteredFoodChange(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      min="0.01"
                      step="any"
                      required
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEnteredFood(index)}
                    >
                      <XIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                onClick={addEnteredFood}
                className="mt-2 w-full col-span-2"
                variant="outline"
              >
                <PlusIcon className="mr-2 h-4 w-4" /> Añadir Alimento Ingresado
              </Button>

              <DialogFooter className="mt-6 col-span-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {isAdmin && (
        <Dialog
          open={isConfirmDeleteOpen}
          onOpenChange={setIsConfirmDeleteOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente
                la entrada de alimento de la base de datos.
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
      )}
    </div>
  );
};

export default FoodEntriesPage;
