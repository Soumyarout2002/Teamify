// frontend/src/pages/TeamPage.jsx
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserPlus, Shield, X } from 'lucide-react'
import { usersAPI } from '../services/api'

function InviteModal({ onClose }) {
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fu">
        <div className="modal-h"><span className="modal-t">Invite Member</span><button className="icon-btn" onClick={onClose}><X /></button></div>
        <div className="modal-b">
          <div className="grid-2">
            <div className="fg"><label className="fl">First name</label><input className="fi" placeholder="John" /></div>
            <div className="fg"><label className="fl">Last name</label><input className="fi" placeholder="Doe" /></div>
          </div>
          <div className="fg"><label className="fl">Email</label><input className="fi" type="email" placeholder="john@company.com" /></div>
          <div className="fg"><label className="fl">Role</label>
            <select className="fs">
              {['Admin','Project Manager','Team Member'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="fh">Invitation email will be sent via your configured SMTP</div>
        </div>
        <div className="modal-f">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Send Invite</button>
        </div>
      </div>
    </div>
  )
}

export default function TeamPage() {
  const [showInvite, setShowInvite] = useState(false)
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => usersAPI.list() })
  const users = data?.data?.data?.users ?? []

  const roleColor = (r) => r === 'Admin' ? 'var(--amber)' : r === 'Project Manager' ? 'var(--blue)' : 'var(--txt-2)'

  return (
    <div>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      <div className="ph">
        <div><h1>Team</h1><p>{users.length} members in your workspace</p></div>
        <div className="ph-right">
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}><UserPlus /> Invite Member</button>
        </div>
      </div>
      {isLoading ? (
        <div className="grid-3">{[1,2,3,4,5,6].map((i) => <div key={i} className="skel" style={{ height: 110 }} />)}</div>
      ) : users.length === 0 ? (
        <div className="empty"><UserPlus /><h3>No team members yet</h3><p>Invite your first team member to get started</p></div>
      ) : (
        <div className="grid-3 fu">
          {users.map((u) => (
            <div key={u.id} className="card">
              <div className="card-b flex items-c gap-3">
                <div className="av av-lg">{u.firstName?.[0]}{u.lastName?.[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{u.firstName} {u.lastName}</div>
                  <div style={{ fontSize: 12, color: roleColor(u.role), marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Shield size={11} /> {u.role}
                  </div>
                  <div className="txt-xs txt-muted mt-2 truncate">{u.email}</div>
                </div>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: u.isActive ? 'var(--green)' : 'var(--txt-3)', flexShrink: 0 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
