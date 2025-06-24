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
import PlansPage from "./pages/PlansPage"; // <-- NUEVO: Importa la página de Planes
import ProvidersPage from "./pages/ProvidersPage";
import UnitsOfMeasurementPage from "./pages/UnitsOfMeasurementPage";
import { RegisterPage } from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Grupo de rutas protegidas: solo accesibles si el usuario está autenticado */}
        <Route element={<PrivateRoute />}>
          {/* MainLayout envuelve todas las rutas que requieren el diseño principal y autenticación */}
          <Route path="/" element={<MainLayout />}>
            {/* Redirige la ruta raíz a /medical-centers */}
            <Route index element={<Navigate to="/medical-centers" replace />} />
            <Route path="/medical-centers" element={<MedicalCentersPage />} />
            <Route
              path="/units-of-measurement"
              element={<UnitsOfMeasurementPage />}
            />
            <Route path="/providers" element={<ProvidersPage />} />{" "}
            <Route path="/foods" element={<FoodsPage />} />{" "}
            {/* NUEVO: Ruta para alimentos */}
            <Route path="/plans" element={<PlansPage />} />{" "}
            {/* <-- NUEVO: Ruta para planes */}
            {/* Aquí añadirías todas las demás rutas de tu aplicación que requieren autenticación */}
          </Route>
          {/* Grupo de rutas que usan tu layout principal (donde está el sidebar) */}
          <Route element={<MainLayout />}>
            {" "}
            {/* <-- Si tu Sidebar está dentro de MainLayout */}
            <Route path="/" element={<DashboardPage />} />{" "}
            {/* O la ruta por defecto que quieras */}
            <Route path="/dashboard" element={<DashboardPage />} />{" "}
            {/* <-- ¡Esta línea es CRUCIAL! */}
            {/* ... otras rutas de la app, como MedicalCentersPage ... */}
          </Route>
        </Route>

        {/* Ruta para cualquier otra página no encontrada (manejo de 404) */}
        <Route path="*" element={<div>404 - Página no encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;
