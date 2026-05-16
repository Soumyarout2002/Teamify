import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Save, User, Lock, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI, usersAPI } from '../services/api'
import { useAuthStore } from '../store/auth'

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [tab, setTab] = useState('profile')

  const [profile, setProfile] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' })
  const [pwd,     setPwd]     = useState({ currentPassword: '', newPassword: '', confirm: '' })

  const setP  = (f) => (e) => setProfile((p) => ({ ...p, [f]: e.target.value }))
  const setPw = (f) => (e) => setPwd((p) => ({ ...p, [f]: e.target.value }))

  const saveProfile = useMutation({
    mutationFn: () => usersAPI.update(user.id, profile),
    onSuccess:  (res) => { updateUser(res.data.data); toast.success('Profile updated!') },
    onError:    () => toast.error('Failed to update profile'),
  })

  const savePwd = useMutation({
    mutationFn: () => {
      if (pwd.newPassword !== pwd.confirm) throw new Error('Passwords do not match')
      return authAPI.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
    },
    onSuccess: () => { setPwd({ currentPassword:'',newPassword:'',confirm:'' }); toast.success('Password changed!') },
    onError:   (err) => toast.error(err.message || err.response?.data?.message || 'Failed'),
  })

  const TABS = [
    { key:'profile',  label:'Profile',  icon:User },
    { key:'security', label:'Security', icon:Lock },
    { key:'notifs',   label:'Notifications', icon:Bell },
  ]

  return (
    <div>
      <div className="ph">
        <div><h1>Settings</h1><p>Manage your account and preferences</p></div>
      </div>

      <div className="flex gap-4" style={{ alignItems:'flex-start' }}>
        {/* Sidebar */}
        <div style={{ width:190,flexShrink:0 }}>
          <div className="card">
            <div style={{ padding:'8px 8px' }}>
              {TABS.map(({ key,label,icon:Icon }) => (
                <button key={key} className={`sb-item ${tab===key?'active':''}`} onClick={() => setTab(key)}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1,minWidth:0 }}>

          {/* Profile */}
          {tab === 'profile' && (
            <div className="card fu">
              <div className="card-h"><span className="card-t">Profile Information</span></div>
              <div className="card-b">
                <div className="flex items-c gap-4" style={{ marginBottom:22 }}>
                  <div className="av av-lg">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
                  <div>
                    <div style={{ fontSize:15,fontWeight:700 }}>{user?.firstName} {user?.lastName}</div>
                    <div className="txt-xs txt-muted">{user?.email}</div>
                    <div style={{ fontSize:12,color:'var(--amber)',marginTop:3 }}>{user?.role}</div>
                  </div>
                </div>
                <div className="divider" />
                <div className="grid-2">
                  <div className="fg"><label className="fl">First name</label><input className="fi" value={profile.firstName} onChange={setP('firstName')} /></div>
                  <div className="fg"><label className="fl">Last name</label><input className="fi" value={profile.lastName} onChange={setP('lastName')} /></div>
                </div>
                <div className="fg"><label className="fl">Email</label><input className="fi" value={user?.email ?? ''} disabled /><div className="fh">Email cannot be changed</div></div>
                <div className="fg"><label className="fl">Role</label><input className="fi" value={user?.role ?? ''} disabled /></div>
                <button className="btn btn-primary" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
                  <Save size={14} /> {saveProfile.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Security */}
          {tab === 'security' && (
            <div className="card fu">
              <div className="card-h"><span className="card-t">Change Password</span></div>
              <div className="card-b">
                <div className="fg"><label className="fl">Current password</label><input className="fi" type="password" value={pwd.currentPassword} onChange={setPw('currentPassword')} placeholder="Enter current password" /></div>
                <div className="fg"><label className="fl">New password</label><input className="fi" type="password" value={pwd.newPassword} onChange={setPw('newPassword')} placeholder="Min. 8 characters" /></div>
                <div className="fg">
                  <label className="fl">Confirm new password</label>
                  <input className="fi" type="password" value={pwd.confirm} onChange={setPw('confirm')} placeholder="Repeat new password" />
                  {pwd.confirm && pwd.newPassword !== pwd.confirm && <div className="fe">Passwords do not match</div>}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => savePwd.mutate()}
                  disabled={!pwd.currentPassword || !pwd.newPassword || pwd.newPassword !== pwd.confirm || savePwd.isPending}
                >
                  <Lock size={14} /> {savePwd.isPending ? 'Changing…' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifs' && (
            <div className="card fu">
              <div className="card-h"><span className="card-t">Notification Preferences</span></div>
              <div className="card-b">
                {[
                  { label:'Task assigned to me',      on:true  },
                  { label:'Task status updated',       on:true  },
                  { label:'Upcoming task deadlines',   on:true  },
                  { label:'Project updates',           on:false },
                  { label:'File uploads on my tasks',  on:false },
                  { label:'@Mentions',                 on:true  },
                ].map(({ label, on }) => (
                  <div key={label} className="flex items-c justify-b" style={{ padding:'12px 0',borderBottom:'1px solid var(--border-dim)' }}>
                    <div>
                      <div style={{ fontSize:13.5,fontWeight:500 }}>{label}</div>
                      <div className="txt-xs txt-muted">Email + in-app</div>
                    </div>
                    <div style={{ width:38,height:20,borderRadius:20,background:on?'var(--amber)':'var(--elevated)',border:'1px solid var(--border)',position:'relative',cursor:'pointer',flexShrink:0,transition:'background .2s' }}>
                      <div style={{ position:'absolute',width:14,height:14,borderRadius:'50%',background:'#fff',top:2,left:on?20:2,transition:'left .2s' }} />
                    </div>
                  </div>
                ))}
                <button className="btn btn-primary mt-4"><Save size={14} /> Save Preferences</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
