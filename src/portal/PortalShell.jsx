import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import './portal.css'

const NAV_GROUPS = [
  {
    label: 'My Project',
    items: [
      { to: '/portal',            icon: '🏠', text: 'Dashboard'      },
      { to: '/portal/progress',   icon: '📊', text: 'Build Progress' },
      { to: '/portal/photos',     icon: '📷', text: 'Photos'         },
      { to: '/portal/delivery',   icon: '🚚', text: 'Delivery'       },
    ],
  },
  {
    label: 'Configure',
    items: [
      { to: '/portal/configure',  icon: '🎮', text: 'Configurator'  },
      { to: '/portal/extras',     icon: '⭐', text: 'Add Extras'    },
    ],
  },
  {
    label: 'Rewards & More',
    items: [
      { to: '/portal/refer',        icon: '🎁', text: 'Refer a Friend', badge: '£50' },
      { to: '/portal/maintenance',  icon: '🔧', text: 'Maintenance'     },
      { to: '/portal/review',       icon: '⭐', text: 'Leave a Review'  },
    ],
  },
]

const TITLES = {
  '/portal':              'Dashboard',
  '/portal/progress':     'Build Progress',
  '/portal/photos':       'My Photos',
  '/portal/delivery':     'Delivery',
  '/portal/configure':    'Configurator',
  '/portal/extras':       'Add Extras',
  '/portal/refer':        'Refer a Friend',
  '/portal/maintenance':  'Maintenance',
  '/portal/review':       'Leave a Review',
}

export default function PortalShell() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? 'Client Portal'

  return (
    <div className="portal-root">
      {/* ── Sidebar ── */}
      <aside className="p-sidebar">
        <div className="p-sidebar__logo">
          <img src="/images/bcf.png" alt="Ballycastle Climbing Frames" />
        </div>

        {NAV_GROUPS.map(g => (
          <div key={g.label} className="p-sidebar__group">
            <span className="p-sidebar__group-label">{g.label}</span>
            {g.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/portal'}
                className={({ isActive }) =>
                  `p-nav-link${isActive ? ' active' : ''}`
                }
              >
                <span className="p-nav-icon">{item.icon}</span>
                <span>{item.text}</span>
                {item.badge && (
                  <span className="p-nav-badge">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="p-sidebar__footer">
          <div className="p-sidebar__user">
            <div className="p-user-avatar">SH</div>
            <div>
              <div className="p-user-name">Sarah Henderson</div>
              <div className="p-user-role">Client · BCF-2025-0842</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="p-main">
        <header className="p-topbar">
          <span className="p-topbar__title">{title}</span>
          <div className="p-topbar__acts">
            <button className="p-btn p-btn-secondary p-btn-sm">📞 028 2044 0670</button>
            <button className="p-btn p-btn-primary p-btn-sm">💬 Support</button>
          </div>
        </header>

        <div className="p-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
