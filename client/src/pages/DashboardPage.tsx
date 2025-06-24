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
  Tooltip, // Importa Tooltip para tooltips interactivos
} from "recharts";
import { useMedicalCenters } from "@/hooks/useMedicalCenters"; // <-- ¡Importa el hook que creamos!

const DashboardPage: React.FC = () => {
  // Obtenemos todos los centros médicos para el dashboard.
  // NOTA IMPORTANTE: 'limit: 9999' es una forma de intentar obtener todos los datos.
  // En un entorno de producción con muchos datos, lo ideal sería que tu API ofreciera
  // un endpoint específico para estadísticas/agregaciones que ya devuelva los datos
  // resumidos o que permitiera una consulta sin paginación para propósitos de dashboard.
  const {
    data: medicalCenters,
    isLoading,
    isError,
    error,
  } = useMedicalCenters({ page: 1, limit: 9999, search: "" });

  // Procesar los datos para el gráfico
  // Usamos useMemo para memorizar el resultado y evitar cálculos innecesarios
  const processedChartData = React.useMemo(() => {
    if (!medicalCenters) return []; // Si no hay datos, devuelve un array vacío

    // Objeto para contar centros por la primera letra de su nombre (como ejemplo de agregación)
    const counts: { [key: string]: number } = {};
    medicalCenters.forEach((center) => {
      // Asegúrate de que `name` exista y toma la primera letra, conviértela a mayúscula
      const firstLetter = center.name
        ? center.name.charAt(0).toUpperCase()
        : "N/A";
      counts[firstLetter] = (counts[firstLetter] || 0) + 1;
    });

    // Convierte el objeto de conteos a un array de objetos apto para Recharts
    // Ordena alfabéticamente por la letra para una mejor visualización
    return Object.keys(counts)
      .sort() // Ordena las letras alfabéticamente
      .map((letter) => ({
        letter, // La clave para el eje X
        count: counts[letter], // El valor para la barra
      }));
  }, [medicalCenters]); // Re-calcula solo si `medicalCenters` cambia

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
        {/* Gráfico 1: Centros Médicos por Inicial del Nombre */}
        <Card className="col-span-1 md:col-span-2">
          {" "}
          {/* El gráfico ocupa más espacio */}
          <CardHeader>
            <CardTitle>Centros Médicos por Inicial</CardTitle>
            <CardDescription>
              Número de centros médicos agrupados por la primera letra de su
              nombre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processedChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={processedChartData}>
                  <XAxis
                    dataKey="letter" // Usa 'letter' como la clave para el eje X
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`} // Muestra el conteo directo
                  />
                  <Tooltip cursor={{ fill: "transparent" }} />{" "}
                  {/* Agrega un Tooltip al pasar el ratón */}
                  <Bar
                    dataKey="count" // Usa 'count' como el valor para la barra
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground">
                No hay datos de centros médicos para mostrar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Puedes añadir más métricas o gráficos aquí, por ejemplo, el total de centros */}
        <Card>
          <CardHeader>
            <CardTitle>Total Centros Médicos</CardTitle>
            <CardDescription>
              Número total de centros registrados.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px]">
            <p className="text-5xl font-bold text-primary">
              {medicalCenters?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
