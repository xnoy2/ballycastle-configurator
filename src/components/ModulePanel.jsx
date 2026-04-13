import React, { useMemo } from 'react'
import { Check } from 'lucide-react'
import './ModulePanel.css'

export default function ModulePanel({ MODULES, selections, toggleModule, setSelect }) {
  // Group modules by their category field
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
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  )

  return (
    <aside className="module-panel">
      <div className="panel-header">
        <span className="panel-eyebrow">Step 1</span>
        <h2 className="panel-title">Build Your Frame</h2>
      </div>

      <div className="modules-scroll">
        {sortedCategories.map(category => (
          <div key={category} className="category-group">
            <div className="category-label">{category}</div>

            {grouped[category].map(mod => {
              const isEnabled = selections[mod.id]?.enabled
              return (
                <div
                  key={mod.id}
                  className={`module-card ${isEnabled ? 'module-card--active' : ''}`}
                >
                  <button
                    className="module-toggle"
                    onClick={() => toggleModule(mod.id)}
                    aria-label={`Toggle ${mod.label}`}
                  >
                    <span className={`toggle-check ${isEnabled ? 'toggle-check--on' : ''}`}>
                      {isEnabled && (
                        <svg width="9" height="9" viewBox="0 0 10 8" fill="none">
                          <polyline points="1,4 4,7 9,1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="module-name">{mod.label}</span>
                  </button>

                  {isEnabled && (
                    <div className="module-selects">
                      {mod.selects.map(s => (
                        <select
                          key={s.id}
                          className="mod-select"
                          value={selections[mod.id]?.[s.id] || ''}
                          onChange={e => setSelect(mod.id, s.id, e.target.value)}
                        >
                          <option value="">{s.placeholder}</option>
                          {s.options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                              {opt.price > 0 ? ` — £${opt.price.toLocaleString()}` : ''}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </aside>
  )
}
