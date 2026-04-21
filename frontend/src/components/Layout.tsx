import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Car, Map, BarChart2, Bell, LogOut, Radio } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/vehicles', icon: Car, label: 'Vehicles' },
  { to: '/routes', icon: Map, label: 'Routes' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/alerts', icon: Bell, label: 'Alerts', hasAlerts: true },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: alertsData } = useQuery({
    queryKey: ['alerts-count'],
    queryFn: () => api.get('/alerts?status=open&limit=200').then(r => r.data),
    refetchInterval: 10000,
  })

  const openAlertCount = alertsData?.alerts?.filter((a: any) => a.status === 'open').length || 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UM'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">
              <Radio size={18} />
            </div>
            <div>
              <div className="logo-text">UrbanMove</div>
              <div className="logo-sub">Fleet Platform</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(({ to, icon: Icon, label, exact, hasAlerts }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              {label}
              {hasAlerts && openAlertCount > 0 && (
                <span className="nav-badge">{openAlertCount > 99 ? '99+' : openAlertCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={handleLogout} title="Logout">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <LogOut size={14} color="var(--text-muted)" />
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div style={{ flex: 1 }} />
          <div className="flex items-center gap-3">
            <span className="badge badge-success">
              <span className="status-dot active" style={{ width: 6, height: 6, display: 'inline-block', borderRadius: '50%' }} />
              System Healthy
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
