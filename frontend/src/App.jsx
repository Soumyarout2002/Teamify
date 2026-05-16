import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/auth'

import Layout            from './components/layout/Layout'
import LoginPage         from './pages/LoginPage'
import RegisterPage      from './pages/RegisterPage'
import DashboardPage     from './pages/DashboardPage'
import ProjectsPage      from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import TasksPage         from './pages/TasksPage'
import TeamPage          from './pages/TeamPage'
import ReportsPage       from './pages/ReportsPage'
import ActivityPage      from './pages/ActivityPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage      from './pages/SettingsPage'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } }
})

const Guard = ({ children, pub = false }) => {
  const { token } = useAuthStore()
  if (pub)  return token ? <Navigate to="/dashboard" replace /> : children
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1e', color: '#ededf0',
              border: '1px solid #2c2c34', fontSize: '13.5px'
            },
            success: { iconTheme: { primary: '#f59e0b', secondary: '#000' } }
          }}
        />
        <Routes>
          <Route path="/login"    element={<Guard pub><LoginPage /></Guard>} />
          <Route path="/register" element={<Guard pub><RegisterPage /></Guard>} />
          <Route path="/" element={<Guard><Layout /></Guard>}>
            <Route index                  element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"       element={<DashboardPage />} />
            <Route path="projects"        element={<ProjectsPage />} />
            <Route path="projects/:id"    element={<ProjectDetailPage />} />
            <Route path="tasks"           element={<TasksPage />} />
            <Route path="team"            element={<TeamPage />} />
            <Route path="reports"         element={<ReportsPage />} />
            <Route path="activity"        element={<ActivityPage />} />
            <Route path="notifications"   element={<NotificationsPage />} />
            <Route path="settings"        element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
