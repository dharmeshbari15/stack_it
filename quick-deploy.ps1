# Quick Deploy Helper - Just provide your Supabase URL and deploy!

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      StackIt - Vercel Production Deployment          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Get Supabase connection string
Write-Host "[Step 1/5] Supabase Database URL" -ForegroundColor Yellow
Write-Host "Get it from: Supabase Dashboard → Settings → Database → Connection String" -ForegroundColor Gray
Write-Host "Select: 'Connection pooling' (port 6543)`n" -ForegroundColor Gray
Write-Host "Paste your Supabase DATABASE_URL:" -ForegroundColor Cyan
$dbUrl = Read-Host

if ([string]::IsNullOrWhiteSpace($dbUrl)) {
    Write-Host "`n✗ DATABASE_URL is required!" -ForegroundColor Red
    exit 1
}

# Validate it looks like a Supabase URL
if ($dbUrl -notmatch "supabase.com" -and $dbUrl -notmatch "postgresql://") {
    Write-Host "`n⚠ Warning: This doesn't look like a Supabase URL. Continue anyway? (Y/N)" -ForegroundColor Yellow
    $continue = Read-Host
    if ($continue -ne "Y" -and $continue -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Gray
        exit 0
    }
}

Write-Host "✓ DATABASE_URL captured`n" -ForegroundColor Green

# Step 2: Get Vercel project URL
Write-Host "[Step 2/5] Vercel Project URL" -ForegroundColor Yellow
Write-Host "What is your Vercel deployed URL?" -ForegroundColor Cyan
Write-Host "(e.g., https://stack-it-abc123.vercel.app)" -ForegroundColor Gray
$vercelUrl = Read-Host

if ([string]::IsNullOrWhiteSpace($vercelUrl)) {
    Write-Host "`n✗ Vercel URL is required!" -ForegroundColor Red
    exit 1
}

# Add https:// if missing
if ($vercelUrl -notmatch "^https?://") {
    $vercelUrl = "https://$vercelUrl"
}

Write-Host "✓ Vercel URL: $vercelUrl`n" -ForegroundColor Green

# Step 3: Run database migrations
Write-Host "[Step 3/5] Database Migrations" -ForegroundColor Yellow
Write-Host "Running Prisma migrations on your Supabase database..." -ForegroundColor Cyan

$env:DATABASE_URL = $dbUrl
$pushResult = npx prisma db push 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database schema pushed successfully`n" -ForegroundColor Green
} else {
    Write-Host "`n⚠ Database push had issues. Continue anyway? (Y/N)" -ForegroundColor Yellow
    Write-Host "Error: $pushResult" -ForegroundColor Gray
    $continue = Read-Host
    if ($continue -ne "Y" -and $continue -ne "y") {
        Write-Host "Cancelled. Fix database issues and try again." -ForegroundColor Gray
        exit 1
    }
}

# Step 4: Set Vercel environment variables
Write-Host "[Step 4/5] Setting Vercel Environment Variables" -ForegroundColor Yellow

# Generate AUTH_SECRET
$rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$authSecret = [Convert]::ToBase64String($bytes)

Write-Host "  → Setting DATABASE_URL..." -ForegroundColor Gray
vercel env add DATABASE_URL production --value $dbUrl --yes --force 2>&1 | Out-Null

Write-Host "  → Setting AUTH_SECRET..." -ForegroundColor Gray
vercel env add AUTH_SECRET production --value $authSecret --yes --force 2>&1 | Out-Null

Write-Host "  → Setting AUTH_URL..." -ForegroundColor Gray
vercel env add AUTH_URL production --value $vercelUrl --yes --force 2>&1 | Out-Null

Write-Host "  → Setting AUTH_TRUST_HOST..." -ForegroundColor Gray
vercel env add AUTH_TRUST_HOST production --value "true" --yes --force 2>&1 | Out-Null

# Optional: GEMINI_API_KEY
if ($env:GEMINI_API_KEY) {
    Write-Host "  → Setting GEMINI_API_KEY (AI features)..." -ForegroundColor Gray
    vercel env add GEMINI_API_KEY production --value $env:GEMINI_API_KEY --yes --force 2>&1 | Out-Null
}

Write-Host "✓ All environment variables set`n" -ForegroundColor Green

# Step 5: Deploy
Write-Host "[Step 5/5] Deploying to Vercel Production" -ForegroundColor Yellow
Write-Host "Starting production deployment...`n" -ForegroundColor Cyan

vercel --prod

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✓ Deployment Complete!                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "Your app is live at: $vercelUrl" -ForegroundColor Cyan
Write-Host "`nTest your deployment:" -ForegroundColor Yellow
Write-Host "  1. Visit: $vercelUrl/register" -ForegroundColor Gray
Write-Host "  2. Create a test account" -ForegroundColor Gray
Write-Host "  3. Login and browse questions" -ForegroundColor Gray
Write-Host "`nGenerated AUTH_SECRET:" -ForegroundColor Yellow
Write-Host "  $authSecret" -ForegroundColor Gray
Write-Host "  (Saved in Vercel - you don't need to store this locally)`n" -ForegroundColor DarkGray
