#!/usr/bin/env bash
#
# LocalStack initialization script
# Runs automatically when LocalStack starts (placed in /etc/localstack/init/ready.d/)
#

set -e

AWS_ENDPOINT="http://localhost:4566"
REGION="us-east-1"
ACCOUNT_ID="000000000000"

echo "=== UrbanMove LocalStack Init ==="

# ─── DynamoDB Tables ──────────────────────────────────────────────────────────
echo "[1/5] Creating DynamoDB tables..."

# Vehicles table
awslocal dynamodb create-table \
  --table-name Vehicles \
  --attribute-definitions \
    AttributeName=vehicleId,AttributeType=S \
  --key-schema AttributeName=vehicleId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null || echo "  Vehicles table already exists"

# Telemetry table (vehicleId + timestamp as composite key)
awslocal dynamodb create-table \
  --table-name Telemetry \
  --attribute-definitions \
    AttributeName=vehicleId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=vehicleId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null || echo "  Telemetry table already exists"

# Routes table
awslocal dynamodb create-table \
  --table-name Routes \
  --attribute-definitions \
    AttributeName=routeId,AttributeType=S \
  --key-schema AttributeName=routeId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null || echo "  Routes table already exists"

# Alerts table
awslocal dynamodb create-table \
  --table-name Alerts \
  --attribute-definitions \
    AttributeName=alertId,AttributeType=S \
  --key-schema AttributeName=alertId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null || echo "  Alerts table already exists"

echo "  DynamoDB tables created ✓"

# ─── Kinesis Stream ───────────────────────────────────────────────────────────
echo "[2/5] Creating Kinesis stream..."

awslocal kinesis create-stream \
  --stream-name telemetry-stream \
  --shard-count 2 \
  --region $REGION \
  2>/dev/null || echo "  Stream already exists"

echo "  Kinesis stream created ✓"

# ─── S3 Buckets ───────────────────────────────────────────────────────────────
echo "[3/5] Creating S3 buckets..."

awslocal s3 mb s3://urbanmove-frontend --region $REGION 2>/dev/null || true
awslocal s3 mb s3://urbanmove-datalake --region $REGION 2>/dev/null || true

# Enable static website hosting for frontend bucket
awslocal s3 website s3://urbanmove-frontend \
  --index-document index.html \
  --error-document index.html 2>/dev/null || true

echo "  S3 buckets created ✓"

# ─── Seed Demo Data ───────────────────────────────────────────────────────────
echo "[4/5] Seeding demo vehicles..."

ZONES=("Downtown" "District 2" "District 7" "Binh Thanh" "Tan Binh")
TYPES=("bus" "truck" "van" "car" "motorcycle")
DRIVERS=("Nguyen Van A" "Tran Thi B" "Le Van C" "Pham Thi D" "Hoang Van E" "Vo Thi F" "Dang Van G" "Bui Thi H" "Do Van I" "Ngo Thi K")

for i in $(seq 1 15); do
  VEHICLE_ID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "vehicle-$(date +%s%N | tail -c 8)")
  ZONE=${ZONES[$((RANDOM % 5))]}
  TYPE=${TYPES[$((RANDOM % 5))]}
  DRIVER=${DRIVERS[$((RANDOM % 10))]}
  PLATE="51$(printf '%c' $(printf '\x41'))-$((RANDOM % 90000 + 10000))"
  LAT=$(echo "scale=6; 10.7769 + ($RANDOM % 2000 - 1000) / 100000" | bc 2>/dev/null || echo "10.7769")
  LNG=$(echo "scale=6; 106.7009 + ($RANDOM % 2000 - 1000) / 100000" | bc 2>/dev/null || echo "106.7009")
  SPEED=$((RANDOM % 80))
  FUEL=$((RANDOM % 60 + 40))
  NOW=$(date +%s%3N)

  awslocal dynamodb put-item \
    --table-name Vehicles \
    --item "{
      \"vehicleId\": {\"S\": \"${VEHICLE_ID}\"},
      \"plateNumber\": {\"S\": \"${PLATE}\"},
      \"type\": {\"S\": \"${TYPE}\"},
      \"driverName\": {\"S\": \"${DRIVER}\"},
      \"zone\": {\"S\": \"${ZONE}\"},
      \"status\": {\"S\": \"active\"},
      \"lat\": {\"N\": \"${LAT}\"},
      \"lng\": {\"N\": \"${LNG}\"},
      \"speed\": {\"N\": \"${SPEED}\"},
      \"heading\": {\"N\": \"$((RANDOM % 360))\"},
      \"fuelLevel\": {\"N\": \"${FUEL}\"},
      \"createdAt\": {\"N\": \"${NOW}\"},
      \"updatedAt\": {\"N\": \"${NOW}\"}
    }" \
    --region $REGION \
    2>/dev/null || true
done

echo "  Demo vehicles seeded ✓"

# Seed some alerts
echo "[5/5] Seeding demo alerts..."

for TYPE in speeding geofence fuel_low; do
  ALERT_ID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "alert-$RANDOM")
  NOW=$(date +%s%3N)
  SEV="medium"
  [ "$TYPE" == "fuel_low" ] && SEV="high"

  awslocal dynamodb put-item \
    --table-name Alerts \
    --item "{
      \"alertId\": {\"S\": \"${ALERT_ID}\"},
      \"vehicleId\": {\"S\": \"demo-vehicle-001\"},
      \"type\": {\"S\": \"${TYPE}\"},
      \"severity\": {\"S\": \"${SEV}\"},
      \"message\": {\"S\": \"Demo alert: ${TYPE} detected in Downtown area\"},
      \"zone\": {\"S\": \"Downtown\"},
      \"status\": {\"S\": \"open\"},
      \"createdAt\": {\"N\": \"${NOW}\"}
    }" \
    --region $REGION \
    2>/dev/null || true
done

echo "  Demo alerts seeded ✓"
echo ""
echo "=== LocalStack Init Complete ==="
echo "  DynamoDB: http://localhost:4566"
echo "  Kinesis:  telemetry-stream (2 shards)"
echo "  S3:       urbanmove-frontend, urbanmove-datalake"
echo ""
