import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { BarChart2, TrendingUp, Map, Activity } from 'lucide-react'
import api from '../../services/api'

const ChartTooltipStyle = {
  contentStyle: {
    background: 'rgba(15,23,42,0.95)',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: 8,
    color: '#f1f5f9',
    fontSize: '0.8rem',
  },
  labelStyle: { color: '#94a3b8' },
}

export default function AnalyticsPage() {
  const { data: summary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => api.get('/analytics/summary').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: congestionData } = useQuery({
    queryKey: ['analytics-congestion'],
    queryFn: () => api.get('/analytics/congestion').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: utilizationData } = useQuery({
    queryKey: ['analytics-utilization'],
    queryFn: () => api.get('/analytics/utilization').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: trendsData } = useQuery({
    queryKey: ['analytics-speed-trends'],
    queryFn: () => api.get('/analytics/speed-trends').then(r => r.data),
    refetchInterval: 15000,
  })

  const utilization = utilizationData?.utilizationRate || 0
  const hourlyData = utilizationData?.hourlyData || []
  const congestion = congestionData?.congestion || []
  const trends = trendsData?.trends || []
  const zoneDistribution = summary?.zoneDistribution || []

  const congestionColors = { high: '#f43f5e', medium: '#f59e0b', low: '#22d3ee' }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Platform-wide performance metrics and congestion analysis</p>
        </div>
        <span className="badge badge-info">
          <BarChart2 size={12} /> Live Data
        </span>
      </div>

      {/* Utilization Gauge */}
      <div className="grid-2 mb-6" style={{ alignItems: 'start' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Fleet Utilization</h3>
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="65%"
                outerRadius="90%"
                data={[{ value: utilization, fill: '#38bdf8' }, { value: 100 - utilization, fill: 'rgba(56,189,248,0.08)' }]}
                startAngle={180}
                endAngle={-180}
              >
                <RadialBar dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{utilization}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Utilization</div>
            </div>
          </div>
          <div className="flex gap-4 mt-4" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Total: {utilizationData?.totalVehicles || 0}</span>
            <span style={{ color: '#22d3ee' }}>Active: {Math.round((utilizationData?.totalVehicles || 0) * utilization / 100)}</span>
          </div>
        </div>

        {/* Congestion Heatmap */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Congestion by Zone</h3>
          <div className="flex-col gap-3">
            {congestion.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No congestion data yet.</p>
            )}
            {congestion.map((z: any) => (
              <div key={z.zone}>
                <div className="flex justify-between" style={{ fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: (congestionColors as any)[z.level], display: 'inline-block' }} />
                    <span>{z.zone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: 'var(--text-muted)' }}>{z.avgSpeed} km/h</span>
                    <span style={{ color: (congestionColors as any)[z.level], fontWeight: 600 }}>{z.congestionIndex}%</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(56,189,248,0.08)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${z.congestionIndex}%`, height: '100%', background: (congestionColors as any)[z.level], borderRadius: 999, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Speed Trends Chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3>Average Speed Trends (Last 60 min)</h3>
          <TrendingUp size={16} color="var(--accent)" />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trends}>
            <defs>
              <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.08)" />
            <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 11 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 11 }} unit=" km/h" />
            <Tooltip {...ChartTooltipStyle} />
            <Area type="monotone" dataKey="avgSpeed" stroke="#38bdf8" fill="url(#speedGrad)" strokeWidth={2} name="Avg Speed" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Vehicle Activity per Hour */}
      <div className="grid-2" style={{ gap: '1.25rem', alignItems: 'start' }}>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Vehicle Activity (24h)</h3>
            <Activity size={16} color="var(--text-secondary)" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData.filter((_: any, i: number) => i % 2 === 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.08)" />
              <XAxis dataKey="hour" stroke="#475569" tick={{ fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
              <Tooltip {...ChartTooltipStyle} />
              <Bar dataKey="vehicleCount" name="Vehicles" radius={[4, 4, 0, 0]}>
                {hourlyData.filter((_: any, i: number) => i % 2 === 0).map((_: any, i: number) => (
                  <Cell key={i} fill={`rgba(56,189,248,${0.3 + (i / 12) * 0.5})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Fleet Distribution by Zone</h3>
            <Map size={16} color="var(--text-secondary)" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={zoneDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.08)" horizontal={false} />
              <XAxis type="number" stroke="#475569" tick={{ fontSize: 10 }} />
              <YAxis dataKey="zone" type="category" stroke="#475569" tick={{ fontSize: 10 }} width={80} />
              <Tooltip {...ChartTooltipStyle} />
              <Bar dataKey="count" name="Vehicles" radius={[0, 4, 4, 0]}>
                {zoneDistribution.map((_: any, i: number) => (
                  <Cell key={i} fill={['#38bdf8', '#22d3ee', '#a78bfa', '#f59e0b', '#f43f5e'][i % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
