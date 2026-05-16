import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users,
  BarChart3, Activity, Bell, Settings, LogOut, Search, Plus, X
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/dashboard' },
  { icon: FolderKanban,    label: 'Projects',      path: '/projects' },
  { icon: CheckSquare,     label: 'Tasks',         path: '/tasks' },
  { icon: Users,           label: 'Team',          path: '/team' },
]
const NAV2 = [
  { icon: BarChart3, label: 'Reports',       path: '/reports' },
  { icon: Activity,  label: 'Activity',      path: '/activity' },
  { icon: Bell,      label: 'Notifications', path: '/notifications', badge: 3 },
  { icon: Settings,  label: 'Settings',      path: '/settings' },
]
const TITLES = {
  '/dashboard':'/dashboard','/projects':'/projects','/tasks':'/tasks',
  '/team':'/team','/reports':'/reports','/activity':'/activity',
  '/notifications':'/notifications','/settings':'/settings',
}
const LABELS = {
  '/dashboard':'Dashboard','/projects':'Projects','/tasks':'Tasks',
  '/team':'Team','/reports':'Reports','/activity':'Activity Log',
  '/notifications':'Notifications','/settings':'Settings',
}

export default function Layout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const [search, setSearch] = useState('')

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}` : 'U'
  const title = Object.entries(LABELS).find(([p]) => pathname.startsWith(p))?.[1] ?? 'Teamify'
  const isActive = (p) => pathname === p || (p !== '/dashboard' && pathname.startsWith(p))

  const handleLogout = async () => {
    try { await authAPI.logout() } catch (_) {}
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-mark">T</div>
          <span className="sb-name">Teamify</span>
        </div>

        <nav className="sb-nav">
          <span className="sb-lbl">Main</span>
          {NAV.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              className={`sb-item ${isActive(path) ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon /> {label}
            </button>
          ))}

          <span className="sb-lbl">Tools</span>
          {NAV2.map(({ icon: Icon, label, path, badge }) => (
            <button
              key={path}
              className={`sb-item ${isActive(path) ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon /> {label}
              {badge && <span className="sb-badge">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sb-foot">
          <div className="user-row" onClick={() => navigate('/settings')}>
            <div className="av av-md">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div className="txt-xs txt-muted">{user?.role}</div>
            </div>
          </div>
          <button className="sb-item mt-2" style={{ color: 'var(--txt-3)' }} onClick={handleLogout}>
            <LogOut /> Logout
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="topbar-title">{title}</span>

          <div className="search">
            <Search />
            <input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--txt-3)', display: 'flex', cursor: 'pointer' }}
                onClick={() => setSearch('')}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects')}>
            <Plus /> New
          </button>

          <button className="icon-btn" onClick={() => navigate('/notifications')}>
            <Bell />
            <span className="dot" />
          </button>

          <div
            className="av av-md"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/settings')}
          >
            {initials}
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
