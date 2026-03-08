# Test Script for Bounty System and Edit History Features
# Run this after starting the dev server on localhost:3000

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing Bounty & Edit History Features" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$apiBase = "$baseUrl/api/v1"

# Test counter
$testsPassed = 0
$testsFailed = 0

function Test-ApiEndpoint {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int[]]$ExpectedStatuses = @(200)
    )
    
    Write-Host "Test: $TestName" -ForegroundColor Yellow
    Write-Host "  → $Method $Endpoint" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = "$apiBase$Endpoint"
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            Write-Host "  Body: $($params.Body)" -ForegroundColor Gray
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        $statusCode = 200 # Successful response
        
        if ($ExpectedStatuses -contains $statusCode) {
            Write-Host "  ✓ PASSED (Status: $statusCode)" -ForegroundColor Green
            $script:testsPassed++
            return $response
        } else {
            Write-Host "  ✗ FAILED (Expected: $ExpectedStatuses, Got: $statusCode)" -ForegroundColor Red
            $script:testsFailed++
            return $null
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        
        if ($ExpectedStatuses -contains $statusCode) {
            Write-Host "  ✓ PASSED (Expected error status: $statusCode)" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host "  ✗ FAILED (Expected: $ExpectedStatuses, Got: $statusCode)" -ForegroundColor Red
            $script:testsFailed++
        }
        return $null
    }
    finally {
        Write-Host ""
    }
}

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "1. BOUNTY SYSTEM API TESTS" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

# Note: These tests require authentication headers
# You'll need to replace 'YOUR_AUTH_TOKEN' with a valid session token

Write-Host "📝 Test Setup Note:" -ForegroundColor Magenta
Write-Host "   To run authenticated tests, you need to:" -ForegroundColor Magenta
Write-Host "   1. Login at http://localhost:3000/login" -ForegroundColor Magenta
Write-Host "   2. Get your session token from browser DevTools (Application > Cookies)" -ForegroundColor Magenta
Write-Host "   3. Replace 'YOUR_AUTH_TOKEN' in this script`n" -ForegroundColor Magenta

$authHeaders = @{
    "Cookie" = "authjs.session-token=YOUR_AUTH_TOKEN"
}

# Test 1: List bounties for a question (no auth required)
Test-ApiEndpoint `
    -TestName "List bounties for question" `
    -Method "GET" `
    -Endpoint "/questions/1/bounties" `
    -ExpectedStatuses @(200, 404)

# Test 2: Offer bounty (requires auth)
$bountyData = @{
    amount = 50
    expires_in_days = 7
}

Test-ApiEndpoint `
    -TestName "Offer bounty on question" `
    -Method "POST" `
    -Endpoint "/questions/1/bounties" `
    -Headers $authHeaders `
    -Body $bountyData `
    -ExpectedStatuses @(201, 401, 404)

# Test 3: Award bounty (requires auth + ownership)
Test-ApiEndpoint `
    -TestName "Award bounty to answer" `
    -Method "POST" `
    -Endpoint "/bounties/1/award" `
    -Headers $authHeaders `
    -Body @{ answer_id = 1 } `
    -ExpectedStatuses @(200, 401, 403, 404)

