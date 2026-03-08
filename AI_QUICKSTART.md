# AI Question Assistant - Quick Start Guide 🚀

Get your AI-powered Q&A features up and running in 5 minutes using **Google Gemini (100% FREE!)**

## Prerequisites

- Google Gemini API key ([Get FREE here](https://aistudio.google.com/app/apikey))
- Node.js and npm installed
- Next.js app already running

## Setup Steps

### 1. Set Environment Variable

Add your Gemini API key to your environment:

**Windows PowerShell:**
```powershell
$env:GEMINI_API_KEY='AIza...your-key-here'
```

**Or add to `.env.local`:**
```bash
GEMINI_API_KEY=AIza...your-key-here
```

### 2. Install Dependencies (Already Done!)

The `@google/generative-ai` package is already installed in your project.

### 3. Start the Development Server

```powershell
npm run dev
```

### 4. Test the Features

Visit `http://localhost:3000/ask` and start typing a question!

**What to expect:**
1. ✨ **Tag Suggestions** appear after typing ~50 words of description
2. 🎯 **Quality Analysis** shows score and improvement tips
3. 🔍 **Similar Questions** panel detects potential duplicates
4. 📝 **Answer Summaries** available on long answers (click button)

## Features Overview

### 1. AI Tag Suggestions
- **Trigger:** Type 15+ char title + 50+ char description
- **Wait:** 2 seconds after stopping typing
- **Action:** Click "+" button to add suggested tag

### 2. Question Quality Analysis
- **Trigger:** Type 10+ char title + 30+ char description  
- **Wait:** 2 seconds after stopping typing
- **Shows:** Score (0-100), strengths, improvement suggestions

### 3. Duplicate Detection (Already Working!)
- **Trigger:** Type 10+ char title + 30+ char description
- **Wait:** 1 second after stopping typing
- **Shows:** Top 5 similar questions with similarity %

### 4. Answer Summarization
- **Trigger:** Answer > 150 words
- **Action:** Click "Generate AI Summary" button
- **Shows:** 2-3 sentence summary + key points

## Configuration (Optional)

All AI features use optimized defaults, but you can customize in [src/lib/ai-assistant.ts](src/lib/ai-assistant.ts):

```typescript
const CHAT_MODEL = 'gemini-1.5-flash';  // Fast model (use gemini-1.5-pro for better quality)
const MAX_TOKENS = 500;                  // Adjust response length
```

## Cost Estimation

**100% FREE with Google Gemini!** 🎉

Free tier includes:
- 15 requests per minute
- 1 million tokens per month
- 1,500 requests per day

For most applications, the free tier is more than enough!

## Troubleshooting

### AI features not working?
1. Check Gemini API key is set correctly
2. Verify API key from [Google AI Studio](https://aistudio.google.com/)
3. Check browser console (F12) for error messages

### Slow responses?
- Expected: 1-2 seconds for AI features
- Check [Google Cloud Status](https://status.cloud.google.com/)
- Consider using `gemini-2.0-flash` for faster responses

### Wrong tag suggestions?
- AI only suggests tags that exist in database
- Run tag seeder to populate more tags
- Tags come from `/api/v1/tags` endpoint

### Rate limit errors?
- Free tier: 15 requests/minute
- Wait a moment between requests
- Or upgrade to paid tier for higher limits

## Where to See AI Features

### In AskQuestionForm (`/ask`)
- Tag suggestions panel (purple-blue gradient)
- Quality feedback (color-coded by score)
- Similar questions panel (existing)

### In Question Detail Page (`/questions/[id]`)
- AI summary button on each answer (if long enough)
- Click to generate and expand summary

## API Endpoints

All AI endpoints are under `/api/v1/ai/`:

- `POST /api/v1/ai/suggest-tags` - Get tag suggestions
- `POST /api/v1/ai/analyze-question` - Get quality analysis  
- `POST /api/v1/ai/summarize-answer` - Generate answer summary

## Testing the Implementation

### Manual Test Checklist

**Test 1: Tag Suggestions**
1. Go to `/ask`
2. Type: "How to deploy Next.js app?" (title)
3. Type: "I built a Next.js application and want to deploy it to Vercel..." (description)
4. Wait 2 seconds
5. ✅ Should see AI tag suggestions like "nextjs", "deployment", "vercel"

**Test 2: Quality Analysis**
1. Type vague title: "Error in code"
2. Type vague description: "Getting error help"
3. Wait 2 seconds
4. ✅ Should see low score (<50) with suggestions to improve

**Test 3: Good Question**
1. Type clear title: "How to implement JWT authentication in Next.js 14?"
2. Type detailed description with context and what you've tried
3. Wait 2 seconds
4. ✅ Should see good score (70+) with strengths listed

**Test 4: Answer Summary**
1. Go to any question with long answers
2. Find answer with 150+ words
3. Click "Generate AI Summary" button
4. ✅ Should see loading, then summary with key points

## Next Steps

1. ✅ **Test all features** with the checklist above
2. 📚 **Read full docs** in [AI_ASSISTANT_COMPLETE.md](AI_ASSISTANT_COMPLETE.md)
3. 🎨 **Customize UI** colors/styles to match your brand
4. 🔧 **Fine-tune prompts** in `ai-assistant.ts` for your domain
5. 📊 **Monitor usage** (100% FREE with generous limits!)
6. 🚀 **Deploy to production** with environment variable set

## Support

- **Full Documentation:** [AI_ASSISTANT_COMPLETE.md](AI_ASSISTANT_COMPLETE.md) (note: update this for Gemini)
- **Gemini API Docs:** https://ai.google.dev/docs
- **Chatbot Setup:** [CHATBOT_SETUP.md](CHATBOT_SETUP.md)
- **Issues?** Check the Troubleshooting section above

---

**Ready to go!** All AI features are implemented and 100% FREE with Google Gemini! 🎉
