import React from 'react'
import ModulePanel  from '../components/ModulePanel'
import ViewerPanel  from '../components/ViewerPanel'
import SummaryPanel from '../components/SummaryPanel'
import { useConfigurator } from '../hooks/useConfigurator'
import '../App.css'

/**
 * Thin wrapper — embeds the configurator unchanged inside the portal.
 * Negative margins cancel the portal-content padding so the 3-column
 * grid fills the available space edge-to-edge.
 */
export default function ConfiguratorPage() {
  const config = useConfigurator()
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr 220px',
      height: 'calc(100vh - 58px)',
      margin: '-26px -26px -48px',
      overflow: 'hidden',
    }}>
      <ModulePanel
        MODULES={config.MODULES}
        selections={config.selections}
        toggleModule={config.toggleModule}
        setSelect={config.setSelect}
        selectOption={config.selectOption}
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
  )
}
