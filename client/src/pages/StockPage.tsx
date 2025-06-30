// client/src/pages/StockPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { IStock, StockFormValues, StockQueryParams } from "../types/stock";
import type { IMedicalCenter } from "../types/medicalCenter"; // Asumiendo este tipo existe
import type { IFood } from "../types/food"; // Asumiendo este tipo existe
import stockService from "../api/services/stockService";
import medicalCenterService from "../api/services/medicalCenterService"; // Asumiendo este servicio existe
import foodService from "../api/services/food"; // Asumiendo este servicio existe
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
  DownloadIcon,
  FileTextIcon,
  PencilIcon,
  Trash2Icon,
  PlusIcon,
} from "lucide-react";
import { useUser } from "@/stores/auth"; // Asegúrate de que esta importación sea correcta
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid"; // Importa la función uuidv4

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const StockPage: React.FC = () => {
  const user = useUser();
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [medicalCenters, setMedicalCenters] = useState<IMedicalCenter[]>([]);
  const [foods, setFoods] = useState<IFood[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] =
    useState<boolean>(false);
  const [currentStock, setCurrentStock] = useState<IStock | null>(null);
  const [formValues, setFormValues] = useState<StockFormValues>({
    medicalCenter: "",
    food: "",
    quantity: 0,
  });

  const fetchStocks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: StockQueryParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
      };
      const response = await stockService.getStocks(params);
      setStocks(response.data);
      setTotalItems(response.totalItems);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      toast.error("Error al cargar el stock.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery]);

  const fetchMedicalCenters = useCallback(async () => {
    try {
      const response = await medicalCenterService.getMedicalCenters({
        limit: 1000,
      });
      setMedicalCenters(response.data);
    } catch (error) {
      console.error("Error fetching medical centers:", error);
      toast.error("Error al cargar los centros médicos.");
    }
  }, []);

  const fetchFoods = useCallback(async () => {
    try {
      const response = await foodService.getFoods({ limit: 1000 });
      setFoods(response.data);
    } catch (error) {
      console.error("Error fetching foods:", error);
      toast.error("Error al cargar los alimentos.");
    }
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  useEffect(() => {
    if (isDialogOpen) {
      fetchMedicalCenters();
      fetchFoods();
    }
  }, [isDialogOpen, fetchMedicalCenters, fetchFoods]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleEditClick = (stock: IStock) => {
    setCurrentStock(stock);
    setFormValues({
      medicalCenter: (stock.medicalCenter as IMedicalCenter)._id,
      food: (stock.food as IFood)._id,
      quantity: stock.quantity,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (stock: IStock) => {
    setCurrentStock(stock);
    setIsConfirmDeleteOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  const handleAddClick = () => {
    setCurrentStock(null); // Reset currentStock for new entry
    setFormValues({
      medicalCenter: "",
      food: "",
      quantity: 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (currentStock) {
        // Al actualizar un registro existente de stock
        await stockService.updateStock(currentStock._id, {
          medicalCenter: (currentStock.medicalCenter as IMedicalCenter)._id,
          food: (currentStock.food as IFood)._id,
          quantity: formValues.quantity,
        });
        toast.success("Stock actualizado exitosamente.");
      } else {
        // Para añadir un nuevo registro de stock utilizando updateStock
        // Generamos un ID único temporal que el backend debería reconocer
        // como una señal para crear un nuevo registro si no lo encuentra.
        // ¡Importante!: La lógica del backend debe estar preparada para esto.
        const newTempId = uuidv4();
        await stockService.updateStock(newTempId, formValues);
        toast.success("Stock añadido exitosamente.");
      }
      setIsDialogOpen(false);
      await fetchStocks();
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError.response?.data?.message || "Error al guardar el stock.";
      console.error("Error saving stock:", error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    try {
      if (currentStock) {
        await stockService.deleteStock(currentStock._id);
        toast.success("Stock eliminado exitosamente.");
      }
      setIsConfirmDeleteOpen(false);
      await fetchStocks();
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError.response?.data?.message || "Error al eliminar el stock.";
      console.error("Error deleting stock:", error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type: "excel" | "word") => {
    setIsLoading(true);
    try {
      let blob: Blob;
      const params: StockQueryParams = {
        search: searchQuery,
      };

      if (type === "excel") {
        blob = await stockService.exportStocksToExcel(params);
      } else {
        blob = await stockService.exportStocksToWord(params);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stocks.${type === "excel" ? "xlsx" : "docx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Stock exportado a ${type.toUpperCase()} exitosamente.`);
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError.response?.data?.message ||
        `Error al exportar stock a ${type.toUpperCase()}.`;
      console.error(`Error exporting to ${type}:`, error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getMedicalCenterName = (stock: IStock | null) => {
    if (!stock || typeof stock.medicalCenter !== "object") return "N/A";
    return stock.medicalCenter.name;
  };

  const getFoodName = (stock: IStock | null) => {
    if (!stock || typeof stock.food !== "object") return "N/A";
    return stock.food.name;
  };

  const isPreviousDisabled = currentPage <= 1 || isLoading;
  const isNextDisabled = currentPage >= totalPages || isLoading;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gestión de Stock</h1>

      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Buscar por centro médico o alimento..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        {/* Total de registros mostrado aquí */}
        <p className="text-sm text-muted-foreground">
          Total de registros: {totalItems}
        </p>
        <div className="flex space-x-2">
          {user?.role === "admin" && (
            <Button onClick={handleAddClick} disabled={isLoading}>
              <PlusIcon className="mr-2 h-4 w-4" /> Añadir Stock
            </Button>
          )}
          <Button onClick={() => handleExport("excel")} disabled={isLoading}>
            <DownloadIcon className="mr-2 h-4 w-4" /> Exportar a Excel
          </Button>
          <Button onClick={() => handleExport("word")} disabled={isLoading}>
            <FileTextIcon className="mr-2 h-4 w-4" /> Exportar a Word
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Centro Médico</TableHead>
              <TableHead>Alimento</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Última Actualización</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Cargando stock...
                </TableCell>
              </TableRow>
            ) : stocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No se encontraron registros de stock.
                </TableCell>
              </TableRow>
            ) : (
              stocks.map((stock) => (
                <TableRow key={stock._id}>
                  <TableCell>{getMedicalCenterName(stock)}</TableCell>
                  <TableCell>{getFoodName(stock)}</TableCell>
                  <TableCell>{stock.quantity}</TableCell>
                  <TableCell>
                    {new Date(stock.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user?.role === "admin" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(stock)}
                          disabled={isLoading}
                          className="mr-2"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(stock)}
                          disabled={isLoading}
                        >
                          <Trash2Icon className="h-4 w-4" />
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

      <div className="flex justify-between items-center mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={
                  isPreviousDisabled
                    ? undefined
                    : () => handlePageChange(currentPage - 1)
                }
                aria-disabled={isPreviousDisabled}
                className={
                  isPreviousDisabled ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  onClick={
                    isLoading ? undefined : () => handlePageChange(index + 1)
                  }
                  isActive={currentPage === index + 1}
                  aria-disabled={isLoading}
                  className={isLoading ? "pointer-events-none opacity-50" : ""}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={
                  isNextDisabled
                    ? undefined
                    : () => handlePageChange(currentPage + 1)
                }
                aria-disabled={isNextDisabled}
                className={
                  isNextDisabled ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <div className="flex items-center space-x-2">
          <Label htmlFor="items-per-page">Ítems por página:</Label>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
            disabled={isLoading}
          >
            <SelectTrigger id="items-per-page" className="w-[80px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentStock ? "Editar Stock" : "Añadir Nuevo Stock"}
            </DialogTitle>
            <DialogDescription>
              {currentStock
                ? "Realiza cambios en la cantidad de stock."
                : "Añade un nuevo registro de stock."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="medicalCenter" className="text-right">
                  Centro Médico
                </Label>
                {currentStock ? (
                  <Input
                    id="medicalCenter"
                    name="medicalCenter"
                    value={getMedicalCenterName(currentStock)}
                    disabled
                    className="col-span-3"
                  />
                ) : (
                  <Select
                    name="medicalCenter"
                    value={formValues.medicalCenter}
                    onValueChange={(value) =>
                      handleFormChange({
                        target: { name: "medicalCenter", value },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger className="col-span-3">
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
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="food" className="text-right">
                  Alimento
                </Label>
                {currentStock ? (
                  <Input
                    id="food"
                    name="food"
                    value={getFoodName(currentStock)}
                    disabled
                    className="col-span-3"
                  />
                ) : (
                  <Select
                    name="food"
                    value={formValues.food}
                    onValueChange={(value) =>
                      handleFormChange({
                        target: { name: "food", value },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un alimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {foods.map((food) => (
                        <SelectItem key={food._id} value={food._id}>
                          {food.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Cantidad
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formValues.quantity}
                  onChange={handleFormChange}
                  className="col-span-3"
                  min="0"
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
              el registro de stock para "{getFoodName(currentStock as IStock)}"
              en "{getMedicalCenterName(currentStock as IStock)}" de la base de
              datos.
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

export default StockPage;
