/**
 * Lambda Analytics Aggregator
 *
 * Runs every 5 minutes (EventBridge schedule).
 * Reads telemetry from DynamoDB, computes aggregated metrics,
 * and writes summaries back for fast dashboard reads.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const region = process.env.AWS_ACCOUNT_REGION || process.env.AWS_REGION || 'us-east-1'
const ddbClient = new DynamoDBClient({ region })
const docClient = DynamoDBDocumentClient.from(ddbClient)
const s3Client = new S3Client({ region })

const TELEMETRY_TABLE = process.env.DYNAMODB_TELEMETRY_TABLE || 'Telemetry'
const VEHICLES_TABLE  = process.env.DYNAMODB_VEHICLES_TABLE  || 'Vehicles'
const DATA_LAKE_BUCKET= process.env.S3_DATA_LAKE_BUCKET      || 'urbanmove-datalake'

const scan = async (tableName, limit = 1000) => {
  const result = await docClient.send(new ScanCommand({ TableName: tableName, Limit: limit }))
  return result.Items || []
}

exports.handler = async () => {
  const startTime = Date.now()
  console.log('[Analytics] Starting aggregation run...')

  try {
    const [vehicles, telemetry] = await Promise.all([
      scan(VEHICLES_TABLE, 500),
      scan(TELEMETRY_TABLE, 2000),
    ])

    const activeVehicles = vehicles.filter(v => v.status === 'active' && !v.pk)
    const totalVehicles  = vehicles.filter(v => !v.pk)

    // ─── Average speed ───────────────────────────────────────────────────────
    const avgSpeed = telemetry.length
      ? telemetry.reduce((s, t) => s + (Number(t.speed) || 0), 0) / telemetry.length
      : 0

    // ─── Zone metrics ────────────────────────────────────────────────────────
    const zoneMetrics = {}
    telemetry.forEach(t => {
      const zone = t.zone || 'Unknown'
      if (!zoneMetrics[zone]) zoneMetrics[zone] = { speeds: [], vehicleIds: new Set() }
      zoneMetrics[zone].speeds.push(Number(t.speed) || 0)
      zoneMetrics[zone].vehicleIds.add(t.vehicleId)
    })

    const zoneData = Object.entries(zoneMetrics).map(([zone, data]) => {
      const avgZoneSpeed = data.speeds.reduce((s, v) => s + v, 0) / data.speeds.length
      const congestionIndex = Math.max(0, Math.min(100, 100 - avgZoneSpeed * 1.5))
      return {
        zone,
        vehicleCount: data.vehicleIds.size,
        avgSpeed: Math.round(avgZoneSpeed),
        congestionIndex: Math.round(congestionIndex),
        level: congestionIndex > 70 ? 'high' : congestionIndex > 40 ? 'medium' : 'low',
      }
    })

    // ─── Hourly vehicle activity ─────────────────────────────────────────────
    const now = Date.now()
    const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
      const start = now - (23 - i) * 3600000
      const end = start + 3600000
      const hour = new Date(start)
      const records = telemetry.filter(t => {
        const ts = Number(t.timestamp)
        return ts >= start && ts < end
      })
      return {
        hour: `${hour.getUTCHours().toString().padStart(2, '0')}:00`,
        vehicleCount: new Set(records.map(r => r.vehicleId)).size,
        recordCount: records.length,
        avgSpeed: records.length ? Math.round(records.reduce((s, r) => s + (Number(r.speed) || 0), 0) / records.length) : 0,
      }
    })

    const aggregation = {
      timestamp: now,
      summary: {
        totalVehicles: totalVehicles.length,
        activeVehicles: activeVehicles.length,
        avgSpeed: Math.round(avgSpeed),
        totalTelemetryRecords: telemetry.length,
        utilizationRate: totalVehicles.length
          ? Math.round((activeVehicles.length / totalVehicles.length) * 100)
          : 0,
      },
      zoneData,
      hourlyActivity,
    }

    // ─── Archive to S3 ────────────────────────────────────────────────────────
    const date = new Date(now)
    const key = `aggregations/year=${date.getUTCFullYear()}/month=${String(date.getUTCMonth() + 1).padStart(2, '0')}/day=${String(date.getUTCDate()).padStart(2, '0')}/agg-${now}.json`

    await s3Client.send(new PutObjectCommand({
      Bucket: DATA_LAKE_BUCKET,
      Key: key,
      Body: JSON.stringify(aggregation, null, 2),
      ContentType: 'application/json',
    }))

    const duration = Date.now() - startTime
    console.log(`[Analytics] Aggregation complete in ${duration}ms`)
    console.log(`[Analytics] ${totalVehicles.length} vehicles, ${telemetry.length} records, ${zoneData.length} zones`)

    return { statusCode: 200, body: `Aggregation complete in ${duration}ms` }
  } catch (err) {
    console.error('[Analytics] Error:', err.message)
    throw err
  }
}
