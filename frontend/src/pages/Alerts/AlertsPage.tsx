import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCircle, X, Filter, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { formatDistanceToNow } from 'date-fns'

const SEVERITY_CONFIG: Record<string, { class: string; color: string; icon: string }> = {
  critical: { class: 'danger', color: '#f43f5e', icon: '🔴' },
  high:     { class: 'warning', color: '#f97316', icon: '🟠' },
  medium:   { class: 'warning', color: '#f59e0b', icon: '🟡' },
  low:      { class: 'info', color: '#22d3ee', icon: '🔵' },
}

const TYPES = ['speeding', 'geofence', 'fuel_low', 'engine_fault', 'offline', 'congestion', 'accident']
const SEVERITIES = ['low', 'medium', 'high', 'critical']

export default function AlertsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('open')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ vehicleId: '', type: 'speeding', severity: 'medium', message: '', zone: '' })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['alerts', severityFilter, statusFilter],
    queryFn: () => api.get('/alerts', { params: { severity: severityFilter || undefined, status: statusFilter || undefined, limit: 100 } }).then(r => r.data),
    refetchInterval: 8000,
  })

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => api.put(`/alerts/${id}/acknowledge`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); toast.success('Alert acknowledged') },
  })

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/alerts/${id}/resolve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); toast.success('Alert resolved') },
  })

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/alerts', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alert created')
      setShowCreate(false)
      setForm({ vehicleId: '', type: 'speeding', severity: 'medium', message: '', zone: '' })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const alerts = data?.alerts || []
  const canEdit = user?.role === 'Admin' || user?.role === 'Operator'

  const stats = {
    open: alerts.filter((a: any) => a.status === 'open').length,
    critical: alerts.filter((a: any) => a.severity === 'critical').length,
    acknowledged: alerts.filter((a: any) => a.status === 'acknowledged').length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">Real-time fleet alerts and incident management</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>↻ Refresh</button>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Bell size={15} /> Create Alert
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="kpi-grid mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Open Alerts', value: stats.open, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
          { label: 'Critical', value: stats.critical, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { label: 'Acknowledged', value: stats.acknowledged, color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex items-center gap-3 mb-4" style={{ padding: '0.875rem 1.25rem', flexWrap: 'wrap' }}>
        <Filter size={14} color="var(--text-muted)" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
          <option value="">All Severity</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isLoading ? 'Loading...' : `${alerts.length} alerts`}
        </span>
      </div>

      {/* Alerts List */}
      <div className="flex-col gap-3">
        {alerts.length === 0 && !isLoading && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <CheckCircle size={36} style={{ margin: '0 auto 0.75rem', color: '#22d3ee' }} />
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>No alerts found</div>
            <p style={{ fontSize: '0.875rem' }}>Everything looks good! No {statusFilter || 'active'} alerts.</p>
          </div>
        )}

        {alerts.map((alert: any) => {
          const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low
          return (
            <div key={alert.alertId} className={`card alert-${alert.severity}`} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.5rem', flexShrink: 0, marginTop: 2 }}>{cfg.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1" style={{ flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{alert.type?.replace(/_/g, ' ')}</span>
                  <span className={`badge badge-${cfg.class}`}>{alert.severity}</span>
                  <span className={`badge badge-${alert.status === 'open' ? 'danger' : alert.status === 'acknowledged' ? 'warning' : 'neutral'}`}>{alert.status}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{alert.message}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Vehicle: {alert.vehicleId?.slice(0, 8)}...</span>
                  {alert.zone && <span>Zone: {alert.zone}</span>}
                  <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              {canEdit && alert.status === 'open' && (
                <div className="flex gap-2" style={{ flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => acknowledgeMutation.mutate(alert.alertId)}>Ack</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => resolveMutation.mutate(alert.alertId)}>
                    <X size={14} /> Resolve
                  </button>
                </div>
              )}
              {canEdit && alert.status === 'acknowledged' && (
                <button className="btn btn-ghost btn-sm" onClick={() => resolveMutation.mutate(alert.alertId)} style={{ flexShrink: 0 }}>
                  <CheckCircle size={14} /> Resolve
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Create Alert Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Create Alert</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Vehicle ID</label>
                <input value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} placeholder="vehicle-uuid" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Severity</label>
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Zone</label>
                <input value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} placeholder="Downtown" />
              </div>
              <div className="form-group">
                <label>Message</label>
                <input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Alert description..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => createMutation.mutate(form)}>Create Alert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
