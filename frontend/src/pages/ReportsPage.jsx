import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { reportsAPI } from '../services/api'

export default function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['org-report'], queryFn: () => reportsAPI.org() })
  const report = data?.data?.data

  const projectStats = (report?.projectStats ?? []).map((s) => ({
    name: s.status?.replace('_', ' ') ?? '',
    value: parseInt(s.dataValues?.count ?? 0, 10),
  }))
  const topPerformers = report?.topPerformers ?? []
  const overdue       = report?.overdueTasks  ?? 0

  return (
    <div>
      <div className="ph">
        <div><h1>Reports</h1><p>Organization-wide analytics and insights</p></div>
      </div>

      <div className="stats fu">
        <div className="stat" style={{ '--c':'var(--amber)','--c-bg':'var(--amber-soft)' }}>
          <div className="stat-ic"><span style={{ fontSize:18 }}>📊</span></div>
          <div className="stat-val">{projectStats.reduce((s,p) => s + p.value, 0)}</div>
          <div className="stat-lbl">Total Projects</div>
        </div>
        <div className="stat" style={{ '--c':'var(--red)','--c-bg':'rgba(239,68,68,.08)' }}>
          <div className="stat-ic"><span style={{ fontSize:18 }}>⚠️</span></div>
          <div className="stat-val">{overdue}</div>
          <div className="stat-lbl">Overdue Tasks</div>
        </div>
        <div className="stat" style={{ '--c':'var(--green)','--c-bg':'rgba(34,197,94,.08)' }}>
          <div className="stat-ic"><span style={{ fontSize:18 }}>🏆</span></div>
          <div className="stat-val">{topPerformers.length}</div>
          <div className="stat-lbl">Top Performers</div>
        </div>
        <div className="stat" style={{ '--c':'var(--blue)','--c-bg':'rgba(59,130,246,.08)' }}>
          <div className="stat-ic"><span style={{ fontSize:18 }}>✅</span></div>
          <div className="stat-val">{projectStats.find((s) => s.name === 'completed')?.value ?? 0}</div>
          <div className="stat-lbl">Completed Projects</div>
        </div>
      </div>

      <div className="dash-grid fu1">
        <div className="card">
          <div className="card-h"><span className="card-t">Projects by Status</span></div>
          <div className="card-b">
            {isLoading ? <div className="skel" style={{ height: 220 }} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={projectStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e24" />
                  <XAxis dataKey="name" tick={{ fill:'#55555f',fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis                tick={{ fill:'#55555f',fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'#1a1a1e',border:'1px solid #2c2c34',borderRadius:8,fontSize:12 }} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><span className="card-t">Top Performers</span></div>
          <div className="card-b">
            {topPerformers.length === 0 ? (
              <div className="empty"><span style={{ fontSize:40 }}>🏆</span><h3>No data yet</h3><p>Complete tasks to see top performers</p></div>
            ) : topPerformers.map((p, i) => (
              <div key={p.assigneeId} className="flex items-c gap-3" style={{ padding:'10px 0',borderBottom:'1px solid var(--border-dim)' }}>
                <div style={{ width:24,height:24,borderRadius:'50%',background:i===0?'var(--amber)':i===1?'#9090a0':'#cd7f32',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#000',flexShrink:0 }}>
                  {i + 1}
                </div>
                <div className="av av-sm">{p.assignee?.firstName?.[0]}{p.assignee?.lastName?.[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:600 }}>{p.assignee?.firstName} {p.assignee?.lastName}</div>
                </div>
                <div style={{ fontSize:13,color:'var(--green)',fontWeight:700,fontFamily:'JetBrains Mono,monospace' }}>
                  {p.dataValues?.completedTasks ?? 0} tasks
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
