// frontend/src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import MedicalCentersPage from "./pages/MedicalCentersPage";
import LoginPage from "./pages/LoginPage";
import PrivateRoute from "./components/PrivateRoute";
import UnitsOfMeasurementPage from "./pages/UnitsOfMeasurementPage";
import ProvidersPage from "./pages/ProvidersPage"; // Importa la página de proveedores
import FoodsPage from "./pages/FoodsPage"; // NUEVO: Importa la página de Alimentos

import { Toaster } from "sonner";

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta para la página de login (no protegida) */}
        <Route path="/login" element={<LoginPage />} />

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
            {/* Ruta para proveedores */}
            <Route path="/foods" element={<FoodsPage />} />{" "}
            {/* NUEVO: Ruta para alimentos */}
            {/* Aquí añadirías todas las demás rutas de tu aplicación que requieren autenticación */}
          </Route>
        </Route>

        {/* Ruta para cualquier otra página no encontrada (manejo de 404) */}
        <Route path="*" element={<div>404 - Página no encontrada</div>} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
