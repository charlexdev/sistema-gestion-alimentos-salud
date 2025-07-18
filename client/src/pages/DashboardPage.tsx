// client/src/pages/DashboardPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveContainer, Legend } from "recharts";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { useFoods } from "@/hooks/useFoods"; // Mantén este si lo usas para otros gráficos
import { useFoodEntries } from "@/hooks/useFoodEntries";
import { useProviders } from "@/hooks/useProviders";
import { useFoodPlans } from "@/hooks/useFoodPlans"; // <--- NUEVA IMPORTACIÓN
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// Define la interfaz para los datos del gráfico de pastel
interface FoodByUnitChartDataItem {
  name: string;
  value: number; // Porcentaje
  count: number; // Cantidad absoluta
  fill: string;
}

// Define la interfaz para los datos del gráfico de barras de proveedores
interface ProviderRankingChartDataItem {
  name: string; // Nombre del proveedor
  entries: number; // Número de entradas
  fill: string;
}

// <--- NUEVA INTERFAZ PARA EL GRÁFICO DE CUMPLIMIENTO DE PLANES
interface PlanCompletionChartDataItem {
  name: string; // Nombre del plan
  percentage: number; // Porcentaje de cumplimiento
  fill: string;
}

// === Definición directa de colores OKLCH ===
const lightThemeChartColors: string[] = [
  "oklch(0.65 0.25 45)", // Naranja
  "oklch(0.6 0.15 180)", // Cian
  "oklch(0.45 0.1 270)", // Púrpura
  "oklch(0.85 0.2 90)", // Verde brillante
  "oklch(0.75 0.2 330)", // Rosa
  "oklch(0.55 0.22 135)", // Verde azulado
  "oklch(0.7 0.18 225)", // Azul claro
  "oklch(0.6 0.2 15)", // Rojo anaranjado
  "oklch(0.8 0.15 250)", // Índigo claro
  "oklch(0.5 0.12 70)", // Amarillo verdoso
];

const darkThemeChartColors: string[] = [
  "oklch(0.7 0.25 45)", // Naranja claro
  "oklch(0.65 0.15 180)", // Cian claro
  "oklch(0.5 0.1 270)", // Púrpura claro
  "oklch(0.9 0.2 90)", // Verde brillante claro
  "oklch(0.8 0.2 330)", // Rosa claro
  "oklch(0.6 0.22 135)", // Verde azulado claro
  "oklch(0.75 0.18 225)", // Azul claro
  "oklch(0.65 0.2 15)", // Rojo anaranjado claro
  "oklch(0.85 0.15 250)", // Índigo muy claro
  "oklch(0.55 0.12 70)", // Amarillo verdoso claro
];
// ===========================================

