import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, X, Trash2, Paperclip, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsAPI, tasksAPI, filesAPI, usersAPI } from '../services/api'

const STATUSES  = ['planning','active','on_hold','completed','cancelled']
const PRIOS     = ['low','medium','high','critical']
const TSTATUSES = ['todo','in_progress','in_review','done','cancelled']

function AddTaskModal({ projectId, users, onClose }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ title:'', description:'', status:'todo', priority:'medium', assigneeId:'', deadline:'', projectId })
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  const { mutate, isPending } = useMutation({
    mutationFn: (d) => tasksAPI.create(d),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['proj-tasks', projectId] }); toast.success('Task created!'); onClose() },
    onError:    (err) => toast.error(err.response?.data?.message ?? 'Failed'),
  })
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fu">
        <div className="modal-h"><span className="modal-t">Add Task</span><button className="icon-btn" onClick={onClose}><X /></button></div>
        <div className="modal-b">
          <div className="fg"><label className="fl">Title *</label><input className="fi" value={f.title} onChange={set('title')} /></div>
          <div className="fg"><label className="fl">Description</label><textarea className="fta" value={f.description} onChange={set('description')} /></div>
          <div className="grid-2">
            <div className="fg"><label className="fl">Status</label>
              <select className="fs" value={f.status} onChange={set('status')}>
                {TSTATUSES.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Priority</label>
              <select className="fs" value={f.priority} onChange={set('priority')}>
                {PRIOS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="fg"><label className="fl">Assignee</label>
              <select className="fs" value={f.assigneeId} onChange={set('assigneeId')}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Deadline</label>
              <input className="fi" type="datetime-local" value={f.deadline} onChange={set('deadline')} />
            </div>
          </div>
        </div>
        <div className="modal-f">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutate(f)} disabled={!f.title || isPending}>
            {isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddMemberModal({ projectId, onClose }) {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['users'], queryFn: () => usersAPI.list() })
  const users = data?.data?.data?.users ?? []
  const [userId, setUserId] = useState('')
  const [role,   setRole]   = useState('member')
  const { mutate, isPending } = useMutation({
    mutationFn: () => projectsAPI.addMember(projectId, { userId, role }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['project', projectId] }); toast.success('Member added!'); onClose() },
    onError:    (err) => toast.error(err.response?.data?.message ?? 'Failed'),
  })
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fu">
        <div className="modal-h"><span className="modal-t">Add Member</span><button className="icon-btn" onClick={onClose}><X /></button></div>
        <div className="modal-b">
          <div className="fg"><label className="fl">User</label>
            <select className="fs" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Select user…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
            </select>
          </div>
          <div className="fg"><label className="fl">Role</label>
            <select className="fs" value={role} onChange={(e) => setRole(e.target.value)}>
              {['owner','manager','member','viewer'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-f">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutate()} disabled={!userId || isPending}>
            {isPending ? 'Adding…' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab,           setTab]           = useState('Overview')
  const [showAddTask,   setShowAddTask]   = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  const { data: projData, isLoading } = useQuery({ queryKey: ['project', id],        queryFn: () => projectsAPI.get(id) })
  const { data: taskData }            = useQuery({ queryKey: ['proj-tasks', id],      queryFn: () => tasksAPI.list({ projectId: id, limit: 200 }) })
  const { data: fileData }            = useQuery({ queryKey: ['proj-files', id],      queryFn: () => filesAPI.list({ projectId: id }) })
  const { data: usersData }           = useQuery({ queryKey: ['users'],               queryFn: () => usersAPI.list() })

  const project = projData?.data?.data
  const tasks   = taskData?.data?.data?.tasks ?? []
  const files   = fileData?.data?.data ?? []
  const users   = usersData?.data?.data?.users ?? []
  const members = project?.members ?? []

  const updProj = useMutation({
    mutationFn: (d) => projectsAPI.update(id, d),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['project', id] }); toast.success('Saved') },
  })
  const delProj = useMutation({
    mutationFn: () => projectsAPI.delete(id),
    onSuccess:  () => { navigate('/projects'); toast.success('Project deleted') },
  })
  const updTask = useMutation({
    mutationFn: ({ tid, data }) => tasksAPI.update(tid, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['proj-tasks', id] }),
  })
  const delTask = useMutation({
    mutationFn: (tid) => tasksAPI.delete(tid),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['proj-tasks', id] }); toast.success('Task deleted') },
  })
  const remMember = useMutation({
    mutationFn: (uid) => projectsAPI.removeMember(id, uid),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['project', id] }); toast.success('Member removed') },
  })
  const delFile = useMutation({
    mutationFn: (fid) => filesAPI.delete(fid),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['proj-files', id] }); toast.success('File deleted') },
  })

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('projectId', id)
    try { await filesAPI.upload(fd); qc.invalidateQueries({ queryKey: ['proj-files', id] }); toast.success('Uploaded!') }
    catch { toast.error('Upload failed') }
  }

  const taskStats = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    in_review: tasks.filter((t) => t.status === 'in_review').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }
  const rate = tasks.length ? Math.round((taskStats.done / tasks.length) * 100) : 0

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map((i) => <div key={i} className="skel" style={{ height: 80 }} />)}</div>
  if (!project) return <div className="empty"><h3>Project not found</h3><button className="btn btn-primary mt-4" onClick={() => navigate('/projects')}>Back</button></div>

  return (
    <div>
      {showAddTask   && <AddTaskModal   projectId={id} users={users} onClose={() => setShowAddTask(false)} />}
      {showAddMember && <AddMemberModal projectId={id} onClose={() => setShowAddMember(false)} />}

      {/* Header */}
      <div className="ph">
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }} onClick={() => navigate('/projects')}>
            <ArrowLeft size={13} /> Back
          </button>
          <h1>{project.name}</h1>
          <div className="flex items-c gap-3 mt-2 flex-wrap">
            <span className={`badge b-${project.status}`}>{project.status?.replace('_', ' ')}</span>
            <span className={`badge b-${project.priority}`}>{project.priority}</span>
            {project.deadline && <span className="txt-xs txt-muted">Due: {new Date(project.deadline).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="ph-right">
          <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete this project?') && delProj.mutate()}>
            <Trash2 size={13} /> Delete
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddTask(true)}><Plus /> Add Task</button>
        </div>
      </div>

      {/* Progress */}
      <div className="card fu" style={{ marginBottom: 18 }}>
        <div className="card-b">
          <div className="flex items-c justify-b mb-4" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Overall Progress</span>
            <span className="txt-xs txt-amber">{rate}%</span>
          </div>
          <div className="prog" style={{ height: 8 }}><div className="prog-fill" style={{ width: `${rate}%` }} /></div>
          <div className="flex gap-4 mt-2 flex-wrap">
            {Object.entries(taskStats).map(([k, v]) => (
              <div key={k} className="flex items-c gap-2">
                <span className={`badge b-${k}`} style={{ fontSize: 10 }}>{k.replace('_', ' ')}</span>
                <span className="txt-xs txt-muted">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['Overview','Tasks','Members','Files'].map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div className="dash-grid fu">
          <div className="card">
            <div className="card-h"><span className="card-t">Project Details</span></div>
            <div className="card-b">
              <div className="fg">
                <label className="fl">Description</label>
                <textarea className="fta" defaultValue={project.description ?? ''} style={{ minHeight: 80 }}
                  onBlur={(e) => updProj.mutate({ ...project, description: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="fg"><label className="fl">Status</label>
                  <select className="fs" value={project.status} onChange={(e) => updProj.mutate({ ...project, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="fg"><label className="fl">Priority</label>
                  <select className="fs" value={project.priority} onChange={(e) => updProj.mutate({ ...project, priority: e.target.value })}>
                    {PRIOS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="fg"><label className="fl">Start</label>
                  <input className="fi" type="date" defaultValue={project.startDate ?? ''}
                    onBlur={(e) => updProj.mutate({ ...project, startDate: e.target.value })} />
                </div>
                <div className="fg"><label className="fl">Deadline</label>
                  <input className="fi" type="date" defaultValue={project.deadline ?? ''}
                    onBlur={(e) => updProj.mutate({ ...project, deadline: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-h"><span className="card-t">Task Summary</span></div>
            <div className="card-b">
              {[['To Do', taskStats.todo,'var(--txt-2)'],['In Progress',taskStats.in_progress,'var(--blue)'],['In Review',taskStats.in_review,'var(--amber)'],['Done',taskStats.done,'var(--green)'],['Total',tasks.length,'var(--txt)']].map(([l,v,c]) => (
                <div key={l} className="flex items-c justify-b" style={{ padding:'10px 0',borderBottom:'1px solid var(--border-dim)' }}>
                  <span style={{ fontSize:13,color:'var(--txt-2)' }}>{l}</span>
                  <span style={{ fontSize:20,fontWeight:800,color:c,fontFamily:'JetBrains Mono,monospace' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tasks */}
      {tab === 'Tasks' && (
        <div className="fu">
          <div className="flex justify-e mb-4"><button className="btn btn-primary" onClick={() => setShowAddTask(true)}><Plus /> Add Task</button></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Deadline</th><th></th></tr></thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign:'center',padding:40,color:'var(--txt-3)' }}>No tasks yet</td></tr>
                ) : tasks.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color:'var(--txt)',fontWeight:500 }}>{t.title}</td>
                    <td>
                      <select value={t.status}
                        onChange={(e) => updTask.mutate({ tid: t.id, data: { ...t, status: e.target.value } })}
                        style={{ background:'var(--elevated)',border:'1px solid var(--border)',color:'var(--txt)',padding:'3px 7px',borderRadius:6,fontSize:12,cursor:'pointer' }}>
                        {TSTATUSES.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                      </select>
                    </td>
                    <td><span className={`badge b-${t.priority}`}>{t.priority}</span></td>
                    <td>{t.assignee ? <div className="flex items-c gap-2"><div className="av av-sm">{t.assignee.firstName?.[0]}{t.assignee.lastName?.[0]}</div><span style={{ fontSize:12.5 }}>{t.assignee.firstName} {t.assignee.lastName}</span></div> : <span className="txt-muted">—</span>}</td>
                    <td style={{ fontSize:12.5 }}>{t.deadline ? new Date(t.deadline).toLocaleDateString() : <span className="txt-muted">—</span>}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => delTask.mutate(t.id)}><Trash2 size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Members */}
      {tab === 'Members' && (
        <div className="fu">
          <div className="flex justify-e mb-4"><button className="btn btn-primary" onClick={() => setShowAddMember(true)}><Users size={14} /> Add Member</button></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Member</th><th>Email</th><th>Role</th><th></th></tr></thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign:'center',padding:40,color:'var(--txt-3)' }}>No members yet</td></tr>
                ) : members.map((m) => (
                  <tr key={m.id}>
                    <td><div className="flex items-c gap-3"><div className="av av-sm">{m.User?.firstName?.[0]}{m.User?.lastName?.[0]}</div><span style={{ color:'var(--txt)',fontWeight:500 }}>{m.User?.firstName} {m.User?.lastName}</span></div></td>
                    <td style={{ fontSize:12.5 }}>{m.User?.email}</td>
                    <td><span className={`badge b-${m.role}`}>{m.role}</span></td>
                    <td>{m.role !== 'owner' && <button className="btn btn-danger btn-sm" onClick={() => remMember.mutate(m.userId)}>Remove</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Files */}
      {tab === 'Files' && (
        <div className="fu">
          <div className="flex justify-e mb-4">
            <label className="btn btn-primary" style={{ cursor:'pointer' }}>
              <Paperclip size={14} /> Upload File
              <input type="file" style={{ display:'none' }} onChange={handleUpload} />
            </label>
          </div>
          {files.length === 0 ? (
            <div className="empty"><Paperclip /><h3>No files yet</h3><p>Upload files related to this project</p></div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.id}>
                      <td style={{ color:'var(--txt)',fontWeight:500 }}>{f.originalName}</td>
                      <td><span className="txt-xs txt-muted" style={{ background:'var(--elevated)',padding:'2px 7px',borderRadius:4 }}>{f.mimeType?.split('/')[1] ?? f.mimeType}</span></td>
                      <td style={{ fontSize:12.5 }}>{(Number(f.size)/1024).toFixed(1)} KB</td>
                      <td style={{ fontSize:12.5 }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <a href={f.s3Url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Download</a>
                          <button className="btn btn-danger btn-sm" onClick={() => delFile.mutate(f.id)}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
