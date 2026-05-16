import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { notificationsAPI } from '../services/api'
import { format } from 'date-fns'

const ICONS = {
  task_assigned:'📋', task_updated:'✏️', task_completed:'✅',
  task_deadline:'⏰', project_update:'📁', mention:'💬', file_uploaded:'📎'
}

export default function NotificationsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsAPI.list() })
  const notifications = data?.data?.data?.notifications ?? []
  const unread        = data?.data?.data?.unreadCount   ?? 0

  const markAll = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read') },
  })
  const markOne = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div>
      <div className="ph">
        <div><h1>Notifications</h1><p>{unread} unread notification{unread !== 1 ? 's' : ''}</p></div>
        <div className="ph-right">
          {unread > 0 && (
            <button className="btn btn-secondary" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {[1,2,3,4,5].map((i) => <div key={i} className="skel" style={{ height:64 }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty">
          <Bell />
          <h3>No notifications</h3>
          <p>You're all caught up! Notifications will appear here when there's activity.</p>
        </div>
      ) : (
        <div className="card fu">
          <div className="card-b" style={{ padding:0 }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{ display:'flex',alignItems:'flex-start',gap:14,padding:'13px 20px',borderBottom:'1px solid var(--border-dim)',background:!n.isRead?'rgba(245,158,11,.04)':'transparent',cursor:'pointer',transition:'background .15s' }}
                onClick={() => !n.isRead && markOne.mutate(n.id)}
              >
                <div style={{ width:36,height:36,borderRadius:8,background:'var(--elevated)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0 }}>
                  {ICONS[n.type] ?? '🔔'}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div className="flex items-c justify-b gap-3">
                    <span style={{ fontSize:13.5,fontWeight:n.isRead?500:700,color:'var(--txt)' }}>{n.title}</span>
                    {!n.isRead && <span style={{ width:7,height:7,borderRadius:'50%',background:'var(--amber)',flexShrink:0 }} />}
                  </div>
                  <div style={{ fontSize:12.5,color:'var(--txt-2)',marginTop:3 }}>{n.message}</div>
                  {n.createdAt && (
                    <div style={{ fontSize:11,color:'var(--txt-3)',marginTop:4,fontFamily:'JetBrains Mono,monospace' }}>
                      {format(new Date(n.createdAt), 'MMM d, yyyy HH:mm')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