const DashboardPage: React.FC = () => {
  const {
    data: foods,
    isLoading: isLoadingFoods,
    isError: isErrorFoods,
    error: errorFoods,
  } = useFoods({ page: 1, limit: 9999, search: "" });

  const {
    data: foodEntriesData,
    isLoading: isLoadingFoodEntries,
    isError: isErrorFoodEntries,
    error: errorFoodEntries,
  } = useFoodEntries({ limit: 9999 });

  const {
    data: providersData,
    isLoading: isLoadingProviders,
    isError: isErrorProviders,
    error: errorProviders,
  } = useProviders({ limit: 9999 });

  // <--- USO DEL NUEVO HOOK useFoodPlans
  const {
    data: foodPlansData,
    isLoading: isLoadingFoodPlans,
    isError: isErrorFoodPlans,
    error: errorFoodPlans,
  } = useFoodPlans({ limit: 9999 }); // Puedes ajustar los parámetros según necesites

  const isLoading =
    isLoadingFoods ||
    isLoadingFoodEntries ||
    isLoadingProviders ||
    isLoadingFoodPlans; // <--- AÑADIR NUEVO ESTADO DE CARGA
  const isError =
    isErrorFoods || isErrorFoodEntries || isErrorProviders || isErrorFoodPlans; // <--- AÑADIR NUEVO ESTADO DE ERROR
  const error =
    errorFoods || errorFoodEntries || errorProviders || errorFoodPlans; // <--- AÑADIR NUEVO ERROR

  const [currentChartColors, setCurrentChartColors] = useState<string[]>([]);

  useEffect(() => {
    const updateChartColors = () => {
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark) {
        setCurrentChartColors(darkThemeChartColors);
      } else {
        setCurrentChartColors(lightThemeChartColors);
      }
    };

    // Initial call
    updateChartColors();

    // Observe changes in the 'dark' class on the documentElement
    const observer = new MutationObserver(updateChartColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const foodsByUnitChartData = useMemo(() => {
    if (
      !foods?.data ||
      foods.data.length === 0 ||
      currentChartColors.length === 0
    ) {
      return [];
    }

    const unitCounts: { [key: string]: { count: number; name: string } } = {};
    foods.data.forEach((food) => {
      if (
        typeof food.unitOfMeasurement === "object" &&
        food.unitOfMeasurement.name
      ) {
        const unitName = food.unitOfMeasurement.name;
        unitCounts[unitName] = unitCounts[unitName] || {
          count: 0,
          name: unitName,
        };
        unitCounts[unitName].count++;
      } else {
        const unknownUnitName = "Unidad Desconocida";
        unitCounts[unknownUnitName] = unitCounts[unknownUnitName] || {
          count: 0,
          name: unknownUnitName,
        };
        unitCounts[unknownUnitName].count++;
      }
    });

    const totalFoods = foods.data.length;

    return Object.values(unitCounts).map((entry, index) => ({
      name: entry.name,
      value: (entry.count / totalFoods) * 100,
      count: entry.count,
      fill: currentChartColors[index % currentChartColors.length],
    }));
  }, [foods, currentChartColors]);

  // --- Lógica para el Ranking de Proveedores con datos para el gráfico de barras ---
  const providerRankingChartData = useMemo(() => {
    if (
      !foodEntriesData?.data ||
      !providersData?.data ||
      currentChartColors.length === 0
    ) {
      return [];
    }

    const providerEntryCounts: { [key: string]: number } = {};
    const providerNames: { [key: string]: string } = {};

    // Mapear IDs de proveedor a nombres
    providersData.data.forEach((provider) => {
      providerNames[provider._id] = provider.name;
    });

    // Contar entradas por proveedor
    foodEntriesData.data.forEach((entry) => {
      // 'entry' es de tipo IFoodEntry
      // El proveedor está en el nivel de 'entry', no de 'foodItem'
      const providerId =
        typeof entry.provider === "object"
          ? entry.provider._id
          : entry.provider;
      if (providerId) {
        providerEntryCounts[providerId] =
          (providerEntryCounts[providerId] || 0) + 1;
      }
    });

    // Formatear para la tabla y ordenar
    const ranking = Object.entries(providerEntryCounts)
      .map(([providerId, count]) => ({
        name: providerNames[providerId] || "Proveedor Desconocido", // Usamos 'name' para el eje X
        entries: count, // Usamos 'entries' para el valor de la barra
      }))
      .sort((a, b) => b.entries - a.entries); // Ordenar de mayor a menor

    // Asignar colores a las barras
    return ranking.map((item, index) => ({
      ...item,
      fill: currentChartColors[index % currentChartColors.length],
    }));
  }, [foodEntriesData, providersData, currentChartColors]);

  // <--- CÁLCULO DE DATOS PARA EL GRÁFICO DE CUMPLIMIENTO DE PLANES
  const planCompletionChartData = useMemo(() => {
    if (
      !foodPlansData?.data ||
      foodPlansData.data.length === 0 ||
      currentChartColors.length === 0
    ) {
      return [];
    }

    // Filtra los planes para asegurar que percentageCompleted no sea null/undefined
    const plansWithCompletion = foodPlansData.data.filter(
      (plan) =>
        plan.percentageCompleted !== undefined &&
        plan.percentageCompleted !== null
    );

    // Ordenar los planes por nombre o por porcentaje si lo deseas
    const sortedPlans = plansWithCompletion.sort((a, b) => {
      // Puedes ordenar por porcentaje o por nombre, aquí ordenamos por porcentaje
      return (b.percentageCompleted || 0) - (a.percentageCompleted || 0);
    });

    return sortedPlans.map((plan, index) => ({
      name: plan.name,
      percentage: plan.percentageCompleted || 0, // Asegura un valor por defecto si es undefined
      fill: currentChartColors[index % currentChartColors.length],
    })) as PlanCompletionChartDataItem[];
  }, [foodPlansData, currentChartColors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando datos del dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <p>Error al cargar los datos del dashboard: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Gráficos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gráfico de Alimentos por Unidad de Medida */}
        <Card>
          <CardHeader>
            <CardTitle>Alimentos por Unidad de Medida</CardTitle>
            <CardDescription>
              Distribución de alimentos basada en sus unidades de medida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {foodsByUnitChartData.length > 0 ? (
              <ChartContainer
                config={{
                  value: {
                    label: "Cantidad",
                    color: "hsl(var(--chart-1))",
                  },
                  // Puedes añadir más configuraciones si es necesario
                }}
                className="aspect-auto h-[250px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={foodsByUnitChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      animationDuration={500}
                    >
                      {foodsByUnitChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          const item = payload[0]
                            .payload as FoodByUnitChartDataItem;
                          return (
                            <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
                              <p className="font-bold">{item.name}</p>
                              <p>Cantidad: {item.count}</p>
                              <p>Porcentaje: {item.value.toFixed(2)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground">
                No hay datos de alimentos por unidad de medida para mostrar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Ranking de Proveedores por Entradas */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Proveedores por Entradas</CardTitle>
            {/* CORREGIDO: Sólo debe haber una CardDescription aquí */}
            <CardDescription>
              Conteo de entradas de alimentos por proveedor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {providerRankingChartData.length > 0 ? (
              <ChartContainer
                config={{
                  entries: {
                    label: "Número de Entradas",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="aspect-auto h-[250px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={providerRankingChartData}
                    layout="vertical"
                    margin={{
                      left: 20,
                      right: 20,
                    }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      hide={false} // Asegúrate de que el eje Y esté visible para los nombres
                      width={100} // Ajusta el ancho para que los nombres no se corten
                      tickFormatter={(value) => {
                        if (value.length > 15) {
                          return value.substring(0, 12) + "...";
                        }
                        return value;
                      }}
                    />
                    <XAxis dataKey="entries" type="number" hide />
                    <Tooltip
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          const item = payload[0]
                            .payload as ProviderRankingChartDataItem;
                          return (
                            <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
                              <p className="font-bold">{item.name}</p>
                              <p>Entradas: {item.entries}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="entries" fill="var(--color-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground">
                No hay datos de entradas de alimentos para calcular el ranking
                de proveedores.
              </p>
            )}
          </CardContent>
        </Card>

        {/* <--- NUEVO GRÁFICO: Porcentaje de Cumplimiento de Planes */}
        <Card>
          <CardHeader>
            <CardTitle>Cumplimiento de Planes de Alimentos</CardTitle>
            <CardDescription>
              Porcentaje de cumplimiento de cada plan de alimentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {planCompletionChartData.length > 0 ? (
              <ChartContainer
                config={{
                  percentage: {
                    label: "Porcentaje Completado (%)",
                    color: "hsl(var(--chart-3))", // Puedes elegir un color específico
                  },
                }}
                className="aspect-auto h-[250px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={planCompletionChartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45} // Inclina las etiquetas para mejor legibilidad
                      textAnchor="end"
                      height={60} // Aumenta la altura del eje X para acomodar las etiquetas inclinadas
                      interval={0} // Muestra todas las etiquetas
                      tickFormatter={(value) => {
                        if (value.length > 15) {
                          return value.substring(0, 12) + "...";
                        }
                        return value;
                      }}
                    />
                    <YAxis domain={[0, 100]} />{" "}
                    {/* El porcentaje va de 0 a 100 */}
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(2)}%`} // Formatea el tooltip
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          const item = payload[0]
                            .payload as PlanCompletionChartDataItem;
                          return (
                            <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
                              <p className="font-bold">{item.name}</p>
                              <p>Completado: {item.percentage.toFixed(2)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="percentage" fill="var(--color-3)" />{" "}
                    {/* Usa un color del tema */}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground">
                No hay datos de planes de alimentos para calcular el
                cumplimiento.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
