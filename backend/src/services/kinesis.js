const { KinesisClient, PutRecordCommand, PutRecordsCommand } = require('@aws-sdk/client-kinesis');

const clientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
};

if (process.env.AWS_ENDPOINT_URL) {
  clientConfig.endpoint = process.env.AWS_ENDPOINT_URL;
}

const kinesisClient = new KinesisClient(clientConfig);
const STREAM_NAME = process.env.KINESIS_STREAM_NAME || 'telemetry-stream';

/**
 * Publish a single telemetry record to Kinesis
 */
const publishTelemetry = async (vehicleId, data) => {
  try {
    const record = {
      vehicleId,
      ...data,
      publishedAt: Date.now(),
    };

    const command = new PutRecordCommand({
      StreamName: STREAM_NAME,
      Data: Buffer.from(JSON.stringify(record)),
      PartitionKey: vehicleId,
    });

    const result = await kinesisClient.send(command);
    return { success: true, shardId: result.ShardId, sequenceNumber: result.SequenceNumber };
  } catch (err) {
    console.error('[Kinesis] Failed to publish record:', err.message);
    // Don't throw - telemetry publishing is best-effort
    return { success: false, error: err.message };
  }
};

/**
 * Batch publish telemetry records
 */
const publishTelemetryBatch = async (records) => {
  try {
    const kinesisRecords = records.map((r) => ({
      Data: Buffer.from(JSON.stringify(r)),
      PartitionKey: r.vehicleId || 'default',
    }));

    const command = new PutRecordsCommand({
      StreamName: STREAM_NAME,
      Records: kinesisRecords,
    });

    const result = await kinesisClient.send(command);
    return { success: true, failedCount: result.FailedRecordCount };
  } catch (err) {
    console.error('[Kinesis] Batch publish failed:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { publishTelemetry, publishTelemetryBatch };
