# AI Features Setup Guide 🤖

The StackIt platform includes comprehensive AI-powered features using **Google Gemini (100% FREE!)**.

## Overview

**All AI features** in StackIt use Google Gemini's free API. No credit card required!

### AI Features Included:

1. **🤖 AI Chatbot** - Real-time programming assistant
2. **🏷️ Tag Suggestions** - Auto-suggest relevant tags for questions
3. **📊 Quality Analysis** - Question quality scoring and feedback
4. **📝 Answer Summaries** - Summarize long technical answers
5. **🔍 Duplicate Detection** - Find similar questions using embeddings

**Important Note:** Unlike the old version, ALL features now use a single API key (`GEMINI_API_KEY`) making setup super simple!

## Prerequisites

- Google Gemini API key ([Get one FREE here](https://aistudio.google.com/app/apikey))
- Node.js and npm installed
- StackIt app already running

## Setup Steps

### 1. Get Your FREE Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (starts with `AIza...`)

**Note:** Gemini API is completely FREE with generous limits - no credit card required!

### 2. Set Environment Variable

Add your Gemini API key to your environment:

**Windows PowerShell:**
```powershell
$env:GEMINI_API_KEY='AIza...your-key-here'
```

**Or add to `.env.local`:**
```bash
GEMINI_API_KEY=AIza...your-key-here
```

**For production (Vercel):**
```bash
vercel env add GEMINI_API_KEY production
```

### 3. Install Dependencies

The required `@google/generative-ai` package should already be installed. If not:

```bash
npm install @google/generative-ai
```

### 4. Restart the Development Server

```bash
npm run dev
```

### 5. Test the Chatbot

1. Visit any page on your StackIt app (e.g., `http://localhost:3000`)
2. Look for the **purple/blue gradient chat button** in the bottom-right corner
3. Click to open the chatbot
4. Type a programming question and press Enter
5. The AI assistant will respond with helpful guidance

## Features

All AI-powered features can:

### 1. AI Chatbot Assistant
✅ **Answer programming questions** - Get quick help with code issues  
✅ **Explain concepts** - Understand programming fundamentals  
✅ **Suggest question improvements** - Learn to ask better questions  
✅ **Recommend tags** - Get tag suggestions for your questions  
✅ **Explain error messages** - Understand what went wrong  
✅ **Provide code examples** - See syntax examples with markdown formatting

### 2. Smart Tag Suggestions
- Automatically suggest relevant tags based on question content
- Only suggests tags that exist in your database
- Analyzes both title and description for accuracy

### 3. Question Quality Analysis  
- Real-time quality scoring (0-100)
- Specific improvement suggestions
- Highlights what you're doing well
- Helps users write better questions

### 4. Answer Summaries
- Condense long technical answers
- Extract key points automatically
- Save reading time for users
- Works on answers > 150 words

### 5. Duplicate Detection
- Find similar questions using AI embeddings
- Prevent duplicate content
- Link related discussions
- Uses semantic similarity (not just keyword matching)

## How It Works

### Models Used:
- **Chat Model:** `gemini-1.5-flash` (chatbot, tag suggestions, quality analysis, summaries)
- **Embedding Model:** `text-embedding-004` (duplicate detection)

### Configuration:
- **Context Awareness:** Chatbot remembers last 8 messages
- **Response Length:** Up to 1000 tokens (~750 words)
- **Temperature:** 0.3-0.7 (balanced between creativity and accuracy)
- **Embedding Dimensions:** 768 (optimized for similarity search)

## Configuration

To customize AI features, edit these files:

**Chatbot:** [src/lib/chatbot.ts](src/lib/chatbot.ts)
```typescript
const CHAT_MODEL = 'gemini-1.5-flash';  // Change model (use gemini-1.5-pro for better quality)
const MAX_TOKENS = 1000;                 // Adjust max response length
```

**Tag Suggestions & Quality Analysis:** [src/lib/ai-assistant.ts](src/lib/ai-assistant.ts)
```typescript
const CHAT_MODEL = 'gemini-1.5-flash';  // Change model
const MAX_TOKENS = 500;                  // Adjust response length
```

**Embeddings (Duplicate Detection):** [src/lib/embedding.ts](src/lib/embedding.ts)
```typescript
const EMBEDDING_MODEL = 'text-embedding-004';  // Embedding model
const EMBEDDING_DIMENSIONS = 768;               // Vector dimensions
```

## Cost & Rate Limits

**Gemini API Free Tier:**
- 15 requests per minute
- 1 million tokens per month
- 1,500 requests per day

**Cost:** $0.00 (completely free!) 🎉

For most applications, the free tier is more than sufficient. If you need more:
- Upgrade to paid tier for higher limits
- Rate: $0.00025 per 1K characters

## Troubleshooting

### AI features not working at all?

1. **Check API key is set:**
   ```powershell
   $env:GEMINI_API_KEY
   ```
   
2. **Verify API key is valid:**
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Check your API keys list
   - Regenerate if needed

3. **Check browser console (F12)** for error messages:
   - Look for "not configured" → API key not set
   - Look for "Gemini API Error" → Check API key validity

### Error: "AI features not available" or "not configured"

This means `GEMINI_API_KEY` is not set. Follow setup steps 1-2 above.

### Chatbot button visible but not responding?

- Check browser console for errors
- Verify network tab shows request to `/api/v1/chatbot`
- Ensure no browser extensions blocking requests

### Tag suggestions not appearing?

- Type at least 15 characters in title
- Type at least 50 characters in description
- Wait 2 seconds after stopping typing
- Check that tags exist in your database

### Quality analysis not showing?

- Type at least 10 characters in title
- Type at least 30 characters in description
- Wait 2 seconds after stopping typing

### Duplicate detection showing no results?

- You need existing question embeddings
- Run: `node backfill-embeddings.mjs`
- Or wait for new questions to generate embeddings automatically

### Slow responses?

- Expected: 1-3 seconds for responses
- Check [Google Cloud Status](https://status.cloud.google.com/)
- Consider switching to `gemini-2.0-flash` for faster responses

### Responses are cut off?

Increase `MAX_TOKENS` in respective config files:
```typescript
const MAX_TOKENS = 2000; // Allow longer responses
```

### Rate limit errors (429)?

Free tier limits:
- 15 requests per minute
- 1,500 requests per day
- Wait briefly between requests
- Or upgrade to paid tier for higher limits

## API Endpoints

The AI features use the following APIs:

### 1. Chatbot
**POST** `/api/v1/chatbot`

```typescript
// Request
{
  "message": "How do I reverse a string in JavaScript?",
  "conversationHistory": [...]
}

// Response (success)
{
  "success": true,
  "data": {
    "message": "To reverse a string in JavaScript...",
    "timestamp": "2026-03-08T..."
  }
}
```

### 2. Tag Suggestions
Integrated into the question creation flow - called automatically when typing.

### 3. Quality Analysis
Integrated into the question creation flow - provides real-time feedback.

### 4. Similar Questions (Duplicate Detection)
**GET** `/api/v1/questions/similar?title=...&description=...`

Returns list of similar questions with similarity scores.

### 5. Answer Summary
Called when user clicks "Generate Summary" button on long answers.

## Security Best Practices

1. **Never commit API keys to Git** - Add `.env.local` to `.gitignore`
2. **Use environment variables** - Never hardcode keys in code
3. **Rotate keys periodically** - Generate new keys every 90 days
4. **Set up rate limiting** - Protect against abuse (already implemented)

## Complete Environment Variables

Your StackIt application needs these environment variables:

```bash
# Database (Required)
DATABASE_URL="postgresql://..."

# Authentication (Required)  
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# AI Features (Optional - but enables ALL AI features!)
GEMINI_API_KEY="AIza..."
```

**Note:** One API key enables ALL AI features! No complex setup needed. 🎉

## Need Help?

- **Migration Guide:** [GEMINI_MIGRATION.md](GEMINI_MIGRATION.md)
- **Quick Start:** [AI_QUICKSTART.md](AI_QUICKSTART.md)
- **Gemini API Docs:** https://ai.google.dev/docs
- **API Key Issues:** https://aistudio.google.com/app/apikey
- **Report Bugs:** Open an issue in the repository

---

**Enjoy your FREE AI-powered Q&A platform with ALL features enabled! 🚀**

No credit card. No hidden costs. Just awesome AI features.
