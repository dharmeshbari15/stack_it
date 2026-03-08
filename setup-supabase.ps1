# Supabase Database Setup Guide
# This script will help you configure your Supabase database for production

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Supabase Database Setup for StackIt Production       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📋 Step 1: Get Your Supabase Connection String" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "1. Go to: https://app.supabase.com" -ForegroundColor White
Write-Host "2. Select your project (or create a new one)" -ForegroundColor White
Write-Host "3. Go to: Settings → Database" -ForegroundColor White
Write-Host "4. Scroll to 'Connection String'" -ForegroundColor White
Write-Host "5. Select 'Connection pooling' (⚠️ IMPORTANT: Use port 6543)" -ForegroundColor White
Write-Host "6. Copy the connection string (looks like: postgresql://postgres.[ref]:[password]@...supabase.com:6543/postgres)" -ForegroundColor White
Write-Host ""

# Prompt for Supabase URL
$supabaseUrl = Read-Host "`n🔗 Paste your Supabase DATABASE_URL here"

if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "❌ No URL provided. Exiting setup." -ForegroundColor Red
    exit 1
}

# Validate URL format
if (-not ($supabaseUrl -match "supabase\.com" -or $supabaseUrl -match "postgresql://")) {
    Write-Host "⚠️ Warning: URL doesn't look like a Supabase connection string" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Setup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Check if port 6543 is used (pooling)
if ($supabaseUrl -match ":6543") {
    Write-Host "✓ Using connection pooling (port 6543) - Good!" -ForegroundColor Green
} elseif ($supabaseUrl -match ":5432") {
    Write-Host "⚠️ WARNING: Using direct connection (port 5432)" -ForegroundColor Yellow
    Write-Host "   For Vercel deployment, you should use connection pooling (port 6543)" -ForegroundColor Yellow
    Write-Host "   Prisma will consume connection pooling efficiently." -ForegroundColor Yellow
}

# Store in environment variable
$env:DATABASE_URL = $supabaseUrl
Write-Host "`n✓ DATABASE_URL set in current PowerShell session" -ForegroundColor Green

Write-Host "`n📋 Step 2: Push Database Schema to Supabase" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "Running: npx prisma db push" -ForegroundColor Cyan
Write-Host "(This will create all tables: User, Question, Answer, Tag, Vote, Comment, etc.)" -ForegroundColor Gray
Write-Host ""

$pushConfirm = Read-Host "Ready to push schema to Supabase? (y/n)"
if ($pushConfirm -ne "y") {
    Write-Host "Skipping schema push. You can run it manually later:" -ForegroundColor Yellow
    Write-Host "  npx prisma db push" -ForegroundColor Gray
} else {
    try {
        npx prisma db push
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✓ Database schema pushed successfully!" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Schema push failed. Check the error above." -ForegroundColor Red
            Write-Host "Common issues:" -ForegroundColor Yellow
            Write-Host "  - Wrong password in connection string" -ForegroundColor Gray
            Write-Host "  - Firewall blocking connection" -ForegroundColor Gray
            Write-Host "  - Database not accessible" -ForegroundColor Gray
            exit 1
        }
    } catch {
        Write-Host "`n❌ Error running prisma db push: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n📋 Step 3: Set Vercel Environment Variables" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# Check if vercel CLI is available
try {
    $vercelVersion = vercel --version 2>$null
    Write-Host "✓ Vercel CLI detected: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "  npm install -g vercel" -ForegroundColor Gray
    exit 1
}

# Check if we have AUTH_SECRET
if ($env:PROD_AUTH_SECRET) {
    $authSecret = $env:PROD_AUTH_SECRET
    Write-Host "✓ Using AUTH_SECRET from PROD_AUTH_SECRET environment variable" -ForegroundColor Green
} else {
    Write-Host "`nGenerating new AUTH_SECRET..." -ForegroundColor Cyan
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $authSecret = [Convert]::ToBase64String($bytes)
    Write-Host "✓ Generated: $authSecret" -ForegroundColor Green
    $env:PROD_AUTH_SECRET = $authSecret
}

Write-Host "`nI will set these environment variables in Vercel:" -ForegroundColor White
Write-Host "  1. DATABASE_URL = $($supabaseUrl.Substring(0, 50))..." -ForegroundColor Gray
Write-Host "  2. AUTH_SECRET = $($authSecret.Substring(0, 20))..." -ForegroundColor Gray
Write-Host "  3. AUTH_URL = (your Vercel production URL)" -ForegroundColor Gray
Write-Host "  4. AUTH_TRUST_HOST = true" -ForegroundColor Gray
Write-Host ""

$authUrl = Read-Host "`n🌐 Enter your Vercel production URL (e.g., https://your-app.vercel.app)"
if ([string]::IsNullOrWhiteSpace($authUrl)) {
    Write-Host "❌ AUTH_URL is required. Exiting." -ForegroundColor Red
    exit 1
}

# Ensure AUTH_URL has https://
if (-not $authUrl.StartsWith("http")) {
    $authUrl = "https://$authUrl"
    Write-Host "✓ Added https:// prefix: $authUrl" -ForegroundColor Green
}

Write-Host "`n🚀 Setting Vercel environment variables..." -ForegroundColor Cyan

# Set DATABASE_URL
Write-Host "Setting DATABASE_URL..." -ForegroundColor Gray
vercel env add DATABASE_URL production --yes --force --value "$supabaseUrl"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ DATABASE_URL set" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to set DATABASE_URL" -ForegroundColor Red
}

# Set AUTH_SECRET
Write-Host "Setting AUTH_SECRET..." -ForegroundColor Gray
vercel env add AUTH_SECRET production --yes --force --value "$authSecret"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ AUTH_SECRET set" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to set AUTH_SECRET" -ForegroundColor Red
}

# Set AUTH_URL
Write-Host "Setting AUTH_URL..." -ForegroundColor Gray
vercel env add AUTH_URL production --yes --force --value "$authUrl"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ AUTH_URL set" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to set AUTH_URL" -ForegroundColor Red
}

# Set AUTH_TRUST_HOST
Write-Host "Setting AUTH_TRUST_HOST..." -ForegroundColor Gray
vercel env add AUTH_TRUST_HOST production --yes --force --value "true"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ AUTH_TRUST_HOST set" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to set AUTH_TRUST_HOST" -ForegroundColor Red
}

Write-Host "`n📋 Step 4: Deploy to Vercel Production" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

$deployConfirm = Read-Host "Ready to deploy to production? (y/n)"
if ($deployConfirm -ne "y") {
    Write-Host "`nSetup complete! Deploy later with:" -ForegroundColor Yellow
    Write-Host "  vercel --prod" -ForegroundColor Gray
    exit 0
}

Write-Host "`n🚀 Deploying to production..." -ForegroundColor Cyan
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              🎉 DEPLOYMENT SUCCESSFUL! 🎉                 ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Database schema migrated to Supabase" -ForegroundColor Green
    Write-Host "✅ Environment variables configured" -ForegroundColor Green
    Write-Host "✅ Production deployment complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Test your deployment:" -ForegroundColor Cyan
    Write-Host "  1. Visit: $authUrl/register" -ForegroundColor White
    Write-Host "  2. Create a test account" -ForegroundColor White
    Write-Host "  3. Try logging in at: $authUrl/login" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Monitor your app:" -ForegroundColor Cyan
    Write-Host "  - Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "  - Supabase Dashboard: https://app.supabase.com" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "`n❌ Deployment failed. Check the error above." -ForegroundColor Red
    Write-Host "You can retry with: vercel --prod" -ForegroundColor Yellow
}
