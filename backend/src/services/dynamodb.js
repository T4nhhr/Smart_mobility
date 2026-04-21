const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');

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

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLES = {
  VEHICLES: process.env.DYNAMODB_VEHICLES_TABLE || 'Vehicles',
  TELEMETRY: process.env.DYNAMODB_TELEMETRY_TABLE || 'Telemetry',
  ROUTES: process.env.DYNAMODB_ROUTES_TABLE || 'Routes',
  ALERTS: process.env.DYNAMODB_ALERTS_TABLE || 'Alerts',
};

// ─── Generic Helpers ──────────────────────────────────────────────────────────
const put = (tableName, item) =>
  docClient.send(new PutCommand({ TableName: tableName, Item: item }));

const get = (tableName, key) =>
  docClient.send(new GetCommand({ TableName: tableName, Key: key }));

const query = (tableName, params) =>
  docClient.send(new QueryCommand({ TableName: tableName, ...params }));

const scan = (tableName, params = {}) =>
  docClient.send(new ScanCommand({ TableName: tableName, ...params }));

const update = (tableName, params) =>
  docClient.send(new UpdateCommand({ TableName: tableName, ...params }));

const remove = (tableName, key) =>
  docClient.send(new DeleteCommand({ TableName: tableName, Key: key }));

module.exports = { docClient, TABLES, put, get, query, scan, update, remove };