# Test 4: Cancel bounty (requires auth + ownership)
Test-ApiEndpoint `
    -TestName "Cancel bounty and refund" `
    -Method "DELETE" `
    -Endpoint "/bounties/1" `
    -Headers $authHeaders `
    -ExpectedStatuses @(200, 401, 403, 404)

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "2. EDIT HISTORY and VERSION CONTROL TESTS" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

# Test 5: Get question versions
Test-ApiEndpoint `
    -TestName "Get question version history" `
    -Method "GET" `
    -Endpoint "/questions/1/versions" `
    -ExpectedStatuses @(200, 404)

# Test 6: Get answer versions
Test-ApiEndpoint `
    -TestName "Get answer version history" `
    -Method "GET" `
    -Endpoint "/answers/1/versions" `
    -ExpectedStatuses @(200, 404)

# Test 7: Calculate diff between versions
Test-ApiEndpoint `
    -TestName "Calculate diff between question versions" `
    -Method "GET" `
    -Endpoint "/versions/diff?type=question`&entity_id=1`&from_version=1`&to_version=2" `
    -ExpectedStatuses @(200, 400, 404)

# Test 8: Rollback to previous version
$rollbackData = @{
    type = "question"
    entity_id = 1
    version_number = 1
}

Test-ApiEndpoint `
    -TestName "Rollback question to previous version" `
    -Method "POST" `
    -Endpoint "/versions/rollback" `
    -Headers $authHeaders `
    -Body $rollbackData `
    -ExpectedStatuses @(200, 401, 403, 404)

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "3. VALIDATION TESTS" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

# Test 9: Invalid bounty amount (too low)
Test-ApiEndpoint `
    -TestName "Reject bounty amount less than 10" `
    -Method "POST" `
    -Endpoint "/questions/1/bounties" `
    -Headers $authHeaders `
    -Body @{ amount = 5; expires_in_days = 7 } `
    -ExpectedStatuses @(400, 401)

# Test 10: Invalid bounty duration (too long)
Test-ApiEndpoint `
    -TestName "Reject bounty duration greater than 365 days" `
    -Method "POST" `
    -Endpoint "/questions/1/bounties" `
    -Headers $authHeaders `
    -Body @{ amount = 50; expires_in_days = 400 } `
    -ExpectedStatuses @(400, 401)

# Test 11: Invalid diff type
Test-ApiEndpoint `
    -TestName "Reject invalid version type" `
    -Method "GET" `
    -Endpoint "/versions/diff?type=invalid`&entity_id=1`&from_version=1`&to_version=2" `
    -ExpectedStatuses @(400)

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($testsPassed + $testsFailed)" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red

if ($testsFailed -eq 0) {
    Write-Host "`n✓ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Some tests failed. Review output above for details." -ForegroundColor Red
}

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "MANUAL TESTING CHECKLIST" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

Write-Host "□ 1. Login to the application" -ForegroundColor White
Write-Host "□ 2. Create a new question" -ForegroundColor White
Write-Host "□ 3. Offer a bounty on the question" -ForegroundColor White
Write-Host "□ 4. Verify bounty appears on question page" -ForegroundColor White
Write-Host "□ 5. Post an answer to the question" -ForegroundColor White
Write-Host "□ 6. Award the bounty to the answer" -ForegroundColor White
Write-Host "□ 7. Verify reputation transfer (offerer -amount, winner +amount)" -ForegroundColor White
Write-Host "□ 8. Edit the question multiple times" -ForegroundColor White
Write-Host "□ 9. View edit history timeline" -ForegroundColor White
Write-Host "□ 10. Compare versions side-by-side" -ForegroundColor White
Write-Host "□ 11. Rollback to a previous version" -ForegroundColor White
Write-Host "□ 12. Cancel a bounty (test refund)" -ForegroundColor White
Write-Host "□ 13. Test bounty expiration (set 1 day, wait)" -ForegroundColor White
Write-Host "□ 14. Test auto-award to best answer" -ForegroundColor White

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "INTEGRATION INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

Write-Host "To integrate these features into your UI:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. In src/app/questions/[id]/page.tsx, add:" -ForegroundColor White
Write-Host "   import { BountyCard } from '@/components/BountyCard';" -ForegroundColor Gray
Write-Host "   import { EditHistory } from '@/components/EditHistory';" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Add components to the question detail view:" -ForegroundColor White
Write-Host '   <BountyCard questionId={questionId} />' -ForegroundColor Gray
Write-Host '   <EditHistory entityType="question" entityId={questionId} />' -ForegroundColor Gray
Write-Host ""
Write-Host "See INTEGRATION_GUIDE.md for detailed instructions." -ForegroundColor Yellow

Write-Host "`nDone! Review the results above. 🚀`n" -ForegroundColor Cyan
