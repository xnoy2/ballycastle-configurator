import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// ── Supabase products provider
import { ProductsProvider } from './context/ProductsContext'
import { useProductsContext } from './context/ProductsContext'

// ── Portal
import PortalShell      from './portal/PortalShell'
import Dashboard        from './pages/Dashboard'
import BuildProgress    from './pages/BuildProgress'
import Photos           from './pages/Photos'
import ConfiguratorPage from './pages/ConfiguratorPage'
import { Delivery, AddExtras, ReferAFriend, Maintenance, LeaveReview } from './pages/PortalPages'

// ── Admin
import AdminDashboard from './pages/AdminDashboard'

// ── Standalone configurator
import TopBar       from './components/TopBar'
import ModulePanel  from './components/ModulePanel'
import ViewerPanel  from './components/ViewerPanel'
import SummaryPanel from './components/SummaryPanel'
import { useConfigurator } from './hooks/useConfigurator'
import './App.css'

function StandaloneConfigurator() {
  const { loading } = useProductsContext()
  const config = useConfigurator()

  if (loading) {
    return (
      <div className="app app--loading">
        <TopBar />
        <div className="app__loading-body">
          <div className="app__spinner" />
          <p>Loading products…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <TopBar />
      <div className="app__body">
        <ModulePanel  MODULES={config.MODULES} selections={config.selections} toggleModule={config.toggleModule} setSelect={config.setSelect} selectOption={config.selectOption} />
        <ViewerPanel  totalPrice={config.totalPrice} lineItems={config.lineItems} warnings={config.warnings} activeGlbParts={config.activeGlbParts} hasAnyGlb={config.hasAnyGlb} />
        <SummaryPanel lineItems={config.lineItems} totalPrice={config.totalPrice} groundSurface={config.groundSurface} setGroundSurface={config.setGroundSurface} installation={config.installation} setInstallation={config.setInstallation} GROUND_SURFACES={config.GROUND_SURFACES} INSTALLATION_OPTIONS={config.INSTALLATION_OPTIONS} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ProductsProvider>
        <Routes>
          {/* Standalone configurator */}
          <Route path="/" element={<StandaloneConfigurator />} />

          {/* Client Portal */}
          <Route path="/portal" element={<PortalShell />}>
            <Route index               element={<Dashboard />} />
            <Route path="progress"     element={<BuildProgress />} />
            <Route path="photos"       element={<Photos />} />
            <Route path="delivery"     element={<Delivery />} />
            <Route path="configure"    element={<ConfiguratorPage />} />
            <Route path="extras"       element={<AddExtras />} />
            <Route path="refer"        element={<ReferAFriend />} />
            <Route path="maintenance"  element={<Maintenance />} />
            <Route path="review"       element={<LeaveReview />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProductsProvider>
    </BrowserRouter>
  )
}
