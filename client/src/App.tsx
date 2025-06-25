// frontend/src/App.tsx
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import MainLayout from "./layouts/MainLayout";
import FoodsPage from "./pages/FoodsPage";
import LoginPage from "./pages/LoginPage";
import MedicalCentersPage from "./pages/MedicalCentersPage";
import PlansPage from "./pages/PlansPage";
import ProvidersPage from "./pages/ProvidersPage";
import UnitsOfMeasurementPage from "./pages/UnitsOfMeasurementPage";
import { RegisterPage } from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage"; // <--- ¡IMPORTA TU COMPONENTE USERS PAGE AQUÍ!

// Opcional: Página de Acceso No Autorizado
const UnauthorizedPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <h1 className="text-4xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
    <p className="text-lg text-gray-800 mb-8">
      No tienes permiso para acceder a esta página.
    </p>
    <a href="/" className="text-blue-600 hover:underline">
      Volver al inicio
    </a>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />{" "}
        {/* Nueva ruta para acceso denegado */}
        {/* Grupo de rutas protegidas y con layout principal */}
        <Route element={<PrivateRoute />}>
          {" "}
          {/* PrivateRoute para cualquier usuario autenticado */}
          <Route path="/" element={<MainLayout />}>
            {" "}
            {/* MainLayout para todas las rutas que lo usan */}
            {/* Rutas para todos los usuarios autenticados */}
            <Route index element={<Navigate to="/dashboard" replace />} />{" "}
            {/* Redirige la raíz a dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/medical-centers" element={<MedicalCentersPage />} />
            <Route
              path="/units-of-measurement"
              element={<UnitsOfMeasurementPage />}
            />
            <Route path="/providers" element={<ProvidersPage />} />
            <Route path="/foods" element={<FoodsPage />} />
            <Route path="/plans" element={<PlansPage />} />
            {/* Rutas específicas para administradores */}
            {/* ESTE ES EL CAMBIO CLAVE: Usa PrivateRoute con allowedRoles="admin" y renderiza UsersPage */}
            <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
              <Route path="/users" element={<UsersPage />} />{" "}
              {/* <-- ¡AHORA SÍ USA TU COMPONENTE USERS PAGE! */}
            </Route>
          </Route>
        </Route>
        {/* Ruta para cualquier otra página no encontrada (manejo de 404) */}
        <Route path="*" element={<div>404 - Página no encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;
