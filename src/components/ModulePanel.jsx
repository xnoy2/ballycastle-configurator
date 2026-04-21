import React, { useMemo, useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import './ModulePanel.css'

// ─── Top-level panel ───────────────────────────────────────────────────────
export default function ModulePanel({ MODULES, selections, selectOption }) {
  const grouped = useMemo(() => {
    const map = {}
    MODULES.forEach(mod => {
      const cat = mod.category || 'Other'
      if (!map[cat]) map[cat] = []
      map[cat].push(mod)
    })
    return map
  }, [MODULES])

  const categoryOrder = ['Sets', 'Accessories', 'Other']
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
  )

  return (
    <aside className="module-panel">
      <div className="panel-header">
        <span className="panel-eyebrow">Step 1</span>
        <h2 className="panel-title">Build Your Frame</h2>
      </div>

      <div className="modules-scroll">
        {sortedCategories.map(cat => (
          <div key={cat} className="category-group">
            <div className="category-label">{cat}</div>
            {grouped[cat].map(mod => (
              <ModuleSection
                key={mod.id}
                mod={mod}
                selections={selections}
                selectOption={selectOption}
              />
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}

// ─── One collapsible module section ───────────────────────────────────────
function ModuleSection({ mod, selections, selectOption }) {
  const modState   = selections[mod.id] || {}
  const isActive   = modState.enabled
  const primarySel = mod.selects[0]
  const primaryVal = modState[primarySel?.id]

  const [open, setOpen] = useState(() => !!isActive)

  // When DB products load async after mount, open active sections
  useEffect(() => { if (isActive) setOpen(true) }, [isActive])

  function handleCardClick(selectId, optValue) {
    const currentVal = modState[selectId]
    // Clicking the already-selected card deselects it
    selectOption(mod.id, selectId, currentVal === optValue ? '' : optValue)
  }

  return (
    <div className={`mod-section${isActive ? ' mod-section--active' : ''}`}>
      {/* Header — click to expand/collapse */}
      <button
        className="mod-section__header"
        onClick={() => setOpen(p => !p)}
        aria-expanded={open}
      >
        <span className={`mod-section__dot${isActive ? ' on' : ''}`} />
        <span className="mod-section__name">{mod.label}</span>
        {isActive && primaryVal && (
          <span className="mod-section__tag">
            {primarySel.options.find(o => o.value === primaryVal)?.label.split('—')[0].trim() || ''}
          </span>
        )}
        <span className="mod-section__chevron">{open ? '▾' : '▸'}</span>
      </button>

      {/* Card grid — shown when open */}
      {open && (
        <div className="mod-section__body">
          {mod.selects.map((sel, idx) => {
            // Secondary selects (add-ons) only appear once the primary is chosen
            if (idx > 0 && !primaryVal) return null

            return (
              <div key={sel.id} className="sel-group">
                {idx > 0 && (
                  <div className="sel-group__label">
                    {sel.placeholder}
                  </div>
                )}

                <div className="cards-grid">
                  {/* "None" option for optional secondary selects */}
                  {idx > 0 && (
                    <NoneCard
                      selected={!modState[sel.id]}
                      onSelect={() => selectOption(mod.id, sel.id, '')}
                    />
                  )}

                  {sel.options.map(opt => (
                    <ProductCard
                      key={opt.value}
                      option={opt}
                      selected={modState[sel.id] === opt.value}
                      onSelect={() => handleCardClick(sel.id, opt.value)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── "None / Remove" card for optional add-on selects ─────────────────────
function NoneCard({ selected, onSelect }) {
  return (
    <div
      className={`prod-card none-card${selected ? ' prod-card--selected' : ''}`}
      onClick={onSelect}
      title="No add-on"
    >
      <div className="prod-card__thumb none-card__thumb">
        <span className="none-card__icon">✕</span>
      </div>
      <div className="prod-card__info">
        <span className="prod-card__name">None</span>
        <span className="prod-card__price">£0</span>
      </div>
      {selected && <span className="prod-card__check">✓</span>}
    </div>
  )
}
