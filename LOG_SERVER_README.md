# 📝 TabAgent Log Server

Live log streaming for extension development - no more copy-pasting logs!

## Quick Start

### 1. Start the Log Server

```bash
npm run logs
```

Keep this running in a terminal. You'll see:
```
📝 TabAgent Log Server running on http://localhost:3333
   POST /log     - Extension sends logs here
   GET  /logs    - Fetch logs (supports ?level=error&limit=50)
   DELETE /logs  - Clear all logs
```

### 2. Update Your Extension Code

**Option A: Intercept ALL console logs** (Easiest)

Add this to your extension's entry point (e.g., `background.ts` or `sidepanel.ts`):

```typescript
import { interceptConsole } from '@/utils/logRelay';

// Call once at startup
interceptConsole();

// Now ALL console.log/warn/error automatically relay to log server!
console.log('This will appear in both DevTools AND log server');
```

**Option B: Use explicit logging** (More control)

```typescript
import { devLog } from '@/utils/logRelay';

// Logs with context
devLog.info('BackgroundModelManager', 'Model loaded', { modelId: 'phi-3.5' });
devLog.error('ChatManager', 'Failed to send message', { error });
devLog.warn('Settings', 'Invalid temperature value', { value: 5.0 });
```

### 3. AI Can Now Check Logs!

While developing, you can tell the AI:

```
"Check the latest logs"
"Show me any error logs from the last minute"
"What's happening in BackgroundModelManager?"
"Clear the logs and let's start fresh"
```

The AI will fetch from `http://localhost:3333/logs` instantly!

## API Endpoints

### GET /logs
Fetch logs with filters:

```bash
# Last 100 logs (default)
curl http://localhost:3333/logs

# Only errors
curl http://localhost:3333/logs?level=error

# Only from BackgroundModelManager
curl http://localhost:3333/logs?context=BackgroundModelManager

# Last 50 logs from the last minute
curl http://localhost:3333/logs?limit=50&since=2025-10-30T14:00:00Z
```

### POST /log
Send a log (extension does this automatically):

```bash
curl -X POST http://localhost:3333/log \
  -H "Content-Type: application/json" \
  -d '{
    "level": "info",
    "message": "Model loaded successfully",
    "context": "BackgroundModelManager",
    "data": {"modelId": "phi-3.5"}
  }'
```

### DELETE /logs
Clear all logs:

```bash
curl -X DELETE http://localhost:3333/logs
```

## Production Build

Set `IS_DEV = false` in `src/utils/logRelay.ts` before building for production. This will:
- ✅ Keep normal console logging
- ❌ Disable HTTP requests to log server
- ✅ Zero performance impact

## Workflow Example

```bash
# Terminal 1: Start log server
npm run logs

# Terminal 2: Build extension with watch
npm run build:extension --watch

# Reload extension in Chrome

# Chat with AI:
You: "I just changed the model loading logic, check if there are any errors"
AI: *fetches logs* "I see a warning about missing quantization..."
```

No more copy-pasting! 🎉

