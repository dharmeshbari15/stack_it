Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing Bounty and Edit History Features" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api/v1"

Write-Host "Testing endpoints are available...`n" -ForegroundColor Yellow

# Test 1: List bounties (public endpoint)
Write-Host "Test 1: GET /questions/1/bounties" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/questions/1/bounties" -Method GET -ErrorAction Stop
    Write-Host "  PASSED: Response received" -ForegroundColor Green
    Write-Host "  Data: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "  Status: $status - $($_.Exception.Message)" -ForegroundColor DarkYellow
}
Write-Host ""

# Test 2: Get question versions
Write-Host "Test 2: GET /questions/1/versions" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/questions/1/versions" -Method GET -ErrorAction Stop
    Write-Host "  PASSED: Response received" -ForegroundColor Green
    Write-Host "  Data: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "  Status: $status - $($_.Exception.Message)" -ForegroundColor DarkYellow
}
Write-Host ""

# Test 3: Get answer versions
Write-Host "Test 3: GET /answers/1/versions" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/answers/1/versions" -Method GET -ErrorAction Stop
    Write-Host "  PASSED: Response received" -ForegroundColor Green
    Write-Host "  Data: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "  Status: $status - $($_.Exception.Message)" -ForegroundColor DarkYellow
}
Write-Host ""

# Test 4: Get diff between versions
Write-Host "Test 4: GET /versions/diff (with query params)" -ForegroundColor Yellow
$diffUrl = "$baseUrl/versions/diff?type=question" + "&entity_id=1" + "&from_version=1" + "&to_version=2"
try {
    $response = Invoke-RestMethod -Uri $diffUrl -Method GET -ErrorAction Stop
    Write-Host "  PASSED: Response received" -ForegroundColor Green
    Write-Host "  Data: $($response | ConvertTo-Json -Compress -Depth 3)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "  Status: $status - $($_.Exception.Message)" -ForegroundColor DarkYellow
}
Write-Host ""

# Test 5: Offer bounty (requires auth)
Write-Host "Test 5: POST /questions/1/bounties (requires auth)" -ForegroundColor Yellow
$bountyBody = @{
    amount = 50
    expires_in_days = 7
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/questions/1/bounties" -Method POST -Body $bountyBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "  PASSED: Bounty created" -ForegroundColor Green
    Write-Host "  Data: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401) {
        Write-Host "  EXPECTED: 401 Unauthorized (login required)" -ForegroundColor DarkYellow
    } else {
        Write-Host "  Status: $status - $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}
Write-Host ""

# Test 6: Award bounty (requires auth)
Write-Host "Test 6: POST /bounties/1/award (requires auth)" -ForegroundColor Yellow
$awardBody = @{ answer_id = 1 } | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/bounties/1/award" -Method POST -Body $awardBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "  PASSED: Bounty awarded" -ForegroundColor Green
    Write-Host "  Data: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401) {
        Write-Host "  EXPECTED: 401 Unauthorized (login required)" -ForegroundColor DarkYellow
    } else {
        Write-Host "  Status: $status - $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}
Write-Host ""

# Test 7: Rollback version (requires auth)
Write-Host "Test 7: POST /versions/rollback (requires auth)" -ForegroundColor Yellow
$rollbackBody = @{
    type = "question"
    entity_id = 1
    version_number = 1
} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/versions/rollback" -Method POST -Body $rollbackBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "  PASSED: Rollback successful" -ForegroundColor Green
    Write-Host "  Data: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401) {
        Write-Host "  EXPECTED: 401 Unauthorized (login required)" -ForegroundColor DarkYellow
    } else {
        Write-Host "  Status: $status - $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}
Write-Host ""

# Test 8: Cancel bounty (requires auth)
Write-Host "Test 8: DELETE /bounties/1 (requires auth)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/bounties/1" -Method DELETE -ErrorAction Stop
    Write-Host "  PASSED: Bounty cancelled" -ForegroundColor Green
    Write-Host "  Data: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401) {
        Write-Host "  EXPECTED: 401 Unauthorized (login required)" -ForegroundColor DarkYellow
    } else {
        Write-Host "  Status: $status - $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Public endpoints tested: 4" -ForegroundColor White
Write-Host "Auth-required endpoints: 4 (will return 401 if not logged in)" -ForegroundColor White
Write-Host "`nNote: To test authenticated endpoints, you need to:" -ForegroundColor Yellow
Write-Host "  1. Login at http://localhost:3000/login" -ForegroundColor Yellow
Write-Host "  2. Manually test features through the UI" -ForegroundColor Yellow
Write-Host "  3. Or add session cookie to the test script`n" -ForegroundColor Yellow
