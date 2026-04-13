import React from 'react'
import TopBar from './components/TopBar'
import ModulePanel from './components/ModulePanel'
import ViewerPanel from './components/ViewerPanel'
import SummaryPanel from './components/SummaryPanel'
import { useConfigurator } from './hooks/useConfigurator'
import './App.css'

export default function App() {
  const config = useConfigurator()

  return (
    <div className="app">
      <TopBar />
      <div className="app__body">
        <ModulePanel
          MODULES={config.MODULES}
          selections={config.selections}
          toggleModule={config.toggleModule}
          setSelect={config.setSelect}
        />
        <ViewerPanel
          totalPrice={config.totalPrice}
          lineItems={config.lineItems}
          warnings={config.warnings}
          activeGlbParts={config.activeGlbParts}
          hasAnyGlb={config.hasAnyGlb}
        />
        <SummaryPanel
          lineItems={config.lineItems}
          totalPrice={config.totalPrice}
          groundSurface={config.groundSurface}
          setGroundSurface={config.setGroundSurface}
          installation={config.installation}
          setInstallation={config.setInstallation}
          GROUND_SURFACES={config.GROUND_SURFACES}
          INSTALLATION_OPTIONS={config.INSTALLATION_OPTIONS}
        />
      </div>
    </div>
  )
}
