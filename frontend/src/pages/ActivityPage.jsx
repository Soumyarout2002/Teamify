import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import { activityAPI } from '../services/api'
import { format } from 'date-fns'

export default function ActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn:  () => activityAPI.list({ limit: 50 }),
  })
  const logs = data?.data?.data?.logs ?? []

  const actionColor = (a) => {
    if (!a) return 'var(--txt-3)'
    if (a.includes('created'))   return 'var(--green)'
    if (a.includes('deleted'))   return 'var(--red)'
    if (a.includes('updated'))   return 'var(--blue)'
    return 'var(--txt-3)'
  }

  return (
    <div>
      <div className="ph">
        <div><h1>Activity Log</h1><p>All actions across your workspace</p></div>
      </div>

      {isLoading ? (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {[1,2,3,4,5].map((i) => <div key={i} className="skel" style={{ height:52 }} />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="empty">
          <Activity />
          <h3>No activity yet</h3>
          <p>Actions will appear here as your team works</p>
        </div>
      ) : (
        <div className="card fu">
          <div className="card-b" style={{ padding:0 }}>
            {logs.map((l, i) => (
              <div key={l._id ?? i} style={{ display:'flex',alignItems:'flex-start',gap:14,padding:'13px 20px',borderBottom:'1px solid var(--border-dim)' }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:actionColor(l.action),marginTop:5,flexShrink:0 }} />
                <div style={{ flex:1,minWidth:0 }}>
                  <div className="flex items-c gap-3 flex-wrap">
                    <span style={{ fontSize:13.5,fontWeight:600,color:'var(--txt)' }}>{l.userEmail ?? 'Unknown'}</span>
                    <span style={{ fontSize:12.5,color:'var(--txt-2)' }}>{l.action?.replace(/\./g,' ')}</span>
                    {l.resourceType && (
                      <span style={{ fontSize:11,color:'var(--txt-3)',background:'var(--elevated)',padding:'2px 7px',borderRadius:4,fontFamily:'JetBrains Mono,monospace' }}>
                        {l.resourceType}
                      </span>
                    )}
                  </div>
                  {l.createdAt && (
                    <div style={{ fontSize:11,color:'var(--txt-3)',marginTop:3,fontFamily:'JetBrains Mono,monospace' }}>
                      {format(new Date(l.createdAt), 'MMM d, yyyy HH:mm')}
                      {l.ipAddress ? ` · ${l.ipAddress}` : ''}
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
