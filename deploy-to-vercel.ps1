# Vercel Production Deployment Script
# This script sets all required environment variables and deploys to Vercel

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$VercelProjectUrl = ""
)

Write-Host "`n=== Deploying StackIt to Vercel ===" -ForegroundColor Cyan

# 1. Generate secure AUTH_SECRET
Write-Host "`n[1/6] Generating secure AUTH_SECRET..." -ForegroundColor Yellow
$rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$authSecret = [Convert]::ToBase64String($bytes)
Write-Host "✓ Generated: $authSecret" -ForegroundColor Green

# 2. Get Vercel project URL if not provided
if ([string]::IsNullOrWhiteSpace($VercelProjectUrl)) {
    Write-Host "`n[2/6] Enter your Vercel project URL (e.g., https://your-app.vercel.app):" -ForegroundColor Yellow
    $VercelProjectUrl = Read-Host "URL"
}
Write-Host "✓ Using URL: $VercelProjectUrl" -ForegroundColor Green

# 3. Set DATABASE_URL
Write-Host "`n[3/6] Setting DATABASE_URL..." -ForegroundColor Yellow
vercel env add DATABASE_URL production --value $DatabaseUrl --yes --force | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ DATABASE_URL set successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set DATABASE_URL" -ForegroundColor Red
    exit 1
}

# 4. Set AUTH_SECRET
Write-Host "`n[4/6] Setting AUTH_SECRET..." -ForegroundColor Yellow
vercel env add AUTH_SECRET production --value $authSecret --yes --force | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ AUTH_SECRET set successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set AUTH_SECRET" -ForegroundColor Red
    exit 1
}

# 5. Set AUTH_URL
Write-Host "`n[5/6] Setting AUTH_URL..." -ForegroundColor Yellow
vercel env add AUTH_URL production --value $VercelProjectUrl --yes --force | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ AUTH_URL set successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set AUTH_URL" -ForegroundColor Red
    exit 1
}

# 6. Set AUTH_TRUST_HOST
Write-Host "`n[6/6] Setting AUTH_TRUST_HOST..." -ForegroundColor Yellow
vercel env add AUTH_TRUST_HOST production --value "true" --yes --force | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ AUTH_TRUST_HOST set successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set AUTH_TRUST_HOST" -ForegroundColor Red
    exit 1
}

# Optional: Set GEMINI_API_KEY for AI features
if ($env:GEMINI_API_KEY) {
    Write-Host "`n[Optional] Setting GEMINI_API_KEY for AI features..." -ForegroundColor Yellow
    vercel env add GEMINI_API_KEY production --value $env:GEMINI_API_KEY --yes --force | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ GEMINI_API_KEY set successfully" -ForegroundColor Green
    }
}

Write-Host "`n=== Environment Variables Set Successfully ===" -ForegroundColor Green
Write-Host "`nReady to deploy! Run: vercel --prod" -ForegroundColor Cyan
Write-Host "`nOr automatically deploy now? (Y/N)" -ForegroundColor Yellow
$deploy = Read-Host
if ($deploy -eq "Y" -or $deploy -eq "y") {
    Write-Host "`nDeploying to production..." -ForegroundColor Cyan
    vercel --prod
    Write-Host "`n✓ Deployment complete! Visit: $VercelProjectUrl" -ForegroundColor Green
} else {
    Write-Host "`nSkipped automatic deployment. Deploy manually with: vercel --prod" -ForegroundColor Gray
}
