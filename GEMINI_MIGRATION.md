# Migration Guide: OpenAI → Google Gemini (100% FREE!)

## Overview

StackIt has been migrated from OpenAI to Google Gemini for ALL AI features. **This makes the entire AI system 100% FREE!** 🎉

## What Changed

### Before (OpenAI - Paid)
- **Model:** GPT-4o-mini
- **Embedding Model:** text-embedding-3-small (1536 dimensions)
- **API Key:** `OPENAI_API_KEY`
- **Cost:** ~$20-25 per 10K questions

### After (Google Gemini - FREE!)
- **Model:** gemini-1.5-flash
- **Embedding Model:** text-embedding-004 (768 dimensions)
- **API Key:** `GEMINI_API_KEY`
- **Cost:** $0 (FREE tier includes 1M tokens/month!)

## Features Using Gemini

All AI features now use Google Gemini:

✅ **AI Chatbot** - Real-time programming assistant  
✅ **Tag Suggestions** - Auto-suggest relevant tags  
✅ **Quality Analysis** - Question quality scoring  
✅ **Answer Summaries** - Summarize long answers  
✅ **Duplicate Detection** - Find similar questions (embeddings)

## Migration Steps

### 1. Get FREE Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### 2. Update Environment Variables

**Remove OLD variable:**
```bash
# OPENAI_API_KEY=sk-...  ❌ Remove this
```

**Add NEW variable:**
```bash
GEMINI_API_KEY=AIza...your-key-here  ✅ Add this
```

**Windows PowerShell:**
```powershell
$env:GEMINI_API_KEY='AIza...your-key-here'
```

**Vercel (Production):**
```bash
vercel env rm OPENAI_API_KEY production  # Remove old
vercel env add GEMINI_API_KEY production # Add new
```

### 3. Clear Existing Embeddings (Optional but Recommended)

If you have existing question embeddings, they use 1536 dimensions (OpenAI). New embeddings use 768 dimensions (Gemini).

**Option A: Clear all embeddings and regenerate**
```sql
DELETE FROM question_embeddings;
```

Then run the backfill script:
```bash
node backfill-embeddings.mjs
```

**Option B: Keep old embeddings (they'll coexist)**
- Old embeddings (1536 dim) will remain but won't match new queries
- New questions will use 768 dim embeddings
- Similarity search will still work but may give inconsistent results
- Recommended to regenerate for consistency

### 4. Restart Your Application

```bash
npm run dev
```

### 5. Verify Everything Works

Test each feature:
- [ ] Open chatbot (bottom-right corner)
- [ ] Ask a question → check tag suggestions
- [ ] Check quality analysis feedback
- [ ] View duplicate detection in similar questions panel
- [ ] Click "Generate Summary" on a long answer

## Benefits of Gemini

### 1. **100% FREE** 🎉
- No credit card required
- 1 million tokens per month free
- 15 requests per minute
- 1,500 requests per day

### 2. **No OpenAI Dependency**
- No more API costs
- No billing surprises
- Perfect for prototypes and small projects

### 3. **Similar Quality**
- Gemini Pro performs comparably to GPT-4o-mini
- Excellent for programming questions
- Fast response times

### 4. **Google Integration**
- Easy setup with Google account
- Generous free tier
- Reliable infrastructure

## Breaking Changes

### Removed Dependencies
You can now optionally remove the OpenAI package:
```bash
npm uninstall openai
```

### API Changes
If you extended the AI features:
- Replace `OpenAI` imports with `GoogleGenerativeAI`
- Update model names: `gpt-4o-mini` → `gemini-pro`
- Adjust embedding dimensions: 1536 → 768
- Parse JSON from text responses (Gemini doesn't have native JSON mode)

### Environment Variables
- `OPENAI_API_KEY` → No longer used ❌
- `GEMINI_API_KEY` → Required for all AI features ✅

## Troubleshooting

### "AI features not available"
✅ **Solution:** Set `GEMINI_API_KEY` environment variable

### "Failed to generate embedding"
✅ **Solution:** Verify Gemini API key is valid at [aistudio.google.com](https://aistudio.google.com/)

### Duplicate detection not working after migration
✅ **Solution:** Clear old embeddings and regenerate:
```bash
node backfill-embeddings.mjs
```

### Rate limit errors (429)
✅ **Solution:** Free tier allows 15 requests/minute. Wait briefly or add delays between requests.

### Different embedding dimensions error
✅ **Solution:** You have mixed embeddings. Clear all and regenerate:
```sql
DELETE FROM question_embeddings;
```

## Cost Comparison

### Before (OpenAI)
| Feature | Cost per 1K operations |
|---------|------------------------|
| Tag suggestions | $0.13 |
| Quality analysis | $0.13 |
| Answer summaries | $0.15 |
| Embeddings | $0.02 |
| **Total monthly (10K questions)** | **~$20-25** |

### After (Gemini)
| Feature | Cost per 1K operations |
|---------|------------------------|
| Tag suggestions | **$0.00** |
| Quality analysis | **$0.00** |
| Answer summaries | **$0.00** |
| Embeddings | **$0.00** |
| **Total monthly (10K questions)** | **$0.00 (FREE!)** |

## Next Steps

1. ✅ Set `GEMINI_API_KEY` environment variable
2. ✅ Restart application
3. ✅ Test all AI features
4. ✅ (Optional) Clear old embeddings
5. ✅ (Optional) Uninstall `openai` package
6. ✅ Deploy to production with new env var

## Support

- **Gemini API Docs:** https://ai.google.dev/docs
- **Setup Guide:** [AI_QUICKSTART.md](AI_QUICKSTART.md)
- **Chatbot Setup:** [CHATBOT_SETUP.md](CHATBOT_SETUP.md)

---

**Enjoy your FREE AI-powered Q&A platform! 🚀**
