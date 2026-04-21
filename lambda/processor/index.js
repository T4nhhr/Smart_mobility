/**
 * Lambda Processor – Kinesis → DynamoDB
 *
 * Triggered by Kinesis telemetry-stream.
 * Processes batches of telemetry records, deduplicates them,
 * writes aggregated data to DynamoDB, and archives raw records to S3.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, BatchWriteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const ddbClient = new DynamoDBClient({ region: process.env.AWS_ACCOUNT_REGION || process.env.AWS_REGION || 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(ddbClient, { marshallOptions: { removeUndefinedValues: true } })
const s3Client = new S3Client({ region: process.env.AWS_ACCOUNT_REGION || process.env.AWS_REGION || 'us-east-1' })

const TELEMETRY_TABLE = process.env.DYNAMODB_TELEMETRY_TABLE || 'Telemetry'
const VEHICLES_TABLE  = process.env.DYNAMODB_VEHICLES_TABLE  || 'Vehicles'
const DATA_LAKE_BUCKET= process.env.S3_DATA_LAKE_BUCKET      || 'urbanmove-datalake'

exports.handler = async (event) => {
  const startTime = Date.now()
  const records = []
  const vehicleUpdates = {}
  let successCount = 0
  let errorCount = 0

  // Parse all Kinesis records
  for (const kinesisRecord of event.Records) {
    try {
      const rawData = Buffer.from(kinesisRecord.kinesis.data, 'base64').toString('utf-8')
      const record = JSON.parse(rawData)
      records.push(record)

      // Track latest position per vehicle (for bulk vehicle update)
      if (!vehicleUpdates[record.vehicleId] || record.timestamp > vehicleUpdates[record.vehicleId].timestamp) {
        vehicleUpdates[record.vehicleId] = record
      }
    } catch (err) {
      console.error('[Processor] Failed to parse record:', err.message)
      errorCount++
    }
  }

  console.log(`[Processor] Processing ${records.length} records for ${Object.keys(vehicleUpdates).length} vehicles`)

  // ─── Batch write telemetry to DynamoDB ──────────────────────────────────────
  const chunks = []
  for (let i = 0; i < records.length; i += 25) {
    chunks.push(records.slice(i, i + 25))
  }

  for (const chunk of chunks) {
    try {
      const putRequests = chunk.map(r => ({
        PutRequest: {
          Item: {
            vehicleId: r.vehicleId,
            timestamp: r.timestamp || Date.now(),
            lat: r.lat,
            lng: r.lng,
            speed: r.speed || 0,
            heading: r.heading || 0,
            fuelLevel: r.fuelLevel || 100,
            zone: r.zone || 'Unknown',
            recordId: r.recordId || `${r.vehicleId}-${r.timestamp}`,
            ttl: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // TTL: 7 days
            processedAt: Date.now(),
          }
        }
      }))

      await docClient.send(new BatchWriteCommand({
        RequestItems: { [TELEMETRY_TABLE]: putRequests }
      }))
      successCount += chunk.length
    } catch (err) {
      console.error('[Processor] Batch write error:', err.message)
      errorCount += chunk.length
    }
  }

  // ─── Update vehicle last positions ────────────────────────────────────────
  const vehicleUpdatePromises = Object.values(vehicleUpdates).map(async (r) => {
    try {
      await docClient.send(new UpdateCommand({
        TableName: VEHICLES_TABLE,
        Key: { vehicleId: r.vehicleId },
        UpdateExpression: 'SET lat = :lat, lng = :lng, speed = :speed, heading = :heading, fuelLevel = :fl, #zone = :zone, updatedAt = :ua',
        ExpressionAttributeNames: { '#zone': 'zone' },
        ExpressionAttributeValues: {
          ':lat': r.lat,
          ':lng': r.lng,
          ':speed': r.speed || 0,
          ':heading': r.heading || 0,
          ':fl': r.fuelLevel || 100,
          ':zone': r.zone || 'Unknown',
          ':ua': Date.now(),
        },
        ConditionExpression: 'attribute_exists(vehicleId)',
      }))
    } catch (err) {
      // Vehicle might not exist — skip silently
      if (err.name !== 'ConditionalCheckFailedException') {
        console.warn(`[Processor] Vehicle update failed for ${r.vehicleId}:`, err.message)
      }
    }
  })

  await Promise.allSettled(vehicleUpdatePromises)

  // ─── Archive batch to S3 Data Lake ───────────────────────────────────────
  if (records.length > 0) {
    try {
      const now = new Date()
      const key = `telemetry/year=${now.getUTCFullYear()}/month=${String(now.getUTCMonth() + 1).padStart(2, '0')}/day=${String(now.getUTCDate()).padStart(2, '0')}/batch-${Date.now()}.json`

      await s3Client.send(new PutObjectCommand({
        Bucket: DATA_LAKE_BUCKET,
        Key: key,
        Body: JSON.stringify(records),
        ContentType: 'application/json',
      }))
    } catch (err) {
      console.warn('[Processor] S3 archive failed:', err.message)
    }
  }

  const duration = Date.now() - startTime
  console.log(`[Processor] Done in ${duration}ms. Success: ${successCount}, Errors: ${errorCount}`)

  return { batchItemFailures: [] }  // Return empty to prevent retry of whole batch
}
