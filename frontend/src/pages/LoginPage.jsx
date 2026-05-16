import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      setAuth(data.data.user, data.data.token)
      toast.success(`Welcome back, ${data.data.user.firstName}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card fu">
        <div className="auth-mark">T</div>
        <h1>Welcome back</h1>
        <p className="sub">Sign in to your Teamify workspace</p>

        <form onSubmit={submit} noValidate>
          <div className="fg fu1">
            <label className="fl">Email address</label>
            <input
              className="fi"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
            {errors.email && <div className="fe">{errors.email}</div>}
          </div>

          <div className="fg fu2">
            <label className="fl">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="fi"
                type={show ? 'text' : 'password'}
                placeholder="Your password"
                value={form.password}
                onChange={set('password')}
                style={{ paddingRight: 40 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--txt-3)', display: 'flex', cursor: 'pointer' }}
                onClick={() => setShow((s) => !s)}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <div className="fe">{errors.password}</div>}
          </div>

          <button
            className="btn btn-primary w-full fu3"
            style={{ justifyContent: 'center', marginBottom: 12 }}
            disabled={loading}
          >
            {loading ? <><Loader size={14} className="spin" /> Signing in…</> : 'Sign in'}
          </button>
        </form>

        <button
          className="btn btn-secondary w-full fu4"
          style={{ justifyContent: 'center' }}
          onClick={() => setForm({ email: 'demo@teamify.com', password: 'demo1234' })}
        >
          Fill demo credentials
        </button>

        <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--txt-2)' }}>
          No account?{' '}
          <Link to="/register" className="auth-link">Create workspace</Link>
        </p>
      </div>
    </div>
  )
}
