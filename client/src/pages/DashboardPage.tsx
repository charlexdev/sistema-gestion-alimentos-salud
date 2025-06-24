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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useMedicalCenters } from "@/hooks/useMedicalCenters";

const DashboardPage: React.FC = () => {
  const {
    data: medicalCenters,
    isLoading: isLoadingMedicalCenters,
    isError: isErrorMedicalCenters,
    error: errorMedicalCenters,
  } = useMedicalCenters({ page: 1, limit: 9999, search: "" });

  const mockProvidersCount = 75;
  const mockUnitsCount = 12;
  const mockPlansCount = 20;
  const mockFoodsCount = 150;

  const isLoading = isLoadingMedicalCenters;
  const isError = isErrorMedicalCenters;
  const error = errorMedicalCenters;

  const systemRecordsChartData = React.useMemo(() => {
    const medicalCentersCount = medicalCenters?.length || 0;

    return [
      { category: "Centros Médicos", total: medicalCentersCount },
      { category: "Proveedores", total: mockProvidersCount },
      { category: "Unidades de Medida", total: mockUnitsCount },
      { category: "Planes", total: mockPlansCount },
      { category: "Alimentos", total: mockFoodsCount },
    ];
  }, [medicalCenters]);

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
        <Card className="col-span-1 md:col-span-3">
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
                  }, // Ajustado a oklch
                  Proveedores: {
                    label: "Proveedores",
                    color: "oklch(var(--color-chart-2))",
                  }, // Ajustado a oklch
                  "Unidades de Medida": {
                    label: "Unidades de Medida",
                    color: "oklch(var(--color-chart-3))",
                  }, // Ajustado a oklch
                  Planes: {
                    label: "Planes",
                    color: "oklch(var(--color-chart-4))",
                  }, // Ajustado a oklch
                  Alimentos: {
                    label: "Alimentos",
                    color: "oklch(var(--color-chart-5))",
                  }, // Ajustado a oklch
                  total: { label: "Total", color: "oklch(var(--primary))" }, // Ajustado a oklch
                }}
                className="min-h-[400px] w-full"
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
                    {/* CAMBIO AQUÍ: Usar oklch() en lugar de hsl() */}
                    <Bar
                      dataKey="total"
                      fill="oklch(var(--chart-1))"
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
      </div>
    </div>
  );
};

export default DashboardPage;
