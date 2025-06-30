// client/src/api/services/stockService.ts

import api from "@/lib/axios"; // Asume que 'api' es tu instancia de Axios configurada
import type { IStock } from "@/types/stock"; // Importamos la interfaz del tipo de frontend
import type {
  StockFormValues,
  StockQueryParams,
  StockListResponse,
} from "@/types/stock"; // Importamos las interfaces específicas para el servicio

const StockService = {
  /**
   * Obtiene una lista paginada de registros de stock.
   * @param params Parámetros de consulta para paginación, búsqueda, filtrado por centro médico o alimento.
   * @returns Promesa que resuelve con la respuesta paginada de stock.
   */
  getStocks: async (params: StockQueryParams): Promise<StockListResponse> => {
    const response = await api.get("/stocks", { params });
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
    const response = await api.get(`/stocks/${id}`);
    return response.data;
  },

  // No hay un 'createStock' directo aquí porque el stock se maneja
  // principalmente a través de entradas y salidas de alimentos.
  // Si fuera necesario un endpoint para ajustar manualmente, se podría añadir.

  /**
   * Actualiza un registro de stock existente por su ID.
   * Aunque el stock se actualiza principalmente por FoodEntry/FoodConsumption,
   * este método permite ajustes directos si el backend lo permite.
   * @param id El ID del registro de stock a actualizar.
   * @param stockData Los datos actualizados del registro de stock (e.g., cantidad).
   * @returns Promesa que resuelve con el objeto del registro de stock actualizado.
   */
  updateStock: async (
    id: string,
    stockData: StockFormValues
  ): Promise<IStock> => {
    const response = await api.put(`/stocks/${id}`, stockData);
    return response.data;
  },

  /**
   * Elimina un registro de stock por su ID.
   * Esto debería usarse con precaución, ya que eliminar un stock no significa
   * que los alimentos desaparecen del centro, solo que el registro de stock se borra.
   * @param id El ID del registro de stock a eliminar.
   * @returns Promesa que resuelve cuando el registro de stock ha sido eliminado.
   */
  deleteStock: async (id: string): Promise<void> => {
    await api.delete(`/stocks/${id}`);
  },

  /**
   * Exporta registros de stock a un archivo Excel.
   * @param params Parámetros de consulta para filtrar los datos a exportar.
   * @returns Promesa que resuelve con un Blob que contiene el archivo Excel.
   */
  exportStocksToExcel: async (params: StockQueryParams): Promise<Blob> => {
    const response = await api.get("/stocks/export/excel", {
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
    const response = await api.get("/stocks/export/word", {
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },
};

export default StockService;
