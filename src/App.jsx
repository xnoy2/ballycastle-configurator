import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LayoutGrid, Eye, FileText } from 'lucide-react'

// ── Supabase products provider
import { ProductsProvider } from './context/ProductsContext'
import { useProductsContext } from './context/ProductsContext'

// ── Portal
import BCFPortal from './portal/BCFPortal'

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
  const [mobileTab, setMobileTab] = useState('build')

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
      <div className="app__body" data-tab={mobileTab}>
        <ModulePanel  MODULES={config.MODULES} selections={config.selections} toggleModule={config.toggleModule} setSelect={config.setSelect} selectOption={config.selectOption} />
        <ViewerPanel  totalPrice={config.totalPrice} lineItems={config.lineItems} warnings={config.warnings} activeGlbParts={config.activeGlbParts} hasAnyGlb={config.hasAnyGlb} />
        <SummaryPanel lineItems={config.lineItems} totalPrice={config.totalPrice} groundSurface={config.groundSurface} setGroundSurface={config.setGroundSurface} installation={config.installation} setInstallation={config.setInstallation} GROUND_SURFACES={config.GROUND_SURFACES} INSTALLATION_OPTIONS={config.INSTALLATION_OPTIONS} />
      </div>
      <nav className="mobile-tabs">
        <button className={`mobile-tab${mobileTab === 'build'   ? ' mobile-tab--active' : ''}`} onClick={() => setMobileTab('build')}>
          <LayoutGrid size={22} />
          <span>Build</span>
        </button>
        <button className={`mobile-tab${mobileTab === 'preview' ? ' mobile-tab--active' : ''}`} onClick={() => setMobileTab('preview')}>
          <Eye size={22} />
          <span>Preview</span>
        </button>
        <button className={`mobile-tab${mobileTab === 'quote'   ? ' mobile-tab--active' : ''}`} onClick={() => setMobileTab('quote')}>
          <FileText size={22} />
          <span>Quote</span>
        </button>
      </nav>
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
          <Route path="/portal" element={<BCFPortal />} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProductsProvider>
    </BrowserRouter>
  )
}
