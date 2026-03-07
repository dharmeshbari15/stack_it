# Reputation System Testing Script
$BASE_URL = "http://localhost:3000"

Write-Host "Starting Reputation System Tests..." -ForegroundColor Cyan

# Step 1: Get a question
Write-Host "`n[Test 1] Fetching questions..." -ForegroundColor Yellow
$questionsResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/questions?limit=5" -Method GET -UseBasicParsing
$questionsData = $questionsResponse.Content | ConvertFrom-Json

$question = $questionsData.data.questions[0]
$questionId = $question.id
$questionAuthorId = $question.author.id
Write-Host "Found question: $($question.title)" -ForegroundColor Green
Write-Host "Author: $($question.author.username) (ID: $questionAuthorId)" -ForegroundColor Green

#Get answer
$answer = $question.answers[0]
$answerId = $answer.id
$answerAuthorId = $answer.author.id
Write-Host "Found answer by: $($answer.author.username) (ID: $answerAuthorId)" -ForegroundColor Green

# Step 2: Register voter
Write-Host "`n[Test 2] Registering voter..." -ForegroundColor Yellow
$random = Get-Random -Maximum 10000
$voterData = @{
    username = "voter_$random"
    email = "voter$random@test.com"
    password = "Password123!"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/auth/register" -Method POST -Body $voterData -ContentType "application/json" -UseBasicParsing
$registerData = $registerResponse.Content | ConvertFrom-Json
$voterId = $registerData.data.user.id
Write-Host "Voter registered: $($registerData.data.user.username)" -ForegroundColor Green

# Setup session
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$cookies = $registerResponse.Headers['Set-Cookie']
if ($cookies) {
    $cookieValue = $cookies[0]
    $cookie = New-Object System.Net.Cookie
    $cookie.Name = $cookieValue.Split('=')[0]
    $cookie.Value = $cookieValue.Split('=')[1].Split(';')[0]
    $cookie.Domain = "localhost"
    $session.Cookies.Add($cookie)
}

# Step 3: Get initial reputation
Write-Host "`n[Test 3] Getting initial reputation..." -ForegroundColor Yellow
$authorResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/users/$questionAuthorId" -WebSession $session -UseBasicParsing
$authorData = $authorResponse.Content | ConvertFrom-Json
$initialRep = $authorData.data.reputation
Write-Host "Initial reputation: $initialRep" -ForegroundColor Green

# Step 4: Upvote question
Write-Host "`n[Test 4] Upvoting question..." -ForegroundColor Yellow
$voteData = @{ voteType = "upvote" } | ConvertTo-Json
$voteResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/questions/$questionId/vote" -Method POST -Body $voteData -ContentType "application/json" -WebSession $session -UseBasicParsing
$voteResult = $voteResponse.Content | ConvertFrom-Json

$authorResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/users/$questionAuthorId" -WebSession $session -UseBasicParsing
$authorData = $authorResponse.Content | ConvertFrom-Json
$afterUpvote = $authorData.data.reputation

Write-Host "Reputation: $initialRep -> $afterUpvote (Expected: +5)" -ForegroundColor $(if ($afterUpvote -eq $initialRep + 5) { "Green" } else { "Red" })
if ($afterUpvote -eq $initialRep + 5) {
    Write-Host "[PASS] Question upvote +5" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Question upvote" -ForegroundColor Red
}

# Step 5: Change to downvote
Write-Host "`n[Test 5] Changing to downvote..." -ForegroundColor Yellow
$voteData = @{ voteType = "downvote" } | ConvertTo-Json
$voteResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/questions/$questionId/vote" -Method POST -Body $voteData -ContentType "application/json" -WebSession $session -UseBasicParsing

$authorResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/users/$questionAuthorId" -WebSession $session -UseBasicParsing
$authorData = $authorResponse.Content | ConvertFrom-Json
$afterDownvote = $authorData.data.reputation

Write-Host "Reputation: $afterUpvote -> $afterDownvote (Expected: -7)" -ForegroundColor $(if ($afterDownvote -eq $afterUpvote - 7) { "Green" } else { "Red" })
if ($afterDownvote -eq $afterUpvote - 7) {
    Write-Host "[PASS] Question downvote -7 (removed +5, added -2)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Question downvote" -ForegroundColor Red
}

# Step 6: Remove vote
Write-Host "`n[Test 6] Removing vote..." -ForegroundColor Yellow
$voteResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/questions/$questionId/vote" -Method POST -Body $voteData -ContentType "application/json" -WebSession $session -UseBasicParsing

$authorResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/users/$questionAuthorId" -WebSession $session -UseBasicParsing
$authorData = $authorResponse.Content | ConvertFrom-Json
$afterRemove = $authorData.data.reputation

Write-Host "Reputation: $afterDownvote -> $afterRemove (Expected: back to $initialRep)" -ForegroundColor $(if ($afterRemove -eq $initialRep) { "Green" } else { "Red" })
if ($afterRemove -eq $initialRep) {
    Write-Host "[PASS] Vote removal +2 (removed -2)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Vote removal" -ForegroundColor Red
}

# Step 7: Upvote answer
Write-Host "`n[Test 7] Upvoting answer..." -ForegroundColor Yellow
$answerAuthorResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/users/$answerAuthorId" -WebSession $session -UseBasicParsing
$answerAuthorData = $answerAuthorResponse.Content | ConvertFrom-Json
$answerInitialRep = $answerAuthorData.data.reputation
Write-Host "Answer author initial reputation: $answerInitialRep" -ForegroundColor White

$answerVoteData = @{ voteType = "upvote" } | ConvertTo-Json
$answerVoteResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/answers/$answerId/vote" -Method POST -Body $answerVoteData -ContentType "application/json" -WebSession $session -UseBasicParsing

$answerAuthorResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/users/$answerAuthorId" -WebSession $session -UseBasicParsing
$answerAuthorData = $answerAuthorResponse.Content | ConvertFrom-Json
$answerAfterRep = $answerAuthorData.data.reputation

Write-Host "Reputation: $answerInitialRep -> $answerAfterRep (Expected: +10)" -ForegroundColor $(if ($answerAfterRep -eq $answerInitialRep + 10) { "Green" } else { "Red" })
if ($answerAfterRep -eq $answerInitialRep + 10) {
    Write-Host "[PASS] Answer upvote +10" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Answer upvote" -ForegroundColor Red
}

# Step 8: Test leaderboard
Write-Host "`n[Test 8] Testing leaderboard..." -ForegroundColor Yellow
$leaderboardResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/leaderboard?limit=5" -UseBasicParsing
$leaderboardData = $leaderboardResponse.Content | ConvertFrom-Json

if ($leaderboardData.success) {
    Write-Host "[PASS] Leaderboard working" -ForegroundColor Green
    Write-Host "Top 5 users:" -ForegroundColor White
    $leaderboardData.data.leaderboard | ForEach-Object {
        Write-Host "  $($_.rank). $($_.username) - $($_.reputation) pts ($($_.level.level))" -ForegroundColor White
    }
}

# Step 9: Test reputation history
Write-Host "`n[Test 9] Testing reputation history..." -ForegroundColor Yellow
$historyResponse = Invoke-WebRequest -Uri "$BASE_URL/api/v1/users/$questionAuthorId/reputation-history?limit=10" -UseBasicParsing
$historyData = $historyResponse.Content | ConvertFrom-Json

if ($historyData.success) {
    Write-Host "[PASS] Reputation history working" -ForegroundColor Green
    Write-Host "User: $($historyData.data.user.username), Current: $($historyData.data.user.current_reputation)" -ForegroundColor White
    Write-Host "Recent changes:" -ForegroundColor White
    $historyData.data.history | ForEach-Object {
        $sign = if ($_.amount -ge 0) { "+" } else { "" }
        Write-Host "  - $($_.description): $sign$($_.amount)" -ForegroundColor White
    }
}

Write-Host "`nAll tests completed!" -ForegroundColor Cyan
