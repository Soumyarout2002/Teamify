import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsAPI } from '../services/api'

const STATUSES   = ['planning','active','on_hold','completed','cancelled']
const PRIORITIES = ['low','medium','high','critical']

function Modal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name:'', description:'', status:'planning', priority:'medium', deadline:'' })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const { mutate, isPending } = useMutation({
    mutationFn: (d) => projectsAPI.create(d),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project created!'); onClose() },
    onError:    (err) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fu">
        <div className="modal-h">
          <span className="modal-t">New Project</span>
          <button className="icon-btn" onClick={onClose}><X /></button>
        </div>
        <div className="modal-b">
          <div className="fg">
            <label className="fl">Project name *</label>
            <input className="fi" placeholder="e.g. Website Redesign" value={form.name} onChange={set('name')} />
          </div>
          <div className="fg">
            <label className="fl">Description</label>
            <textarea className="fta" placeholder="What is this project about?" value={form.description} onChange={set('description')} />
          </div>
          <div className="grid-2">
            <div className="fg">
              <label className="fl">Status</label>
              <select className="fs" value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Priority</label>
              <select className="fs" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="fg">
            <label className="fl">Deadline</label>
            <input className="fi" type="date" value={form.deadline} onChange={set('deadline')} />
          </div>
        </div>
        <div className="modal-f">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutate(form)} disabled={!form.name || isPending}>
            {isPending ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState({ status: '', search: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['projects', filter],
    queryFn:  () => projectsAPI.list(filter),
  })
  const projects = data?.data?.data?.projects ?? []

  return (
    <div>
      {showModal && <Modal onClose={() => setShowModal(false)} />}

      <div className="ph">
        <div>
          <h1>Projects</h1>
          <p>{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus /> New Project</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="search" style={{ width: 230 }}>
          <Search />
          <input placeholder="Search projects…" value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <select className="fs" style={{ width: 160 }} value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid-3">{[1,2,3,4,5,6].map((i) => <div key={i} className="skel" style={{ height: 165 }} />)}</div>
      ) : projects.length === 0 ? (
        <div className="empty">
          <FolderKanban />
          <h3>No projects found</h3>
          <p>Create your first project or adjust the filters</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowModal(true)}><Plus /> Create Project</button>
        </div>
      ) : (
        <div className="grid-3 fu">
          {projects.map((p) => (
            <div key={p.id} className="card" style={{ cursor: 'pointer', padding: 0 }} onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-dim)' }}>
                <div className="flex items-c gap-3 justify-b">
                  <div className="flex items-c gap-3">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--amber-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)', flexShrink: 0 }}>
                      <FolderKanban size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{p.name}</div>
                      <span className={`badge b-${p.priority}`}>{p.priority}</span>
                    </div>
                  </div>
                  <span className={`badge b-${p.status}`}>{p.status?.replace('_', ' ')}</span>
                </div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: 12.5, color: 'var(--txt-2)', marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {p.description || 'No description'}
                </div>
                <div className="flex items-c justify-b mb-4" style={{ marginBottom: 6 }}>
                  <span className="txt-xs txt-muted">Progress</span>
                  <span className="txt-xs txt-amber">{p.progress ?? 0}%</span>
                </div>
                <div className="prog"><div className="prog-fill" style={{ width: `${p.progress ?? 0}%` }} /></div>
                {p.deadline && <div className="txt-xs txt-muted mt-2">Due: {new Date(p.deadline).toLocaleDateString()}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
