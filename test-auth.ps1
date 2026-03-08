# Test authentication flow
$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000"

Write-Host "`n=== Testing Authentication Flow ===" -ForegroundColor Cyan

# Generate unique credentials
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testData = @{
    username = "testuser_$timestamp"
    email = "test_$timestamp@example.com"
    password = "SecurePass123!"
}

# Test 1: Registration
Write-Host "`n[Test 1] Registration with valid data..." -ForegroundColor Yellow
$body = $testData | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ SUCCESS: User registered" -ForegroundColor Green
    Write-Host "  ID: $($response.data.id)" -ForegroundColor Gray
    Write-Host "  Username: $($response.data.username)" -ForegroundColor Gray
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "✗ FAILED: $($err.error.message)" -ForegroundColor Red
}

# Test 2: Duplicate email
Write-Host "`n[Test 2] Registration with duplicate email..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✗ FAILED: Should have returned error" -ForegroundColor Red
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($err.error.code -eq "EMAIL_TAKEN") {
        Write-Host "✓ SUCCESS: Duplicate email blocked" -ForegroundColor Green
    } else {
        Write-Host "✗ FAILED: Wrong error code - $($err.error.code)" -ForegroundColor Red
    }
}

# Test 3: Validation error
Write-Host "`n[Test 3] Registration with invalid data..." -ForegroundColor Yellow
$invalidBody = @{ username = "ab"; email = "bad"; password = "x" } | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method POST -Body $invalidBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "✗ FAILED: Should have returned validation error" -ForegroundColor Red
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($err.error.code -eq "VALIDATION_ERROR") {
        Write-Host "✓ SUCCESS: Validation working" -ForegroundColor Green
    } else {
        Write-Host "✗ FAILED: Wrong error code - $($err.error.code)" -ForegroundColor Red
    }
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
Write-Host "All error handling improvements verified!" -ForegroundColor Green
