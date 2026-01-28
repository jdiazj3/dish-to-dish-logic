import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProductos from "./pages/AdminProductos";
import AdminMesasSalones from "./pages/AdminMesasSalones";
import AdminSedes from "./pages/AdminSedes";
import AdminReportes from "./pages/AdminReportes";
import AdminInventario from "./pages/AdminInventario";
import AdminPuntos from "./pages/AdminPuntos";
import MeseroDashboard from "./pages/MeseroDashboard";
import MeseroExternoDashboard from "./pages/MeseroExternoDashboard";
import CajeroFacturacionDomicilios from "./pages/CajeroFacturacionDomicilios";
import CocinaDashboard from "./pages/CocinaDashboard";
import CajeroDashboard from "./pages/CajeroDashboard";
import CajeroFacturacion from "./pages/CajeroFacturacion";
import CajeroCierre from "./pages/CajeroCierre";
import CajeroClientes from "./pages/CajeroClientes";
import CrearOrden from "./pages/CrearOrden";
import CrearOrdenDomicilio from "./pages/CrearOrdenDomicilio";
import EditarOrden from "./pages/EditarOrden";
import CrearUsuariosPrueba from "./pages/CrearUsuariosPrueba";
import UserProfile from "./pages/UserProfile";
import Logout from "./pages/Logout";
import NotFound from "./pages/NotFound";
import PantallaTurnos from "./pages/PantallaTurnos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/productos" element={
            <ProtectedRoute>
              <AdminProductos />
            </ProtectedRoute>
          } />
          <Route path="/admin/mesas-salones" element={
            <ProtectedRoute>
              <AdminMesasSalones />
            </ProtectedRoute>
          } />
          <Route path="/admin/sedes" element={
            <ProtectedRoute>
              <AdminSedes />
            </ProtectedRoute>
          } />
          <Route path="/admin/reportes" element={
            <ProtectedRoute>
              <AdminReportes />
            </ProtectedRoute>
          } />
          <Route path="/admin/inventario" element={
            <ProtectedRoute>
              <AdminInventario />
            </ProtectedRoute>
          } />
          <Route path="/admin/puntos" element={
            <ProtectedRoute>
              <AdminPuntos />
            </ProtectedRoute>
          } />
          <Route path="/mesero" element={
            <ProtectedRoute>
              <MeseroDashboard />
            </ProtectedRoute>
          } />
          <Route path="/mesero-externo" element={
            <ProtectedRoute>
              <MeseroExternoDashboard />
            </ProtectedRoute>
          } />
          <Route path="/cajero/facturacion-domicilios" element={
            <ProtectedRoute>
              <CajeroFacturacionDomicilios />
            </ProtectedRoute>
          } />
          <Route path="/cocina" element={
            <ProtectedRoute>
              <CocinaDashboard />
            </ProtectedRoute>
          } />
          <Route path="/cajero" element={
            <ProtectedRoute>
              <CajeroDashboard />
            </ProtectedRoute>
          } />
          <Route path="/cajero/facturacion" element={
            <ProtectedRoute>
              <CajeroFacturacion />
            </ProtectedRoute>
          } />
          <Route path="/cajero/cierre" element={
            <ProtectedRoute>
              <CajeroCierre />
            </ProtectedRoute>
          } />
          <Route path="/cajero/clientes" element={
            <ProtectedRoute>
              <CajeroClientes />
            </ProtectedRoute>
          } />
          <Route path="/orden/nueva" element={
            <ProtectedRoute>
              <CrearOrden />
            </ProtectedRoute>
          } />
          <Route path="/orden/domicilio" element={
            <ProtectedRoute>
              <CrearOrdenDomicilio />
            </ProtectedRoute>
          } />
          <Route path="/orden/:ordenId" element={
            <ProtectedRoute>
              <EditarOrden />
            </ProtectedRoute>
          } />
          <Route path="/perfil" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/logout" element={<Logout />} />
          <Route path="/setup/test-users" element={<CrearUsuariosPrueba />} />
          <Route path="/turnos" element={<PantallaTurnos />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
