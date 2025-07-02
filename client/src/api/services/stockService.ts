// client/src/api/services/stockService.ts

import api from "@/lib/axios"; // Asume que 'api' es tu instancia de Axios configurada
import type { IStock } from "@/types/stock";
import type {
  StockFormValues,
  StockQueryParams,
  StockListResponse,
} from "@/types/stock";

const StockService = {
  /**
   * Obtiene una lista paginada de registros de stock.
   * @param params Parámetros de consulta para paginación, búsqueda, filtrado por centro médico o alimento.
   * @returns Promesa que resuelve con la respuesta paginada de stock.
   */
  getStocks: async (params: StockQueryParams): Promise<StockListResponse> => {
    // La baseURL en axios.ts ya es 'http://localhost:5000/api',
    // por lo tanto, aquí solo necesitamos la parte '/stock'
    const response = await api.get("/stock", { params }); // <-- ¡CORREGIDO a /stock (singular)!
    return response.data;
  },

  /**
   * Obtiene un registro de stock por su ID.
   * Nota: El stock no tiene una operación `create` directa ya que se actualiza mediante `FoodEntry` y `FoodConsumption`.
   * La operación `updateStock` en el backend maneja la creación si no existe.
   * @param id El ID del registro de stock.
   * @returns Promesa que resuelve con el objeto del registro de stock.
   */
  getStockById: async (id: string): Promise<IStock> => {
    // La baseURL en axios.ts ya es 'http://localhost:5000/api'
    const response = await api.get(`/stock/${id}`); // <-- ¡CORREGIDO a /stock (singular)!
    return response.data;
  },

  /**
   * Crea o actualiza un registro de stock.
   * En el backend, esto se maneja con PUT y se basa en si el ID existe o no.
   * @param id El ID del registro de stock a actualizar/crear.
   * @param stockData Los datos del stock (medicalCenter, food, quantity).
   * @returns Promesa que resuelve con el objeto del stock actualizado o creado.
   */
  updateStock: async (
    id: string,
    stockData: StockFormValues
  ): Promise<IStock> => {
    // La baseURL en axios.ts ya es 'http://localhost:5000/api'
    const response = await api.put(`/stock/${id}`, stockData); // <-- ¡CORREGIDO a /stock (singular)!
    return response.data;
  },

  /**
   * Elimina un registro de stock por su ID.
   * Esto debería usarse con precaución, ya que eliminar un stock no significa
   * que los alimentos desaparecen del centro, solo que el registro de stock se borra.
   * @param id El ID del registro de stock a eliminar.
   * @returns Promesa que resuelve cuando el registro de stock ha sido eliminada.
   */
  deleteStock: async (id: string): Promise<void> => {
    // La baseURL en axios.ts ya es 'http://localhost:5000/api'
    await api.delete(`/stock/${id}`); // <-- ¡CORREGIDO a /stock (singular)!
  },

  /**
   * Exporta registros de stock a un archivo Excel.
   * @param params Parámetros de consulta para filtrar los datos a exportar.
   * @returns Promesa que resuelve con un Blob que contiene el archivo Excel.
   */
  exportStocksToExcel: async (params: StockQueryParams): Promise<Blob> => {
    // La baseURL en axios.ts ya es 'http://localhost:5000/api'
    const response = await api.get("/stock/export/excel", {
      // <-- ¡CORREGIDO a /stock (singular)!
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },

  /**
   * Exporta registros de stock a un archivo Word.
   * @param params Parámetros de consulta para filtrar los datos a exportar.
   * @returns Promesa que resuelve con un Blob que contiene el archivo Word.
   */
  exportStocksToWord: async (params: StockQueryParams): Promise<Blob> => {
    // La baseURL en axios.ts ya es 'http://localhost:5000/api'
    const response = await api.get("/stock/export/word", {
      // <-- ¡CORREGIDO a /stock (singular)!
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },
};

export default StockService;
