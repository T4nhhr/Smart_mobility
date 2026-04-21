import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Car, Filter, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

interface Vehicle {
  vehicleId: string
  plateNumber: string
  type: string
  driverName: string
  zone: string
  status: string
  lat?: number
  lng?: number
  speed?: number
  fuelLevel?: number
  createdAt: number
}

const VEHICLE_TYPES = ['bus', 'truck', 'van', 'motorcycle', 'car']
const ZONES = ['Downtown', 'District 2', 'District 7', 'Binh Thanh', 'Tan Binh']

function VehicleModal({ vehicle, onClose, onSave }: { vehicle?: Vehicle; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    plateNumber: vehicle?.plateNumber || '',
    type: vehicle?.type || 'car',
    driverName: vehicle?.driverName || '',
    zone: vehicle?.zone || 'Downtown',
    status: vehicle?.status || 'active',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{vehicle ? 'Edit Vehicle' : 'Register Vehicle'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Plate Number</label>
            <input value={form.plateNumber} onChange={set('plateNumber')} placeholder="51F-12345" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={set('type')}>
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Zone</label>
              <select value={form.zone} onChange={set('zone')}>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Driver Name</label>
            <input value={form.driverName} onChange={set('driverName')} placeholder="Nguyen Van A" />
          </div>
          {vehicle && (
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={set('status')}>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>
            {vehicle ? 'Save Changes' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | undefined>()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
    refetchInterval: 15000,
  })

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/vehicles', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle registered!'); setModalOpen(false) },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: any) => api.put(`/vehicles/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle updated!'); setEditVehicle(undefined) },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle deactivated') },
    onError: () => toast.error('Failed to deactivate'),
  })

  const vehicles: Vehicle[] = (data?.vehicles || []).filter((v: Vehicle) => {
    if (statusFilter && v.status !== statusFilter) return false
    if (search && !v.plateNumber.toLowerCase().includes(search.toLowerCase()) && !v.driverName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const statusClass: Record<string, string> = { active: 'success', maintenance: 'warning', deactivated: 'neutral' }

  const canEdit = user?.role === 'Admin' || user?.role === 'Operator'
  const isAdmin = user?.role === 'Admin'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet Vehicles</h1>
          <p className="page-subtitle">{data?.count || 0} vehicles registered</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => { setEditVehicle(undefined); setModalOpen(true) }}>
            <Plus size={16} /> Register Vehicle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-4 flex items-center gap-3" style={{ padding: '0.875rem 1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plate or driver..." style={{ paddingLeft: '2.25rem' }} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} color="var(--text-muted)" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Plate</th>
              <th>Type</th>
              <th>Driver</th>
              <th>Zone</th>
              <th>Status</th>
              <th>Speed</th>
              <th>Fuel</th>
              <th>Registered</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading vehicles...</td></tr>
            )}
            {!isLoading && vehicles.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Car size={32} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                  No vehicles found
                </td>
              </tr>
            )}
            {vehicles.map((v) => (
              <tr key={v.vehicleId}>
                <td><span className="font-mono" style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>{v.plateNumber}</span></td>
                <td style={{ textTransform: 'capitalize' }}>{v.type}</td>
                <td>{v.driverName}</td>
                <td>{v.zone}</td>
                <td>
                  <span className={`badge badge-${statusClass[v.status] || 'neutral'}`}>
                    {v.status}
                  </span>
                </td>
                <td>{v.speed !== undefined ? `${v.speed} km/h` : '—'}</td>
                <td>
                  {v.fuelLevel !== undefined ? (
                    <div className="flex items-center gap-2">
                      <div style={{ background: 'rgba(56,189,248,0.1)', borderRadius: 999, height: 6, width: 60, overflow: 'hidden' }}>
                        <div style={{ width: `${v.fuelLevel}%`, height: '100%', background: v.fuelLevel < 20 ? '#f43f5e' : 'var(--gradient-primary)', borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.fuelLevel}%</span>
                    </div>
                  ) : '—'}
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(v.createdAt).toLocaleDateString()}
                </td>
                {canEdit && (
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditVehicle(v); setModalOpen(true) }} title="Edit">
                        <Pencil size={14} />
                      </button>
                      {isAdmin && (
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteMutation.mutate(v.vehicleId)} title="Deactivate">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modalOpen || editVehicle) && (
        <VehicleModal
          vehicle={editVehicle}
          onClose={() => { setModalOpen(false); setEditVehicle(undefined) }}
          onSave={(form) => {
            if (editVehicle) updateMutation.mutate({ id: editVehicle.vehicleId, body: form })
            else createMutation.mutate(form)
          }}
        />
      )}
    </div>
  )
}
