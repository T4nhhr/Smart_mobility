import { useQuery } from '@tanstack/react-query'
import { Car, Zap, Bell, TrendingUp, Activity, MapPin } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../services/api'

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const createVehicleIcon = (speed: number, status: string) => {
  const color = status !== 'active' ? '#475569' : speed > 60 ? '#f43f5e' : speed > 30 ? '#f59e0b' : '#22d3ee'
  return L.divIcon({
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 8px ${color}"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    className: '',
  })
}

export default function DashboardPage() {
  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => api.get('/analytics/summary').then(r => r.data),
    refetchInterval: 15000,
  })

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-map'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
    refetchInterval: 5000,
  })

  const { data: alertsData } = useQuery({
    queryKey: ['alerts-recent'],
    queryFn: () => api.get('/alerts?limit=5&status=open').then(r => r.data),
    refetchInterval: 10000,
  })

  const vehicles = vehiclesData?.vehicles || []
  const alerts = alertsData?.alerts || []
  const s = summary || {}

  const kpis = [
    { label: 'Total Vehicles', value: s.totalVehicles ?? '—', icon: Car, color: 'blue', trend: 'up', trendVal: '12%' },
    { label: 'Active Now', value: s.activeVehicles ?? '—', icon: Activity, color: 'green', trend: 'up', trendVal: '8%' },
    { label: 'Avg Speed', value: s.avgSpeed ? `${s.avgSpeed} km/h` : '—', icon: Zap, color: 'amber', trend: 'down', trendVal: '3%' },
    { label: 'Open Alerts', value: s.openAlerts ?? '—', icon: Bell, color: 'red', trend: 'down', trendVal: '15%' },
    { label: 'Critical Alerts', value: s.criticalAlerts ?? '—', icon: TrendingUp, color: 'purple', trend: 'down', trendVal: '5%' },
  ]

  const severityColor: Record<string, string> = {
    critical: 'danger', high: 'warning', medium: 'warning', low: 'info',
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet Dashboard</h1>
          <p className="page-subtitle">Real-time overview of your UrbanMove fleet</p>
        </div>
        <span className="badge badge-success">
          <span style={{ width: 6, height: 6, background: '#22d3ee', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px #22d3ee' }} />
          Live
        </span>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map(({ label, value, icon: Icon, color, trend, trendVal }) => (
          <div key={label} className={`kpi-card ${color}`}>
            <div className={`kpi-icon ${color}`}><Icon size={18} /></div>
            <div className="kpi-value">{sumLoading ? <span className="skeleton" style={{ width: 60, height: 32, display: 'block' }} /> : value}</div>
            <div className="kpi-label">{label}</div>
            <div className={`kpi-trend ${trend}`}>
              {trend === 'up' ? '↑' : '↓'} {trendVal} vs last hour
            </div>
          </div>
        ))}
      </div>

      {/* Map + Alerts split */}
      <div className="grid-2" style={{ gap: '1.25rem', alignItems: 'start' }}>
        {/* Live Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ marginBottom: 2 }}>Live Vehicle Map</h3>
              <p style={{ fontSize: '0.75rem' }}>{vehicles.filter((v: any) => v.status === 'active').length} vehicles online in Ho Chi Minh City</p>
            </div>
            <MapPin size={16} color="var(--accent)" />
          </div>
          <div className="map-container" style={{ height: 420, borderRadius: 0 }}>
            <MapContainer
              center={[10.7769, 106.7009]}
              zoom={12}
              style={{ height: '100%', background: '#0a1628' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {vehicles.map((v: any) => (
                v.lat && v.lng &&
                <Marker key={v.vehicleId} position={[v.lat, v.lng]} icon={createVehicleIcon(v.speed, v.status)}>
                  <Popup>
                    <div style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: 8, minWidth: 160 }}>
                      <strong>{v.plateNumber}</strong><br />
                      Driver: {v.driverName}<br />
                      Speed: {v.speed} km/h<br />
                      Zone: {v.zone}<br />
                      <span style={{ color: v.status === 'active' ? '#22d3ee' : '#475569' }}>● {v.status}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          {/* Legend */}
          <div style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)' }}>
            {[{ c: '#22d3ee', l: 'Normal (<30)' }, { c: '#f59e0b', l: 'Moderate' }, { c: '#f43f5e', l: 'Fast (>60)' }, { c: '#475569', l: 'Inactive' }].map(e => (
              <div key={e.l} className="flex items-center gap-2" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.c, display: 'inline-block' }} />
                {e.l}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="flex-col gap-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3>Active Alerts</h3>
              <a href="/alerts" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>View all →</a>
            </div>
            <div className="flex-col gap-3">
              {alerts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <Bell size={24} style={{ margin: '0 auto 0.5rem' }} />
                  <div>No open alerts</div>
                </div>
              )}
              {alerts.slice(0, 5).map((a: any) => (
                <div key={a.alertId} className={`card alert-${a.severity}`} style={{ padding: '0.875rem', background: 'rgba(15,23,42,0.6)' }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{a.type?.replace('_', ' ').toUpperCase()}</span>
                    <span className={`badge badge-${severityColor[a.severity] || 'neutral'}`}>{a.severity}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{a.message}</p>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Vehicle: {a.vehicleId?.slice(0, 8)}... · Zone: {a.zone || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zone Distribution */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Zone Distribution</h3>
            <div className="flex-col gap-2">
              {(s.zoneDistribution || []).slice(0, 5).map((z: any) => (
                <div key={z.zone}>
                  <div className="flex justify-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span>{z.zone}</span>
                    <span style={{ color: 'var(--accent)' }}>{z.count} vehicles</span>
                  </div>
                  <div style={{ background: 'rgba(56,189,248,0.1)', borderRadius: 999, height: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, (z.count / (s.totalVehicles || 1)) * 100)}%`,
                      height: '100%',
                      background: 'var(--gradient-primary)',
                      borderRadius: 999,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
