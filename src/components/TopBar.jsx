import React from 'react'
import './TopBar.css'

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar__brand" style={{ marginLeft: '50px' }}>
        <img src="/images/bcf.png" width={100} />
      </div>
      <div className="topbar__center">
        <span className="topbar__badge">Configurator</span>
      </div>
      <div className="topbar__right">
        <a
          href="https://ballycastleclimbingframes.co.uk"
          target="_blank"
          rel="noreferrer"
          className="topbar__link"
        >
          ballycastleclimbingframes.co.uk ↗
        </a>
      </div>
    </header>
  )
}
