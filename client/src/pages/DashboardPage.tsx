// client/src/pages/DashboardPage.tsx
import React, { useState, useEffect } from "react";
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
import { useFoods } from "@/hooks/useFoods";

// Define la interfaz para los datos del gráfico de pastel
interface FoodByUnitChartDataItem {
  name: string;
  value: number; // Porcentaje
  count: number; // Cantidad absoluta
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

  const isLoading = isLoadingFoods;
  const isError = isErrorFoods;
  const error = errorFoods;

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

  const foodsByUnitChartData = React.useMemo(() => {
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        Cargando datos del dashboard...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6 text-destructive">
        Error al cargar datos: {error?.message || "Error desconocido"}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-1">
          <CardHeader>
            <CardTitle>Alimentos por Unidad de Medida</CardTitle>
            <CardDescription>
              Distribución porcentual de alimentos según su unidad de medida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {foodsByUnitChartData.length > 0 ? (
              <ChartContainer config={{}} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={foodsByUnitChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={5}
                      label
                    >
                      {foodsByUnitChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      // Use a div with Tailwind classes for consistent styling with Shadcn
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          const item = payload[0]
                            .payload as FoodByUnitChartDataItem;
                          return (
                            <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
                              <p className="font-bold">{item.name}</p>
                              <p>
                                {item.value.toFixed(2)}% ({item.count} items)
                              </p>
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
                No hay datos de alimentos para mostrar.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
