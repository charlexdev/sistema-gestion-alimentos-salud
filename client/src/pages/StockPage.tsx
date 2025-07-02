// client/src/pages/StockPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { IStock, StockQueryParams } from "../types/stock";
import type { IMedicalCenter } from "../types/medicalCenter";
import type { IFood } from "../types/food";
import stockService from "../api/services/stockService";
import medicalCenterService from "../api/services/medicalCenterService";
import foodService from "../api/services/food";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DownloadIcon, FileTextIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const StockPage: React.FC = () => {
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [medicalCenters, setMedicalCenters] = useState<IMedicalCenter[]>([]);
  const [foods, setFoods] = useState<IFood[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Changed initial state to a specific string like "all" or any other non-empty string
  const [selectedMedicalCenter, setSelectedMedicalCenter] =
    useState<string>("all");
  const [selectedFood, setSelectedFood] = useState<string>("all");

  const fetchStocks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: StockQueryParams = {
        page: currentPage,
        limit: itemsPerPage,
        // Only include the filter if it's not "all"
        medicalCenterId:
          selectedMedicalCenter === "all" ? undefined : selectedMedicalCenter,
        foodId: selectedFood === "all" ? undefined : selectedFood,
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
  }, [currentPage, itemsPerPage, selectedMedicalCenter, selectedFood]);

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
    fetchMedicalCenters();
    fetchFoods();
  }, [fetchMedicalCenters, fetchFoods]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleMedicalCenterFilterChange = (value: string) => {
    setSelectedMedicalCenter(value);
    setCurrentPage(1);
  };

  const handleFoodFilterChange = (value: string) => {
    setSelectedFood(value);
    setCurrentPage(1);
  };

  const handleExport = async (type: "excel" | "word") => {
    setIsLoading(true);
    try {
      let blob: Blob;
      const params: StockQueryParams = {
        limit: totalItems > 0 ? totalItems : 10000,
        medicalCenterId:
          selectedMedicalCenter === "all" ? undefined : selectedMedicalCenter,
        foodId: selectedFood === "all" ? undefined : selectedFood,
      };

      if (type === "excel") {
        blob = await stockService.exportStocksToExcel(params);
      } else {
        blob = await stockService.exportStocksToWord(params);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stocks_${Date.now()}.${type === "excel" ? "xlsx" : "docx"}`;
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
    <div className="container mx-auto py-10">
      <h2 className="text-3xl font-bold tracking-tight mb-8">
        Gestión de Existencias
      </h2>

      <div className="flex items-center justify-end mb-6 space-x-2">
        {" "}
        {/* Changed space-x-4 to space-x-2 */}
        {/* Medical Center Filter */}
        <Select
          value={selectedMedicalCenter}
          onValueChange={handleMedicalCenterFilterChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[250px]">
            {" "}
            {/* Changed width here */}
            <SelectValue placeholder="Filtrar por Centro Médico" />
          </SelectTrigger>
          <SelectContent>
            {/* Changed value from "" to "all" */}
            <SelectItem value="all">Todos los Centros Médicos</SelectItem>
            {medicalCenters.map((mc) => (
              <SelectItem key={mc._id} value={mc._id}>
                {mc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Food Filter */}
        <Select
          value={selectedFood}
          onValueChange={handleFoodFilterChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por Alimento" />
          </SelectTrigger>
          <SelectContent>
            {/* Changed value from "" to "all" */}
            <SelectItem value="all">Todos los Alimentos</SelectItem>
            {foods.map((food) => (
              <SelectItem key={food._id} value={food._id}>
                {food.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="excel"
          onClick={() => handleExport("excel")}
          disabled={isLoading}
        >
          <DownloadIcon className="mr-2 h-4 w-4" /> Excel
        </Button>
        <Button
          variant="word"
          onClick={() => handleExport("word")}
          disabled={isLoading}
        >
          <FileTextIcon className="mr-2 h-4 w-4" /> Word
        </Button>
      </div>
      <p className="mb-2 text-sm text-yellow-600">
        Total de registros de existencias: {totalItems}
      </p>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Centro Médico</TableHead>
              <TableHead>Alimento</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Última Actualización</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Cargando stock...
                </TableCell>
              </TableRow>
            ) : stocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No se encontraron registros de stock.
                </TableCell>
              </TableRow>
            ) : (
              stocks.map((stock) => (
                <TableRow key={stock._id}>
                  <TableCell className="font-medium">
                    {getMedicalCenterName(stock)}
                  </TableCell>
                  <TableCell>{getFoodName(stock)}</TableCell>
                  <TableCell>{stock.quantity}</TableCell>
                  <TableCell>
                    {new Date(stock.updatedAt).toLocaleDateString()}
                  </TableCell>
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
              onClick={
                isPreviousDisabled
                  ? undefined
                  : () => handlePageChange(currentPage - 1)
              }
              className={
                isPreviousDisabled
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                onClick={isLoading ? undefined : () => handlePageChange(i + 1)}
                isActive={currentPage === i + 1}
                className={isLoading ? "pointer-events-none opacity-50" : ""}
              >
                {i + 1}
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
              className={
                isNextDisabled ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default StockPage;
