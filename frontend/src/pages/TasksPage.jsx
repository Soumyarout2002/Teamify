import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, List, LayoutGrid, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { tasksAPI, projectsAPI, usersAPI } from '../services/api'

const COLS = [
  { key: 'todo',        label: 'To Do',       color: '#9090a0' },
  { key: 'in_progress', label: 'In Progress',  color: '#3b82f6' },
  { key: 'in_review',   label: 'In Review',    color: '#f59e0b' },
  { key: 'done',        label: 'Done',         color: '#22c55e' },
]

function CreateModal({ onClose, projects, users }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title:'', description:'', projectId:'', status:'todo',
    priority:'medium', assigneeId:'', deadline:''
  })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const { mutate, isPending } = useMutation({
    mutationFn: (d) => tasksAPI.create(d),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task created!'); onClose() },
    onError:    (err) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fu">
        <div className="modal-h">
          <span className="modal-t">New Task</span>
          <button className="icon-btn" onClick={onClose}><X /></button>
        </div>
        <div className="modal-b">
          <div className="fg">
            <label className="fl">Title *</label>
            <input className="fi" placeholder="What needs to be done?" value={form.title} onChange={set('title')} />
          </div>
          <div className="fg">
            <label className="fl">Project *</label>
            <select className="fs" value={form.projectId} onChange={set('projectId')}>
              <option value="">Select a project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Description</label>
            <textarea className="fta" value={form.description} onChange={set('description')} />
          </div>
          <div className="grid-2">
            <div className="fg">
              <label className="fl">Status</label>
              <select className="fs" value={form.status} onChange={set('status')}>
                {COLS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Priority</label>
              <select className="fs" value={form.priority} onChange={set('priority')}>
                {['low','medium','high','critical'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="fg">
              <label className="fl">Assignee</label>
              <select className="fs" value={form.assigneeId} onChange={set('assigneeId')}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Deadline</label>
              <input className="fi" type="datetime-local" value={form.deadline} onChange={set('deadline')} />
            </div>
          </div>
        </div>
        <div className="modal-f">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => mutate(form)}
            disabled={!form.title || !form.projectId || isPending}
          >
            {isPending ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const qc = useQueryClient()
  const [view, setView]           = useState('kanban')
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter]       = useState({ projectId: '', assigneeId: '', priority: '' })

  const { data: tData, isLoading } = useQuery({ queryKey: ['tasks', filter],    queryFn: () => tasksAPI.list({ ...filter, limit: 300 }) })
  const { data: pData }            = useQuery({ queryKey: ['projects-list'],     queryFn: () => projectsAPI.list({ limit: 100 }) })
  const { data: uData }            = useQuery({ queryKey: ['users'],             queryFn: () => usersAPI.list() })

  const tasks    = tData?.data?.data?.tasks    ?? []
  const projects = pData?.data?.data?.projects ?? []
  const users    = uData?.data?.data?.users    ?? []

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => tasksAPI.update(id, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
  const deleteTask = useMutation({
    mutationFn: (id) => tasksAPI.delete(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task deleted') },
  })

  const colTasks = (key) => tasks.filter((t) => t.status === key)

  return (
    <div>
      {showModal && <CreateModal onClose={() => setShowModal(false)} projects={projects} users={users} />}

      <div className="ph">
        <div>
          <h1>Tasks</h1>
          <p>{tasks.length} task{tasks.length !== 1 ? 's' : ''} across all projects</p>
        </div>
        <div className="ph-right">
          <div className="flex gap-2">
            <button className={`btn btn-secondary btn-sm ${view === 'list'   ? 'active' : ''}`} onClick={() => setView('list')}>
              <List size={13} /> List
            </button>
            <button className={`btn btn-secondary btn-sm ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>
              <LayoutGrid size={13} /> Board
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus /> New Task</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="fs" style={{ width: 180 }} value={filter.projectId}  onChange={(e) => setFilter((f) => ({ ...f, projectId: e.target.value }))}>
          <option value="">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="fs" style={{ width: 160 }} value={filter.assigneeId} onChange={(e) => setFilter((f) => ({ ...f, assigneeId: e.target.value }))}>
          <option value="">All assignees</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
        </select>
        <select className="fs" style={{ width: 140 }} value={filter.priority}   onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">All priorities</option>
          {['low','medium','high','critical'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="kanban">{COLS.map((c) => <div key={c.key} className="skel" style={{ minWidth: 272, height: 400 }} />)}</div>
      ) : view === 'kanban' ? (
        <div className="kanban">
          {COLS.map((col) => (
            <div key={col.key} className="kb-col">
              <div className="kb-col-h">
                <div className="kb-col-t">
                  <span className="kb-dot" style={{ background: col.color }} />
                  {col.label}
                </div>
                <span className="kb-cnt">{colTasks(col.key).length}</span>
              </div>
              <div className="kb-cards">
                {colTasks(col.key).map((t) => (
                  <div key={t.id} className="task-card">
                    <div className="task-card-t">{t.title}</div>
                    <div className="task-card-m">
                      <span className={`badge b-${t.priority}`}>{t.priority}</span>
                      {t.assignee && (
                        <div className="av av-sm" title={`${t.assignee.firstName} ${t.assignee.lastName}`}>
                          {t.assignee.firstName?.[0]}{t.assignee.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    {t.deadline && <div className="txt-xs txt-muted mt-2">Due: {new Date(t.deadline).toLocaleDateString()}</div>}
                    <div className="flex gap-2 mt-2">
                      {COLS.filter((c) => c.key !== t.status).slice(0, 2).map((c) => (
                        <button
                          key={c.key}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 10, padding: '2px 7px' }}
                          onClick={() => updateTask.mutate({ id: t.id, data: { ...t, status: c.key } })}
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'center', marginTop: 4 }} onClick={() => setShowModal(true)}>
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tbl-wrap fu">
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Project</th><th>Status</th><th>Priority</th>
                <th>Assignee</th><th>Deadline</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--txt-3)' }}>No tasks found</td></tr>
              ) : tasks.map((t) => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--txt)', fontWeight: 500 }}>{t.title}</td>
                  <td>{projects.find((p) => p.id === t.projectId)?.name ?? '—'}</td>
                  <td><span className={`badge b-${t.status}`}>{t.status?.replace('_', ' ')}</span></td>
                  <td><span className={`badge b-${t.priority}`}>{t.priority}</span></td>
                  <td>{t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : <span className="txt-muted">—</span>}</td>
                  <td>{t.deadline ? new Date(t.deadline).toLocaleDateString() : <span className="txt-muted">—</span>}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteTask.mutate(t.id)}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
