# Git Commit Retitle Script for StackIt
# This script will retitle all commits with professional messages

Write-Host "🔄 Starting commit retitle process..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Backup current branch
Write-Host "📦 Creating backup branch..." -ForegroundColor Yellow
git branch backup-before-rebase
Write-Host "✓ Backup created as 'backup-before-rebase'" -ForegroundColor Green
Write-Host ""

# Step 2: Start interactive rebase
Write-Host "🔧 Starting interactive rebase..." -ForegroundColor Yellow
Write-Host ""
Write-Host "INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. An editor will open showing all commits" -ForegroundColor White
Write-Host "2. Change 'pick' to 'reword' (or 'r') for EACH commit" -ForegroundColor White
Write-Host "3. Save and close the editor" -ForegroundColor White
Write-Host "4. For each commit, a new editor will open" -ForegroundColor White
Write-Host "5. Replace the old message with the new one from commit-messages.txt" -ForegroundColor White
Write-Host "6. Save and close each time" -ForegroundColor White
Write-Host ""
Write-Host "📄 Reference file: commit-messages.txt (in project root)" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press ENTER to continue..." -ForegroundColor Yellow
Read-Host

# Start the rebase
git rebase -i --root

# Step 3: Check if rebase was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Rebase completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Viewing updated commit history:" -ForegroundColor Cyan
    git log --oneline -10
    Write-Host ""
    Write-Host "⚠️  NEXT STEP: Force push to GitHub" -ForegroundColor Yellow
    Write-Host "Run this command when ready:" -ForegroundColor White
    Write-Host "    git push origin master --force-with-lease" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Note: This will rewrite Git history. Only do this if you're the sole contributor." -ForegroundColor Red
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Rebase failed or was aborted" -ForegroundColor Red
    Write-Host ""
    Write-Host "To restore from backup:" -ForegroundColor Yellow
    Write-Host "    git reset --hard backup-before-rebase" -ForegroundColor White
    Write-Host ""
}
