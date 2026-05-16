import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, CheckSquare, Users, Clock, ArrowRight, Plus } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { format, subDays } from 'date-fns'
import { projectsAPI, tasksAPI, usersAPI } from '../services/api'
import { useAuthStore } from '../store/auth'

const COLORS = ['#9090a0', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444']

const demoChart = Array.from({ length: 14 }, (_, i) => ({
  date: format(subDays(new Date(), 13 - i), 'MMM d'),
  completed: Math.floor(Math.random() * 9) + 1,
}))

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: pData } = useQuery({ queryKey: ['projects'], queryFn: () => projectsAPI.list({ limit: 100 }) })
  const { data: tData } = useQuery({ queryKey: ['tasks'],    queryFn: () => tasksAPI.list({ limit: 200 }) })
  const { data: uData } = useQuery({ queryKey: ['users'],    queryFn: () => usersAPI.list() })

  const projects = pData?.data?.data?.projects ?? []
  const tasks    = tData?.data?.data?.tasks ?? []
  const users    = uData?.data?.data?.users ?? []

  const myTasks  = tasks.filter((t) => t.assigneeId === user?.id)
  const overdue  = tasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length
  const done     = tasks.filter((t) => t.status === 'done').length
  const rate     = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  const pieData = [
    { name: 'To Do',       value: tasks.filter((t) => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'in_progress').length },
    { name: 'In Review',   value: tasks.filter((t) => t.status === 'in_review').length },
    { name: 'Done',        value: tasks.filter((t) => t.status === 'done').length },
    { name: 'Cancelled',   value: tasks.filter((t) => t.status === 'cancelled').length },
  ].filter((s) => s.value > 0)

  const TT = ({ contentStyle: _, ...p }) => (
    <Tooltip
      {...p}
      contentStyle={{ background: '#1a1a1e', border: '1px solid #2c2c34', borderRadius: 8, fontSize: 12 }}
    />
  )

  return (
    <div>
      {/* Header */}
      <div className="ph">
        <div>
          <h1>Good morning, {user?.firstName} 👋</h1>
          <p>Here's what's happening in your workspace today.</p>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary" onClick={() => navigate('/projects')}>
            <Plus /> New Project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats fu">
        <div className="stat" style={{ '--c': 'var(--amber)', '--c-bg': 'var(--amber-soft)' }}>
          <div className="stat-ic"><FolderKanban /></div>
          <div className="stat-val">{projects.length}</div>
          <div className="stat-lbl">Active Projects</div>
          <div className="stat-ch">↑ this month</div>
        </div>
        <div className="stat" style={{ '--c': 'var(--blue)', '--c-bg': 'rgba(59,130,246,.08)' }}>
          <div className="stat-ic"><CheckSquare /></div>
          <div className="stat-val">{tasks.length}</div>
          <div className="stat-lbl">Total Tasks</div>
          <div className="stat-ch">{rate}% completion</div>
        </div>
        <div className="stat" style={{ '--c': 'var(--green)', '--c-bg': 'rgba(34,197,94,.08)' }}>
          <div className="stat-ic"><Users /></div>
          <div className="stat-val">{users.length}</div>
          <div className="stat-lbl">Team Members</div>
          <div className="stat-ch">↑ active today</div>
        </div>
        <div className="stat" style={{ '--c': overdue > 0 ? 'var(--red)' : 'var(--green)', '--c-bg': overdue > 0 ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.08)' }}>
          <div className="stat-ic"><Clock /></div>
          <div className="stat-val">{overdue}</div>
          <div className="stat-lbl">Overdue Tasks</div>
          <div className={`stat-ch ${overdue > 0 ? 'neg' : ''}`}>
            {overdue > 0 ? '⚠ Needs attention' : '✓ All on track'}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="dash-grid">
        {/* Area chart */}
        <div className="card fu1 full">
          <div className="card-h">
            <span className="card-t">Task Completions — Last 14 Days</span>
          </div>
          <div className="card-b">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={demoChart}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e24" />
                <XAxis dataKey="date"      tick={{ fill: '#55555f', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis                     tick={{ fill: '#55555f', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a1e', border: '1px solid #2c2c34', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="completed" stroke="#f59e0b" strokeWidth={2} fill="url(#ag)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="card fu2">
          <div className="card-h">
            <span className="card-t">Recent Projects</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
              <ArrowRight size={13} /> All
            </button>
          </div>
          <div className="card-b">
            {projects.length === 0 ? (
              <div className="empty">
                <FolderKanban />
                <h3>No projects yet</h3>
                <p>Create your first project</p>
              </div>
            ) : projects.slice(0, 5).map((p) => (
              <div
                key={p.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-dim)', cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)', flexShrink: 0 }}>
                  <FolderKanban size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div className="prog mt-2"><div className="prog-fill" style={{ width: `${p.progress ?? 0}%` }} /></div>
                </div>
                <span className={`badge b-${p.status}`}>{p.status?.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart */}
        <div className="card fu3">
          <div className="card-h"><span className="card-t">Tasks by Status</span></div>
          <div className="card-b">
            {pieData.length === 0 ? (
              <div className="empty"><CheckSquare /><h3>No tasks yet</h3></div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a1e', border: '1px solid #2c2c34', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {pieData.map((s, i) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--txt-2)' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      {s.name} ({s.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* My tasks */}
        <div className="card fu4">
          <div className="card-h">
            <span className="card-t">My Tasks</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
              <ArrowRight size={13} /> All
            </button>
          </div>
          <div className="card-b">
            {myTasks.length === 0 ? (
              <div className="empty"><CheckSquare /><h3>No tasks assigned to you</h3></div>
            ) : myTasks.slice(0, 7).map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: t.priority === 'high' || t.priority === 'critical' ? 'var(--red)' : t.priority === 'medium' ? 'var(--amber)' : 'var(--txt-3)' }} />
                <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                <span className={`badge b-${t.status}`}>{t.status?.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="card fu4">
          <div className="card-h">
            <span className="card-t">Team</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/team')}>
              <ArrowRight size={13} /> All
            </button>
          </div>
          <div className="card-b">
            {users.slice(0, 6).map((u) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <div className="av av-sm">{u.firstName?.[0]}{u.lastName?.[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                  <div className="txt-xs txt-muted">{u.role}</div>
                </div>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
