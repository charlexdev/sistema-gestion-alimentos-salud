// client/src/pages/DashboardPage.tsx
import React from "react";
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

// Define una interfaz local para el 'item' que el formatter de Tooltip recibe
interface RechartsTooltipItem {
  payload?: FoodByUnitChartDataItem;
}

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

  const foodsByUnitChartData = React.useMemo(() => {
    if (!foods?.data || foods.data.length === 0) {
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
    const colors = [
      "oklch(var(--color-chart-1))",
      "oklch(var(--color-chart-2))",
      "oklch(var(--color-chart-3))",
      "oklch(var(--color-chart-4))",
      "oklch(var(--color-chart-5))",
      "oklch(var(--color-chart-6))",
      "oklch(var(--color-chart-7))",
      "oklch(var(--color-chart-8))",
      "oklch(var(--color-chart-9))",
      "oklch(var(--color-chart-10))",
    ];

    return Object.values(unitCounts).map((entry, index) => ({
      name: entry.name,
      value: (entry.count / totalFoods) * 100,
      count: entry.count,
      fill: colors[index % colors.length],
    }));
  }, [foods]);

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
              <ChartContainer config={{}} className="min-h-[250px] w-full">
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
                      formatter={(
                        value: number,
                        name: string,
                        item: RechartsTooltipItem
                      ) => {
                        if (item.payload) {
                          return [
                            `${value.toFixed(2)}% (${
                              item.payload.count
                            } items)`,
                            name,
                          ];
                        }
                        return [`${value.toFixed(2)}%`, name];
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
