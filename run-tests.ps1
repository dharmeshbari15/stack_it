# Test Runner Script
# Executes all test suites and generates reports

Write-Host "🚀 StackIt Test Suite Runner" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$TEST_DB_URL = "postgresql://postgres:postgres@localhost:5432/stack_it_test"
$env:DATABASE_URL = $TEST_DB_URL
$env:NODE_ENV = "test"

# Colors for output
function Write-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error-Message {
    param([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Info {
    param([string]$message)
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Write-Warning-Message {
    param([string]$message)
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

# Step 1: Check Prerequisites
Write-Host ""
Write-Info "Checking prerequisites..."

# Check if PostgreSQL is running
Write-Info "Checking PostgreSQL connection..."
try {
    docker exec stackit-postgres pg_isready -U postgres 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "PostgreSQL is running"
    } else {
        Write-Error-Message "PostgreSQL is not running. Please start it first."
        exit 1
    }
} catch {
    Write-Warning-Message "Could not verify PostgreSQL. Continuing anyway..."
}

# Step 2: Setup Test Database
Write-Host ""
Write-Info "Setting up test database..."

# Create test database if it doesn't exist
docker exec stackit-postgres psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'stack_it_test'" | Where-Object { $_ -match '1' } | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Info "Creating test database..."
    docker exec stackit-postgres psql -U postgres -c "CREATE DATABASE stack_it_test"
    Write-Success "Test database created"
} else {
    Write-Success "Test database already exists"
}

# Run migrations on test database
Write-Info "Running database migrations..."
$env:DATABASE_URL = $TEST_DB_URL
npx prisma db push --schema=./prisma/schema.prisma --skip-generate 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Success "Database migrations completed"
} else {
    Write-Warning-Message "Migration may have failed, continuing anyway..."
}

# Generate Prisma Client
Write-Info "Generating Prisma Client..."
npx prisma generate 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Prisma Client generated"
}

# Step 3: Run Tests
Write-Host ""
Write-Host "🧪 Running Test Suites" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = 0
$passedTests = 0
$failedTests = 0

# Function to run test file
function Run-TestFile {
    param([string]$testFile, [string]$description)
    
    Write-Host ""
    Write-Host "📝 $description" -ForegroundColor Yellow
    Write-Host "   File: $testFile" -ForegroundColor Gray
    
    $startTime = Get-Date
    
    # Run the test
    npm test $testFile 2>&1 | Out-String | ForEach-Object {
        Write-Host $_
    }
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Passed in $([math]::Round($duration, 2))s"
        return $true
    } else {
        Write-Error-Message "Failed in $([math]::Round($duration, 2))s"
        return $false
    }
}

# Test Suite 1: Unit Tests
Write-Host ""
Write-Host "📦 Unit Tests" -ForegroundColor Magenta
Write-Host "----------------------------" -ForegroundColor Magenta

$unitTests = @(
    @{
        file = "src/lib/auth.test.ts"
        desc = "Authentication & Security Tests"
    },
    @{
        file = "src/lib/questions.test.ts"
        desc = "Questions Service Tests"
    },
    @{
        file = "src/lib/answers-voting.test.ts"
        desc = "Answers & Voting Tests"
    },
    @{
        file = "src/lib/reputation.test.ts"
        desc = "Reputation System Tests"
    },
    @{
        file = "src/lib/features.test.ts"
        desc = "Bookmarks, Notifications, Tags & Follow Tests"
    },
    @{
        file = "src/lib/comments.test.ts"
        desc = "Comments System Tests"
    },
    @{
        file = "src/lib/follow.test.ts"
        desc = "Follow System Tests"
    }
)

foreach ($test in $unitTests) {
    $result = Run-TestFile -testFile $test.file -description $test.desc
    $totalTests++
    if ($result) {
        $passedTests++
    } else {
        $failedTests++
    }
}

# Test Suite 2: Integration Tests
Write-Host ""
Write-Host "🔗 Integration Tests" -ForegroundColor Magenta
Write-Host "----------------------------" -ForegroundColor Magenta

$integrationTests = @(
    @{
        file = "src/lib/api-integration.test.ts"
        desc = "API Routes Integration Tests"
    }
)

foreach ($test in $integrationTests) {
    $result = Run-TestFile -testFile $test.file -description $test.desc
    $totalTests++
    if ($result) {
        $passedTests++
    } else {
        $failedTests++
    }
}

# Test Suite 3: E2E Tests
Write-Host ""
Write-Host "🎯 End-to-End Tests" -ForegroundColor Magenta
Write-Host "----------------------------" -ForegroundColor Magenta

$e2eTests = @(
    @{
        file = "src/lib/e2e-workflows.test.ts"
        desc = "Complete User Workflow Tests"
    }
)

foreach ($test in $e2eTests) {
    $result = Run-TestFile -testFile $test.file -description $test.desc
    $totalTests++
    if ($result) {
        $passedTests++
    } else {
        $failedTests++
    }
}

# Step 4: Generate Test Report
Write-Host ""
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }

Write-Host "Total Test Suites: $totalTests"
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
Write-Host ""

# Coverage (if available)
Write-Info "Test coverage report can be generated with: npm test -- --coverage"

# Clean up
Write-Host ""
Write-Info "Cleaning up test database..."
# Optionally drop test database
# docker exec stackit-postgres psql -U postgres -c "DROP DATABASE IF EXISTS stack_it_test"

# Exit with appropriate code
if ($failedTests -gt 0) {
    Write-Host ""
    Write-Error-Message "Some tests failed. Please review the output above."
    exit 1
} else {
    Write-Host ""
    Write-Success "All tests passed! 🎉"
    exit 0
}
