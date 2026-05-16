import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', organizationName: ''
  })
  const [loading, setLoading] = useState(false)

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const submit = async (ev) => {
    ev.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.register(form)
      setAuth(data.data.user, data.data.token)
      toast.success('Workspace created! Welcome to Teamify 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card fu" style={{ maxWidth: 460 }}>
        <div className="auth-mark">T</div>
        <h1>Create your workspace</h1>
        <p className="sub">Get your team organized in minutes</p>

        <form onSubmit={submit} noValidate>
          <div className="grid-2">
            <div className="fg fu1">
              <label className="fl">First name</label>
              <input className="fi" placeholder="John" value={form.firstName} onChange={set('firstName')} required />
            </div>
            <div className="fg fu1">
              <label className="fl">Last name</label>
              <input className="fi" placeholder="Doe" value={form.lastName} onChange={set('lastName')} required />
            </div>
          </div>

          <div className="fg fu2">
            <label className="fl">Work email</label>
            <input className="fi" type="email" placeholder="john@company.com" value={form.email} onChange={set('email')} required />
          </div>

          <div className="fg fu3">
            <label className="fl">Organization name</label>
            <input className="fi" placeholder="Acme Inc." value={form.organizationName} onChange={set('organizationName')} required />
            <div className="fh">This will be your workspace name</div>
          </div>

          <div className="fg fu4">
            <label className="fl">Password</label>
            <input className="fi" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
          </div>

          <button
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center' }}
            disabled={loading || !form.firstName || !form.lastName || !form.email || !form.password || !form.organizationName}
          >
            {loading ? <><Loader size={14} className="spin" /> Creating…</> : 'Create workspace'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--txt-2)' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
