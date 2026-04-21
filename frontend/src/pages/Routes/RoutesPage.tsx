import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Map, Navigation, Clock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const CONGESTION_COLORS: Record<string, string> = { low: '#22d3ee', medium: '#f59e0b', high: '#f43f5e' }

export default function RoutesPage() {
  const [origin, setOrigin] = useState({ lat: '10.7769', lng: '106.7009', name: 'Ben Thanh Market' })
  const [dest, setDest] = useState({ lat: '10.8007', lng: '106.7323', name: 'Thu Duc City' })
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [savedVehicleId, setSavedVehicleId] = useState('')

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles-select'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
  })

  const { data: routesData, refetch, isFetching } = useQuery({
    queryKey: ['routes-recommend', origin, dest],
    queryFn: () => api.get('/routes/recommend', {
      params: { originLat: origin.lat, originLng: origin.lng, destLat: dest.lat, destLng: dest.lng }
    }).then(r => r.data),
    enabled: false,
  })

  const { data: savedRoutes } = useQuery({
    queryKey: ['routes-saved'],
    queryFn: () => api.get('/routes').then(r => r.data),
    refetchInterval: 30000,
  })

  const handleSearch = () => {
    if (!origin.lat || !dest.lat) return toast.error('Set origin and destination')
    refetch()
  }

  const handleSave = async () => {
    if (!selectedRoute || !savedVehicleId) return toast.error('Select a vehicle and route first')
    try {
      await api.post('/routes/calculate', {
        vehicleId: savedVehicleId,
        origin: { lat: parseFloat(origin.lat), lng: parseFloat(origin.lng), name: origin.name },
        destination: { lat: parseFloat(dest.lat), lng: parseFloat(dest.lng), name: dest.name },
        selectedRouteId: selectedRoute.routeId,
        routeData: selectedRoute,
      })
      toast.success('Route saved!')
    } catch {
      toast.error('Failed to save route')
    }
  }

  const routes = routesData?.routes || []
  const vehicles = vehiclesQuery.data?.vehicles || []

  const routeColors = ['#38bdf8', '#22d3ee', '#a78bfa']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Route Planning</h1>
          <p className="page-subtitle">Get AI-powered route recommendations with congestion analysis</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.25rem', alignItems: 'start' }}>
        {/* Left: Inputs + Results */}
        <div className="flex-col gap-4">
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Route Parameters</h3>
            <div className="flex-col gap-3">
              <div className="form-group">
                <label>Origin Name</label>
                <input value={origin.name} onChange={e => setOrigin(o => ({ ...o, name: e.target.value }))} placeholder="e.g. Ben Thanh Market" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Latitude</label>
                  <input value={origin.lat} onChange={e => setOrigin(o => ({ ...o, lat: e.target.value }))} placeholder="10.7769" />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input value={origin.lng} onChange={e => setOrigin(o => ({ ...o, lng: e.target.value }))} placeholder="106.7009" />
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              <div className="form-group">
                <label>Destination Name</label>
                <input value={dest.name} onChange={e => setDest(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Thu Duc City" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Latitude</label>
                  <input value={dest.lat} onChange={e => setDest(d => ({ ...d, lat: e.target.value }))} placeholder="10.8007" />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input value={dest.lng} onChange={e => setDest(d => ({ ...d, lng: e.target.value }))} placeholder="106.7323" />
                </div>
              </div>

              <button className="btn btn-primary w-full" onClick={handleSearch} disabled={isFetching} style={{ justifyContent: 'center' }}>
                {isFetching ? 'Calculating...' : <><Navigation size={16} /> Get Route Recommendations</>}
              </button>
            </div>
          </div>

          {/* Route Results */}
          {routes.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Recommended Routes</h3>
              <div className="flex-col gap-3">
                {routes.map((r: any, i: number) => (
                  <div
                    key={r.routeId}
                    className="card"
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      borderColor: selectedRoute?.routeId === r.routeId ? 'var(--accent)' : undefined,
                      background: selectedRoute?.routeId === r.routeId ? 'rgba(56,189,248,0.08)' : 'rgba(15,23,42,0.6)',
                    }}
                    onClick={() => setSelectedRoute(r)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: routeColors[i] }} />
                        <strong style={{ fontSize: '0.875rem' }}>{r.name}</strong>
                      </div>
                      {r.toll && <span className="badge badge-warning">Toll</span>}
                    </div>
                    <div className="flex gap-4" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span><Map size={12} style={{ display: 'inline' }} /> {r.distance.toFixed(1)} km</span>
                      <span><Clock size={12} style={{ display: 'inline' }} /> {r.estimatedTime} min</span>
                      <span style={{ color: CONGESTION_COLORS[r.congestionLevel] }}>● {r.congestionLevel} traffic</span>
                    </div>
                    {r.toll && <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>Toll: {r.tollCost?.toLocaleString()} VND</div>}
                  </div>
                ))}
              </div>

              {selectedRoute && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={savedVehicleId}
                    onChange={e => setSavedVehicleId(e.target.value)}
                    style={{ flex: 1, minWidth: 150 }}
                  >
                    <option value="">Assign to vehicle...</option>
                    {vehicles.map((v: any) => (
                      <option key={v.vehicleId} value={v.vehicleId}>{v.plateNumber} – {v.driverName}</option>
                    ))}
                  </select>
                  <button className="btn btn-secondary" onClick={handleSave}>Save Route</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div className="flex-col gap-4">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <h3>{origin.name} <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {dest.name}</h3>
            </div>
            <div style={{ height: 450 }}>
              <MapContainer center={[10.789, 10.789 < 10.8 ? 106.7166 : 106.7166]} zoom={12} style={{ height: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {routes.map((r: any, i: number) => (
                  r.waypoints &&
                  <Polyline
                    key={r.routeId}
                    positions={r.waypoints.map((w: any) => [w.lat, w.lng])}
                    color={routeColors[i]}
                    weight={selectedRoute?.routeId === r.routeId ? 4 : 2}
                    opacity={selectedRoute?.routeId === r.routeId ? 1 : 0.4}
                  />
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Saved Routes */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Recent Planned Routes</h3>
            {(savedRoutes?.routes || []).slice(0, 5).length === 0 ? (
              <p style={{ fontSize: '0.875rem' }}>No routes saved yet.</p>
            ) : (
              <div className="flex-col gap-2">
                {(savedRoutes?.routes || []).slice(0, 5).map((r: any) => (
                  <div key={r.routeId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(15,23,42,0.6)', borderRadius: 8, fontSize: '0.8rem' }}>
                    <span>{r.origin?.name || 'Origin'} → {r.destination?.name || 'Dest'}</span>
                    <span className="badge badge-info">{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
