$ErrorActionPreference = "Continue"
$REGION = "us-east-1"

Write-Host "=== UrbanMove Production DynamoDB Seed ==="

# ─── Seed Demo Data ────────────────────────────────────────────────────────────
Write-Host "Seeding demo vehicles..."

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

    # Use a temp file with UTF-8 without BOM to avoid quote escaping issues
    $tempFile = New-TemporaryFile
    $utf8NoBom = New-Object System.Text.UTF8Encoding $False
    [System.IO.File]::WriteAllText($tempFile.FullName, $ITEM_JSON, $utf8NoBom)
    
    aws dynamodb put-item `
      --table-name Vehicles `
      --item file://$($tempFile.FullName) `
      --region $REGION `
      --no-cli-pager 2>$null
      
    Remove-Item -Path $tempFile.FullName
}

Write-Host "  Demo vehicles seeded [OK]"

# Seed some alerts
Write-Host "Seeding demo alerts..."

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
    $utf8NoBom = New-Object System.Text.UTF8Encoding $False
    [System.IO.File]::WriteAllText($tempFile.FullName, $ALERT_JSON, $utf8NoBom)

    aws dynamodb put-item `
      --table-name Alerts `
      --item file://$($tempFile.FullName) `
      --region $REGION `
      --no-cli-pager 2>$null
      
    Remove-Item -Path $tempFile.FullName
}

Write-Host "  Demo alerts seeded [OK]"
Write-Host "=== Seed Complete ==="
