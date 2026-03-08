# StackIt - Vercel Deployment Guide

## Quick Deploy (3 Minutes)

### Prerequisites
✓ Supabase project created (free tier works!)
✓ Vercel account connected to your project
✓ Vercel CLI installed (already done ✓)

---

## Step 1: Get Your Supabase Connection String

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **Database**
3. Under **Connection string**, select **Connection pooling**
4. Copy the URI (it should look like this):
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. Replace `[PASSWORD]` with your actual database password

**Important:** Use the **pooling** connection (port 6543), not the direct connection (port 5432)

---

## Step 2: Set Up Your Database

Run migrations on your Supabase database:

```powershell
# Set your Supabase DATABASE_URL temporarily
$env:DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"

# Push schema to Supabase
npx prisma db push

# (Optional) Seed with test data
npx prisma db seed
```

---

## Step 3: One-Command Deployment

Run this single command (replace the values):

```powershell
.\deploy-to-vercel.ps1 `
    -DatabaseUrl "postgresql://postgres.[REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres" `
    -VercelProjectUrl "https://your-app.vercel.app"
```

This will:
- ✓ Generate a secure AUTH_SECRET
- ✓ Set DATABASE_URL in Vercel
- ✓ Set AUTH_SECRET in Vercel
- ✓ Set AUTH_URL in Vercel
- ✓ Set AUTH_TRUST_HOST=true in Vercel
- ✓ (Optional) Set GEMINI_API_KEY if present in your .env
- ✓ Deploy to production

---

## Alternative: Manual Setup

If you prefer to set environment variables manually:

### On Vercel Dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables for **Production**:

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | `postgresql://postgres...` | Your Supabase pooling URL |
| `AUTH_SECRET` | Generate with: `openssl rand -base64 32` | Secure random string |
| `AUTH_URL` | `https://your-app.vercel.app` | Your deployed URL |
| `AUTH_TRUST_HOST` | `true` | Required for Vercel proxy |
| `GEMINI_API_KEY` | `AIza...` | (Optional) For AI features |

3. Go to **Deployments** → Click **Redeploy** on latest deployment

### Via CLI:
```powershell
# 1. Set DATABASE_URL
vercel env add DATABASE_URL production --value "postgresql://..." --yes --force

# 2. Generate and set AUTH_SECRET
$rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
vercel env add AUTH_SECRET production --value $secret --yes --force

# 3. Set AUTH_URL
vercel env add AUTH_URL production --value "https://your-app.vercel.app" --yes --force

# 4. Set AUTH_TRUST_HOST
vercel env add AUTH_TRUST_HOST production --value "true" --yes --force

# 5. (Optional) AI features
vercel env add GEMINI_API_KEY production --value "AIza..." --yes --force

# 6. Deploy
vercel --prod
```

---

## Step 4: Verify Deployment

After deployment completes:

1. Visit your deployed URL: `https://your-app.vercel.app`
2. Click **Register** → Create a test account
3. Should successfully create user and log in
4. Check `/api/v1/questions` to verify database connectivity

---

## Troubleshooting

### "Service temporarily unavailable"
- ✓ Check DATABASE_URL is correct (with port 6543)
- ✓ Verify Supabase project is not paused
- ✓ Check Supabase dashboard for connection errors

### "Login is temporarily unavailable"
- ✓ Verify AUTH_SECRET is set
- ✓ Verify AUTH_URL matches your deployed URL
- ✓ Check AUTH_TRUST_HOST=true is set

### "Can't reach database server"
- ✓ Using pooling URL (port 6543), not direct (5432)
- ✓ DATABASE_URL has your correct password
- ✓ Supabase project allows external connections

---

## What Was Fixed

These issues from your screenshots are now resolved:

1. ✓ **"Can't reach database server at 127.0.0.1:5432"**
   - Solution: Using hosted Supabase URL instead of localhost

2. ✓ **"CallbackRouteError" on login**
   - Solution: Added DB connectivity error handling + CallbackRouteError mapping

3. ✓ **Raw Prisma errors exposed to users**
   - Solution: API handler now sanitizes DB errors (HTTP 503)

4. ✓ **Missing `trustHost` for Vercel proxy**
   - Solution: Enabled `trustHost: true` in auth.ts

---

## Generated Auth Secret

Your production AUTH_SECRET has been generated:
```
CbAX1dQ1Am8WqsfV1n1GK/6bLs9mbwNCIJmdeHEBZxE=
```

**Already set in:** `$env:PROD_AUTH_SECRET`

---

## Quick Reference

**Supabase Dashboard:** https://app.supabase.com/project/[YOUR-PROJECT]/settings/database  
**Vercel Dashboard:** https://vercel.com/[YOUR-ORG]/[YOUR-PROJECT]/settings/environment-variables

**Deployment Script:** `.\deploy-to-vercel.ps1`  
**Test Script:** `.\test-auth.ps1`

---

## Need Help?

- Supabase connection issues: Check your project isn't paused in dashboard
- Vercel deployment issues: Run `vercel --debug` for detailed logs
- Auth errors: Check Vercel function logs at https://vercel.com/[project]/logs
