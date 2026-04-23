$ErrorActionPreference = "Continue"

$AWS_ENDPOINT = "http://localhost:4566"
$REGION = "us-east-1"
$ACCOUNT_ID = "000000000000"

Write-Host "=== UrbanMove LocalStack Init ==="

# â”€â”€â”€ DynamoDB Tables â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "[1/5] Creating DynamoDB tables..."

# Vehicles table
awslocal dynamodb create-table `
  --table-name Vehicles `
  --attribute-definitions `
    AttributeName=vehicleId,AttributeType=S `
  --key-schema AttributeName=vehicleId,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region $REGION `
  --no-cli-pager 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  Vehicles table already exists" }

# Telemetry table (vehicleId + timestamp as composite key)
awslocal dynamodb create-table `
  --table-name Telemetry `
  --attribute-definitions `
    AttributeName=vehicleId,AttributeType=S `
    AttributeName=timestamp,AttributeType=N `
  --key-schema `
    AttributeName=vehicleId,KeyType=HASH `
    AttributeName=timestamp,KeyType=RANGE `
  --billing-mode PAY_PER_REQUEST `
  --region $REGION `
  --no-cli-pager 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  Telemetry table already exists" }

# Routes table
awslocal dynamodb create-table `
  --table-name Routes `
  --attribute-definitions `
    AttributeName=routeId,AttributeType=S `
  --key-schema AttributeName=routeId,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region $REGION `
  --no-cli-pager 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  Routes table already exists" }

# Alerts table
awslocal dynamodb create-table `
  --table-name Alerts `
  --attribute-definitions `
    AttributeName=alertId,AttributeType=S `
  --key-schema AttributeName=alertId,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region $REGION `
  --no-cli-pager 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  Alerts table already exists" }

Write-Host "  DynamoDB tables created [OK]"

# â”€â”€â”€ Kinesis Stream â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "[2/5] Creating Kinesis stream..."

awslocal kinesis create-stream `
  --stream-name telemetry-stream `
  --shard-count 2 `
  --region $REGION `
  --no-cli-pager 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  Stream already exists" }

Write-Host "  Kinesis stream created [OK]"

# â”€â”€â”€ S3 Buckets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "[3/5] Creating S3 buckets..."

awslocal s3 mb s3://urbanmove-frontend --region $REGION 2>$null
awslocal s3 mb s3://urbanmove-datalake --region $REGION 2>$null

# Enable static website hosting for frontend bucket
awslocal s3 website s3://urbanmove-frontend `
  --index-document index.html `
  --error-document index.html 2>$null

Write-Host "  S3 buckets created [OK]"

# â”€â”€â”€ Seed Demo Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "[4/5] Seeding demo vehicles..."

$ZONES = @("Downtown", "District 2", "District 7", "Binh Thanh", "Tan Binh")
$TYPES = @("bus", "truck", "van", "car", "motorcycle")
$DRIVERS = @("Nguyen Van A", "Tran Thi B", "Le Van C", "Pham Thi D", "Hoang Van E", "Vo Thi F", "Dang Van G", "Bui Thi H", "Do Van I", "Ngo Thi K")

for ($i = 1; $i -le 15; $i++) {
    $VEHICLE_ID = [guid]::NewGuid().ToString()
    $ZONE = $ZONES[(Get-Random -Maximum 5)]
    $TYPE = $TYPES[(Get-Random -Maximum 5)]
    $DRIVER = $DRIVERS[(Get-Random -Maximum 10)]
    
    # 51A-xxxxx plate
    $PLATE = "51A-" + (Get-Random -Minimum 10000 -Maximum 99999).ToString()
    
    $LAT = [math]::Round(10.7769 + ((Get-Random -Minimum -1000 -Maximum 1000) / 100000.0), 6).ToString("0.000000", [System.Globalization.CultureInfo]::InvariantCulture)
    $LNG = [math]::Round(106.7009 + ((Get-Random -Minimum -1000 -Maximum 1000) / 100000.0), 6).ToString("0.000000", [System.Globalization.CultureInfo]::InvariantCulture)
    $SPEED = (Get-Random -Maximum 80).ToString()
    $FUEL = (Get-Random -Minimum 40 -Maximum 100).ToString()
    $NOW = [DateTimeOffset]::Now.ToUnixTimeMilliseconds().ToString()
    $HEADING = (Get-Random -Maximum 360).ToString()

    $ITEM_OBJ = @{
        vehicleId = @{ S = $VEHICLE_ID }
        plateNumber = @{ S = $PLATE }
        type = @{ S = $TYPE }
        driverName = @{ S = $DRIVER }
        zone = @{ S = $ZONE }
        status = @{ S = "active" }
        lat = @{ N = $LAT }
        lng = @{ N = $LNG }
        speed = @{ N = $SPEED }
        heading = @{ N = $HEADING }
        fuelLevel = @{ N = $FUEL }
        createdAt = @{ N = $NOW }
        updatedAt = @{ N = $NOW }
    }
    $ITEM_JSON = $ITEM_OBJ | ConvertTo-Json -Depth 5 -Compress

    # Use a temp file to avoid quote escaping issues with AWS CLI on Windows
    $tempFile = New-TemporaryFile
    $ITEM_JSON | Set-Content -Path $tempFile.FullName -Encoding UTF8
    
    awslocal dynamodb put-item `
      --table-name Vehicles `
      --item file://$($tempFile.FullName) `
      --region $REGION `
      --no-cli-pager 2>$null
      
    Remove-Item -Path $tempFile.FullName
}

Write-Host "  Demo vehicles seeded [OK]"

# Seed some alerts
Write-Host "[5/5] Seeding demo alerts..."

$ALERT_TYPES = @("speeding", "geofence", "fuel_low")

foreach ($TYPE in $ALERT_TYPES) {
    $ALERT_ID = [guid]::NewGuid().ToString()
    $NOW = [DateTimeOffset]::Now.ToUnixTimeMilliseconds().ToString()
    $SEV = if ($TYPE -eq "fuel_low") { "high" } else { "medium" }

    $ALERT_OBJ = @{
        alertId = @{ S = $ALERT_ID }
        vehicleId = @{ S = "demo-vehicle-001" }
        type = @{ S = $TYPE }
        severity = @{ S = $SEV }
        message = @{ S = "Demo alert: $TYPE detected in Downtown area" }
        zone = @{ S = "Downtown" }
        status = @{ S = "open" }
        createdAt = @{ N = $NOW }
    }
    $ALERT_JSON = $ALERT_OBJ | ConvertTo-Json -Depth 5 -Compress

    $tempFile = New-TemporaryFile
    $ALERT_JSON | Set-Content -Path $tempFile.FullName -Encoding UTF8

    awslocal dynamodb put-item `
      --table-name Alerts `
      --item file://$($tempFile.FullName) `
      --region $REGION `
      --no-cli-pager 2>$null
      
    Remove-Item -Path $tempFile.FullName
}

Write-Host "  Demo alerts seeded [OK]"
Write-Host ""
Write-Host "=== LocalStack Init Complete ==="
Write-Host "  DynamoDB: http://localhost:4566"
Write-Host "  Kinesis:  telemetry-stream (2 shards)"
Write-Host "  S3:       urbanmove-frontend, urbanmove-datalake"
Write-Host ""
