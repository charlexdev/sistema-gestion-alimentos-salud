// client/src/pages/FoodEntriesPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  IFoodEntry,
  FoodEntryFormValues,
  FoodEntryQueryParams,
  // IEnteredFood, // No es necesario importarla directamente si solo se usa dentro de IFoodEntry o FoodEntryFormValues
} from "../types/foodEntry";
import type { IMedicalCenter } from "../types/medicalCenter"; // Assuming this type exists
import type { IProvider } from "../types/provider"; // Assuming this type exists
import type { IFood } from "../types/food"; // Assuming this type exists
import type { IFoodPlan } from "../types/foodPlan"; // Assuming this type exists
import foodEntryService from "../api/services/foodEntryService";
// Assuming these services exist based on related files (FoodPlansPage.tsx, FoodsPage.tsx)
import medicalCenterService from "../api/services/medicalCenterService"; // Assuming this service exists
import providerService from "../api/services/provider"; // Assuming this service exists
import foodService from "../api/services/food"; // Assuming this service exists
import foodPlanService from "../api/services/foodPlanService"; // Assuming this service exists

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
import {
  Form, // <-- Asegúrate de que este componente sea importado y usado
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form"; // Controller no es necesario importarlo directamente si usas FormField
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PlusIcon, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Esquema de validación para FoodEntryFormValues con Zod
const enteredFoodSchema = z.object({
  food: z.string().min(1, "El alimento es requerido."),
  quantity: z
    .number()
    .min(0.01, "La cantidad debe ser mayor que cero.")
    .max(10000000000, "La cantidad es demasiado grande."),
});

const formSchema = z.object({
  medicalCenter: z.string().min(1, "El centro médico es requerido."),
  provider: z.string().min(1, "El proveedor es requerido."),
  foodPlan: z.string().min(1, "El plan de alimentos es requerido."),
  entryDate: z.string().min(1, "La fecha de entrada es requerida."),
  enteredFoods: z
    .array(enteredFoodSchema)
    .min(1, "Debe añadir al menos un alimento."),
});

type FormData = z.infer<typeof formSchema>;

// === DEFINICIÓN LOCAL DE TIPO PARA ERRORES DE AXIOS CON RESPUESTA ===
interface ApiError {
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
  const [searchQuery, setSearchQuery] = useState<string>("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicalCenter: "",
      provider: "",
      foodPlan: "",
      entryDate: format(new Date(), "yyyy-MM-dd"), // Valor por defecto
      enteredFoods: [{ food: "", quantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "enteredFoods",
  });

  const fetchFoodEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FoodEntryQueryParams = {
        page: currentPage,
        limit: 10,
        search: searchQuery,
      };
      const response = await foodEntryService.getFoodEntries(params);
      setFoodEntries(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching food entries:", error);
      toast.error("Error al cargar las entradas de alimentos.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery]);

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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleCreateClick = () => {
    setCurrentFoodEntry(null);
    form.reset({
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
    form.reset({
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
      fetchFoodEntries();
      setIsConfirmDeleteOpen(false);
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

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    try {
      const foodEntryData: FoodEntryFormValues = {
        ...values,
        enteredFoods: values.enteredFoods.map((item) => ({
          food: item.food,
          quantity: item.quantity,
        })),
        // entryDate is already in "yyyy-MM-dd" format from the Calendar/date-fns
      };

      if (currentFoodEntry) {
        await foodEntryService.updateFoodEntry(
          currentFoodEntry._id,
          foodEntryData
        );
        toast.success("Entrada de alimento actualizada exitosamente.");
      } else {
        await foodEntryService.createFoodEntry(foodEntryData);
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

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">
        Gestión de Entradas de Alimentos
      </h1>

      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Buscar entradas de alimentos..."
          value={searchQuery}
          onChange={handleSearch}
          className="max-w-sm"
        />
        <Button onClick={handleCreateClick}>Crear Entrada de Alimento</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha de Entrada</TableHead>
              <TableHead>Centro Médico</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Plan de Alimentos</TableHead>
              <TableHead>Alimentos Ingresados</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : foodEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
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
                      : entry.medicalCenter}
                  </TableCell>
                  <TableCell>
                    {typeof entry.provider === "object"
                      ? entry.provider.name
                      : entry.provider}
                  </TableCell>
                  <TableCell>
                    {typeof entry.foodPlan === "object"
                      ? entry.foodPlan.name
                      : entry.foodPlan}
                  </TableCell>
                  <TableCell>
                    <ul>
                      {entry.enteredFoods.map((enteredFood, index) => (
                        <li key={index}>
                          {typeof enteredFood.food === "object"
                            ? enteredFood.food.name
                            : enteredFood.food}
                          : {enteredFood.quantity}
                        </li>
                      ))}
                    </ul>
                  </TableCell>
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
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, index) => (
            <PaginationItem key={index}>
              <PaginationLink
                href="#"
                isActive={currentPage === index + 1}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
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
          {/* Aquí se utiliza el componente Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="medicalCenter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro Médico</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un centro médico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {medicalCenters.map((mc) => (
                          <SelectItem key={mc._id} value={mc._id}>
                            {mc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider._id} value={provider._id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foodPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan de Alimentos</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un plan de alimentos" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {foodPlans.map((plan) => (
                          <SelectItem key={plan._id} value={plan._id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Entrada</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => {
                            field.onChange(
                              date ? format(date, "yyyy-MM-dd") : ""
                            );
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="text-lg font-semibold block mb-2">
                  Alimentos Ingresados
                </Label>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-6 gap-4 mb-4 items-end"
                  >
                    {/* Campo de Alimento */}
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`enteredFoods.${index}.food`}
                        render={({ field: itemField }) => (
                          <FormItem className="mb-0">
                            <FormLabel
                              className={index === 0 ? "block" : "sr-only"}
                            >
                              Alimento
                            </FormLabel>
                            <Select
                              onValueChange={itemField.onChange}
                              value={itemField.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un alimento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {foods.map((food) => (
                                  <SelectItem key={food._id} value={food._id}>
                                    {food.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Campo de Cantidad */}
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`enteredFoods.${index}.quantity`}
                        render={({ field: itemField }) => (
                          <FormItem className="mb-0">
                            <FormLabel
                              className={index === 0 ? "block" : "sr-only"}
                            >
                              Cantidad
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Cantidad"
                                {...itemField} // Usa {...itemField} directamente
                                onChange={(e) => {
                                  // Asegúrate de parsear a número para react-hook-form
                                  itemField.onChange(
                                    parseFloat(e.target.value)
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Botón de Eliminar Alimento */}
                    <div className="col-span-1 flex items-center justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ food: "", quantity: 0 })}
                  className="mt-2"
                >
                  <PlusIcon className="mr-2 h-4 w-4" /> Añadir Alimento
                </Button>
                {form.formState.errors.enteredFoods && (
                  // Muestra el mensaje de error del array si existe
                  <p className="text-red-500 text-sm mt-2">
                    {form.formState.errors.enteredFoods.message}
                  </p>
                )}
              </div>

              <DialogFooter className="mt-6">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>{" "}
          {/* Cierre del componente Form */}
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
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
    </div>
  );
};

export default FoodEntriesPage;
