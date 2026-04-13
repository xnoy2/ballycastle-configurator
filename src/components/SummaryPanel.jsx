import React, { useState } from 'react'
import { FileText, ChevronDown } from 'lucide-react'
import QuoteModal from './QuoteModal'
import './SummaryPanel.css'

export default function SummaryPanel({
  lineItems,
  totalPrice,
  groundSurface,
  setGroundSurface,
  installation,
  setInstallation,
  GROUND_SURFACES,
  INSTALLATION_OPTIONS,
}) {
  const [showModal, setShowModal] = useState(false)
  const [sceneImage, setSceneImage] = useState(null)

  const handleGenerateQuote = () => {
    if (totalPrice === 0) return
    // Capture the 3D canvas before opening modal.
    // This works because we set preserveDrawingBuffer:true on the Canvas.
    try {
      const canvas = document.querySelector('.viewer-canvas-wrap canvas')
      setSceneImage(canvas ? canvas.toDataURL('image/png') : null)
    } catch {
      setSceneImage(null)
    }
    setShowModal(true)
  }

  return (
    <aside className="summary-panel">
      <div className="panel-header">
        <span className="panel-eyebrow">Step 2</span>
        <h2 className="panel-title">Summary</h2>
      </div>

      {/* Line items */}
      <div className="summary-items">
        {lineItems.length === 0 ? (
          <p className="summary-empty">Select options to build your quote</p>
        ) : (
          lineItems.map((item, i) => (
            <div key={i} className="line-item">
              <span className="line-item__name">{item.label}</span>
              <span className="line-item__price">£{item.price.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>

      {/* Options */}
      <div className="summary-options">
        <div className="option-group">
          <label className="option-label">Ground Surface</label>
          <div className="select-wrap">
            <select
              className="summary-select"
              value={groundSurface}
              onChange={e => setGroundSurface(e.target.value)}
            >
              <option value="">Select surface…</option>
              {GROUND_SURFACES.map(g => (
                <option key={g.value} value={g.value}>
                  {g.label}{g.price > 0 ? ` — £${g.price.toLocaleString()}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="select-icon" />
          </div>
        </div>

        <div className="option-group">
          <label className="option-label">Installation</label>
          <div className="select-wrap">
            <select
              className="summary-select"
              value={installation}
              onChange={e => setInstallation(e.target.value)}
            >
              <option value="">Select option…</option>
              {INSTALLATION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="select-icon" />
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="summary-total">
        <span className="total-label">Estimated Total</span>
        <span className="total-value">
          {totalPrice > 0 ? `£${totalPrice.toLocaleString()}` : '—'}
        </span>
      </div>

      {/* CTA */}
      <div className="summary-cta">
        <button
          className="quote-btn"
          onClick={handleGenerateQuote}
          disabled={totalPrice === 0}
        >
          <FileText size={15} />
          Generate Quote
        </button>
        <p className="cta-note">
          We'll email a full PDF quote within 24 hrs.
        </p>
      </div>

      {/* Quote modal — rendered at document root level via portal-like pattern */}
      {showModal && (
        <QuoteModal
          lineItems={lineItems}
          totalPrice={totalPrice}
          sceneImage={sceneImage}
          onClose={() => setShowModal(false)}
        />
      )}
    </aside>
  )
}
