import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'

/**
 * FinanzasClaras - App principal
 * Rutas de navegación para todas las pantallas de Stitch
 */

// Grupo A - Núcleo Fiscal
import Inicio from './pages/Inicio'
import IRPF from './pages/IRPF'
import Nomina from './pages/Nomina'

// Grupo B - Gastos
import GastosFamiliares from './pages/GastosFamiliares'
import PresupuestosAhorro from './pages/PresupuestosAhorro'

// Grupo C - Hipotecas y Préstamos
import SimuladorHipotecas from './pages/SimuladorHipotecas'
import PrestamosPersonales from './pages/PrestamosPersonales'
import AmortizacionAnticipada from './pages/AmortizacionAnticipada'

// Grupo D - Inversión
import GestionInversiones from './pages/GestionInversiones'
import SimuladorInmobiliaria from './pages/SimuladorInmobiliaria'
import SimuladorMobiliaria from './pages/SimuladorMobiliaria'
import DetalleActivo from './pages/DetalleActivo'

// Grupo E - Planificación
import PlanJubilacion from './pages/PlanJubilacion'
import PlanPensiones from './pages/PlanPensiones'
import DashboardPatrimonio from './pages/DashboardPatrimonio'

// Grupo F - Viajes
import SimuladorViajes from './pages/SimuladorViajes'

// Grupo G - Cuenta y Configuración
import CrearCuenta from './pages/CrearCuenta'
import ConfiguracionPerfil from './pages/ConfiguracionPerfil'
import HistorialCalculos from './pages/HistorialCalculos'
import PersonalizarModulos from './pages/PersonalizarModulos'
import Notificaciones from './pages/Notificaciones'

// Grupo H - IA y Sistema
import AsistenteIA from './pages/AsistenteIA'

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />

        <main>
          <Routes>
            {/* Grupo A - Núcleo Fiscal */}
            <Route path="/irpf" element={<IRPF />} />
            <Route path="/nomina" element={<Nomina />} />

            {/* Grupo B - Gastos */}
            <Route path="/gastos" element={<GastosFamiliares />} />
            <Route path="/gastos/presupuestos" element={<PresupuestosAhorro />} />

            {/* Grupo C - Hipotecas y Préstamos */}
            <Route path="/hipotecas" element={<SimuladorHipotecas />} />
            <Route path="/hipotecas/prestamos" element={<PrestamosPersonales />} />
            <Route path="/hipotecas/amortizacion" element={<AmortizacionAnticipada />} />

            {/* Grupo D - Inversión */}
            <Route path="/inversion" element={<GestionInversiones />} />
            <Route path="/inversion/inmobiliaria" element={<SimuladorInmobiliaria />} />
            <Route path="/inversion/mobiliaria" element={<SimuladorMobiliaria />} />
            <Route path="/inversion/activo/:id" element={<DetalleActivo />} />

            {/* Grupo E - Planificación */}
            <Route path="/jubilacion" element={<PlanJubilacion />} />
            <Route path="/jubilacion/pensiones" element={<PlanPensiones />} />
            <Route path="/jubilacion/dashboard" element={<DashboardPatrimonio />} />

            {/* Grupo F - Viajes */}
            <Route path="/viajes" element={<SimuladorViajes />} />

            {/* Grupo G - Cuenta y Configuración */}
            <Route path="/account" element={<CrearCuenta />} />
            <Route path="/account/perfil" element={<ConfiguracionPerfil />} />
            <Route path="/account/historial" element={<HistorialCalculos />} />
            <Route path="/account/modulos" element={<PersonalizarModulos />} />
            <Route path="/account/notificaciones" element={<Notificaciones />} />

            {/* Grupo H - IA y Sistema */}
            <Route path="/ia" element={<AsistenteIA />} />

            {/* Página principal - Dashboard */}
            <Route path="/" element={<Inicio />} />

            {/* Ruta por defecto */}
            <Route path="*" element={<div className="not-found">Página no encontrada</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
