/**
 * UrbanMove Telemetry Simulator
 *
 * Simulates GPS telemetry from a fleet of virtual vehicles.
 * Each vehicle moves realistically around Ho Chi Minh City.
 * Pushes telemetry records to the backend API at configurable intervals.
 */

const http = require('http')

const API_URL = process.env.API_URL || 'http://localhost:3000'
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS) || 2000
const VEHICLE_COUNT = parseInt(process.env.VEHICLE_COUNT) || 20

// Ho Chi Minh City bounding box
const BOUNDS = { minLat: 10.70, maxLat: 10.85, minLng: 106.63, maxLng: 106.78 }

const ZONES = [
  { name: 'Downtown', lat: 10.7769, lng: 106.7009 },
  { name: 'District 2', lat: 10.8007, lng: 106.7323 },
  { name: 'District 7', lat: 10.7331, lng: 106.7233 },
  { name: 'Binh Thanh', lat: 10.8120, lng: 106.7111 },
  { name: 'Tan Binh', lat: 10.8014, lng: 106.6521 },
]

const TYPES = ['bus', 'truck', 'van', 'car', 'motorcycle']
const ALERT_TYPES = ['speeding', 'fuel_low', 'engine_fault']

// Initialize virtual vehicles
const vehicles = Array.from({ length: VEHICLE_COUNT }, (_, i) => {
  const zone = ZONES[i % ZONES.length]
  return {
    vehicleId: `sim-vehicle-${String(i + 1).padStart(3, '0')}`,
    plateNumber: `51F-${String(10000 + i).slice(1)}`,
    type: TYPES[i % TYPES.length],
    driverName: `Driver ${i + 1}`,
    zone: zone.name,
    lat: zone.lat + (Math.random() - 0.5) * 0.05,
    lng: zone.lng + (Math.random() - 0.5) * 0.05,
    speed: Math.random() * 60,
    heading: Math.random() * 360,
    fuelLevel: 60 + Math.random() * 40,
    registered: false,
  }
})

// HTTP helper
const post = (path, body) => {
  return new Promise((resolve) => {
    const data = JSON.stringify(body)
    const url = new URL(API_URL + path)
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }
    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => resolve({ status: res.statusCode, body }))
    })
    req.on('error', () => resolve({ status: 0, error: true }))
    req.write(data)
    req.end()
  })
}

// Update vehicle position with Brownian motion
const moveVehicle = (v) => {
  const speedChange = (Math.random() - 0.5) * 10
  v.speed = Math.max(0, Math.min(120, v.speed + speedChange))

  const headingChange = (Math.random() - 0.5) * 20
  v.heading = (v.heading + headingChange + 360) % 360

  // Move based on speed and heading
  const distKm = (v.speed / 3600) * (INTERVAL_MS / 1000)
  const latDelta = distKm * Math.cos((v.heading * Math.PI) / 180) / 111
  const lngDelta = distKm * Math.sin((v.heading * Math.PI) / 180) / (111 * Math.cos((v.lat * Math.PI) / 180))

  v.lat = Math.max(BOUNDS.minLat, Math.min(BOUNDS.maxLat, v.lat + latDelta))
  v.lng = Math.max(BOUNDS.minLng, Math.min(BOUNDS.maxLng, v.lng + lngDelta))

  // Randomly deplete fuel
  v.fuelLevel = Math.max(5, v.fuelLevel - Math.random() * 0.01)

  // Update zone based on position
  let closestZone = ZONES[0]
  let closestDist = Infinity
  for (const z of ZONES) {
    const d = Math.sqrt((v.lat - z.lat) ** 2 + (v.lng - z.lng) ** 2)
    if (d < closestDist) { closestDist = d; closestZone = z }
  }
  v.zone = closestZone.name
}

// Register vehicles with backend on startup
const registerVehicles = async () => {
  console.log(`[Simulator] Waiting 5s for backend to be ready...`)
  await new Promise(r => setTimeout(r, 5000))

  console.log(`[Simulator] Registering ${VEHICLE_COUNT} virtual vehicles...`)
  let registered = 0
  for (const v of vehicles) {
    const res = await post('/vehicles', {
      plateNumber: v.plateNumber,
      type: v.type,
      driverName: v.driverName,
      zone: v.zone,
    })
    if (res.status === 201) {
      try {
        const parsed = JSON.parse(res.body)
        v.vehicleId = parsed.vehicle?.vehicleId || v.vehicleId
        v.registered = true
        registered++
      } catch {}
    }
  }
  console.log(`[Simulator] Registered ${registered}/${VEHICLE_COUNT} vehicles`)
}

// Main simulation loop
const runSimulation = async () => {
  let tick = 0
  setInterval(async () => {
    tick++
    const batch = vehicles.filter(v => v.registered)

    for (const v of batch) {
      moveVehicle(v)

      const record = {
        vehicleId: v.vehicleId,
        lat: parseFloat(v.lat.toFixed(6)),
        lng: parseFloat(v.lng.toFixed(6)),
        speed: parseFloat(v.speed.toFixed(1)),
        heading: parseFloat(v.heading.toFixed(1)),
        fuelLevel: parseFloat(v.fuelLevel.toFixed(1)),
        zone: v.zone,
        timestamp: Date.now(),
      }

      post('/telemetry', record).catch(() => {})

      // Randomly generate alerts
      if (Math.random() < 0.002) {
        const alertType = v.speed > 90 ? 'speeding' : v.fuelLevel < 15 ? 'fuel_low' : 'geofence'
        post('/alerts', {
          vehicleId: v.vehicleId,
          type: alertType,
          severity: alertType === 'speeding' ? 'high' : 'medium',
          message: `${alertType.replace('_', ' ')} detected for vehicle ${v.plateNumber}`,
          lat: v.lat,
          lng: v.lng,
          zone: v.zone,
        }).catch(() => {})
      }
    }

    if (tick % 30 === 0) {
      console.log(`[Simulator] Tick ${tick}: ${batch.length} vehicles active, avg speed: ${(batch.reduce((s, v) => s + v.speed, 0) / (batch.length || 1)).toFixed(1)} km/h`)
    }
  }, INTERVAL_MS)
}

;(async () => {
  console.log('=== UrbanMove Telemetry Simulator ===')
  console.log(`  Vehicles: ${VEHICLE_COUNT}`)
  console.log(`  Interval: ${INTERVAL_MS}ms`)
  console.log(`  API:      ${API_URL}`)
  await registerVehicles()
  await runSimulation()
})()
