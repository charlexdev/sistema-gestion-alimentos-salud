// client/src/pages/DashboardPage.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useMedicalCenters } from "@/hooks/useMedicalCenters";
import { useFoods } from "@/hooks/useFoods";
import { useUsersCount } from "@/hooks/useUsersCount";
import { UsersIcon } from "lucide-react"; // <--- AÑADIDO: Importa el icono de usuarios

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
    data: medicalCenters,
    isLoading: isLoadingMedicalCenters,
    isError: isErrorMedicalCenters,
    error: errorMedicalCenters,
  } = useMedicalCenters({ page: 1, limit: 9999, search: "" });

  const {
    data: foods,
    isLoading: isLoadingFoods,
    isError: isErrorFoods,
    error: errorFoods,
  } = useFoods({ page: 1, limit: 9999, search: "" });

  const {
    usersCount,
    isLoading: isLoadingUsersCount,
    isError: isErrorUsersCount,
    error: errorUsersCount,
  } = useUsersCount();

  const mockProvidersCount = 75;
  const mockUnitsCount = 12;
  const mockPlansCount = 20;

  const isLoading =
    isLoadingMedicalCenters || isLoadingFoods || isLoadingUsersCount;
  const isError = isErrorMedicalCenters || isErrorFoods || isErrorUsersCount;
  const error = errorMedicalCenters || errorFoods || errorUsersCount;

  const systemRecordsChartData = React.useMemo(() => {
    const medicalCentersCount = medicalCenters?.length || 0;
    const actualFoodsCount = foods?.data?.length || 0;
    const actualUsersCount = usersCount !== null ? usersCount : 0;

    return [
      { category: "Centros Médicos", total: medicalCentersCount },
      { category: "Proveedores", total: mockProvidersCount },
      { category: "Unidades de Medida", total: mockUnitsCount },
      { category: "Planes", total: mockPlansCount },
      { category: "Alimentos", total: actualFoodsCount },
      { category: "Usuarios", total: actualUsersCount },
    ];
  }, [medicalCenters, foods, usersCount]);

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
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Total de Registros del Sistema</CardTitle>
            <CardDescription>
              Conteo total de entidades clave en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {systemRecordsChartData.length > 0 ? (
              <ChartContainer
                config={{
                  "Centros Médicos": {
                    label: "Centros Médicos",
                    color: "oklch(var(--color-chart-1))",
                  },
                  Proveedores: {
                    label: "Proveedores",
                    color: "oklch(var(--color-chart-2))",
                  },
                  "Unidades de Medida": {
                    label: "Unidades de Medida",
                    color: "oklch(var(--color-chart-3))",
                  },
                  Planes: {
                    label: "Planes",
                    color: "oklch(var(--color-chart-4))",
                  },
                  Alimentos: {
                    label: "Alimentos",
                    color: "oklch(var(--color-chart-5))",
                  },
                  Usuarios: {
                    label: "Usuarios",
                    color: "oklch(var(--color-chart-6))",
                  },
                  total: { label: "Total", color: "oklch(var(--primary))" },
                }}
                className="min-h-[250px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={systemRecordsChartData} layout="vertical">
                    <XAxis
                      type="number"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={120}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Legend />
                    <Bar
                      dataKey="total"
                      fill="oklch(var(--color-chart-1))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground">
                No hay datos de registros para mostrar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* MODIFICADO: Card para Cantidad de Usuarios, ahora más vistoso y pequeño */}
        <Card className="flex flex-col">
          {" "}
          {/* Añadido flex-col para organizar contenido */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {" "}
            {/* Modificado para alinear título e icono */}
            <CardTitle className="text-sm font-medium">
              Cantidad de Usuarios
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />{" "}
            {/* Añadido icono */}
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center p-6 pt-0">
            {" "}
            {/* Ajuste de padding */}
            {isLoadingUsersCount ? (
              <p className="text-xl text-muted-foreground">Cargando...</p>
            ) : isErrorUsersCount ? (
              <p className="text-xl text-destructive">Error</p>
            ) : (
              <div className="text-4xl font-bold text-primary">
                {" "}
                {/* Reducido el tamaño del texto */}
                {usersCount !== null ? usersCount : "N/A"}
              </div>
            )}
          </CardContent>
        </Card>

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
