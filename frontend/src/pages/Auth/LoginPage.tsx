import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Radio, Eye, EyeOff, ArrowRight, Shield, Zap, Globe } from 'lucide-react'

const DEMO_CREDENTIALS = [
  { email: 'admin@urbanmove.io', password: 'Admin@123', role: 'Admin', color: '#f43f5e' },
  { email: 'operator@urbanmove.io', password: 'Operator@123', role: 'Operator', color: '#38bdf8' },
  { email: 'viewer@urbanmove.io', password: 'Viewer@123', role: 'Viewer', color: '#a78bfa' },
]

const features = [
  { icon: Zap, title: 'Real-time Tracking', desc: 'Live GPS telemetry for your entire fleet' },
  { icon: Globe, title: 'Route Intelligence', desc: 'AI-powered route recommendations' },
  { icon: Shield, title: 'Secure by Design', desc: 'Zero-trust architecture on AWS' },
]

export default function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setEmail(cred.email)
    setPassword(cred.password)
  }

  return (
    <div className="login-page">
      {/* Left Panel */}
      <div className="login-left">
        <div style={{ maxWidth: 440 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="logo-icon" style={{ width: 48, height: 48, fontSize: '1.4rem', borderRadius: 12 }}>
              <Radio size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>UrbanMove</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500 }}>SMART MOBILITY PLATFORM</div>
            </div>
          </div>

          <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem', lineHeight: 1.2 }}>
            Intelligent Fleet<br />
            <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Management
            </span>
          </h1>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
            Cloud-native platform for real-time fleet supervision, intelligent routing,
            and predictive analytics for smart cities.
          </p>

          <div className="flex-col gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, background: 'rgba(56,189,248,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(56,189,248,0.05)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Quick Demo Access
            </div>
            <div className="flex-col gap-2">
              {DEMO_CREDENTIALS.map(cred => (
                <button key={cred.role} onClick={() => fillDemo(cred)} className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: cred.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{cred.email}</span>
                  <span style={{ marginLeft: 'auto', color: cred.color, fontSize: '0.7rem' }}>{cred.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel – Login Form */}
      <div className="login-right">
        <div className="login-card">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '0.25rem' }}>Sign in to your account</h2>
            <p style={{ fontSize: '0.875rem' }}>Access your fleet management dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="flex-col gap-4">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@urbanmove.io"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            UrbanMove Fleet Platform · Cloud Native · AWS Powered
          </p>
        </div>
      </div>
    </div>
  )
}
