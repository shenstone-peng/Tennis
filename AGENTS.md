# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-08
**Project:** Pro-Mirror - Sports Form Comparison
**Stack:** React 19 + TypeScript + Vite

## OVERVIEW

AI-powered video analysis tool for comparing user sports form against professional reference footage. Uses Google Gemini 3 Flash Vision for frame-by-frame analysis.

## STRUCTURE

```
.
├── App.tsx                 # Main app (402 lines) - dual video player + controls
├── index.tsx               # React entry point
├── types.ts                # TypeScript definitions
├── components/
│   ├── VideoUploader.tsx   # Video upload/playback component
│   └── AnalysisPanel.tsx   # AI analysis results display
├── services/
│   └── geminiService.ts    # Google Gemini API integration
├── vite.config.ts          # Vite build config
└── package.json            # Dependencies
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Video playback logic | `App.tsx` | Lines 40-110: refs, time state, frame stepping |
| Upload component | `components/VideoUploader.tsx` | Handles file input + video element |
| AI analysis API | `services/geminiService.ts` | Gemini Vision API calls |
| Type definitions | `types.ts` | AnalysisResult, ComparisonState enums |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `App` | Component | `App.tsx:22` | Main application container |
| `VideoUploader` | Component | `components/VideoUploader.tsx:18` | Video input + player |
| `analyzeFrames` | Function | `services/geminiService.ts:12` | AI analysis API call |
| `ComparisonState` | Enum | `types.ts:8` | Analysis state machine |

## CONVENTIONS

### Component Patterns
- **Props interfaces**: Named `{ComponentName}Props`
- **Forward refs**: Use `RefObject<HTMLVideoElement>` for video elements
- **Callback naming**: `handle{Action}` (e.g., `handleUserSeek`)
- **State naming**: `{entity}{Property}` (e.g., `userCurrentTime`)

### File Organization
- Components in `/components` directory
- Services in `/services` directory
- Types in root `types.ts`
- No `src/` directory - flat root structure

### Import Patterns
```typescript
// React hooks
import React, { useState, useRef, useEffect } from 'react';

// Icons (Lucide)
import { Play, Pause, ChevronLeft } from 'lucide-react';

// Local components
import { VideoUploader } from './components/VideoUploader';

// Types
import { AnalysisResult } from './types';
```

## ANTI-PATTERNS (THIS PROJECT)

**None documented** - codebase lacks inline style guides

## UNIQUE STYLES

### CDN ImportMap (Non-Standard)
Dependencies loaded via esm.sh CDN in `index.html`, not bundled:
```html
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@19.2.4",
    "lucide-react": "https://esm.sh/lucide-react@0.563.0"
  }
}
</script>
```

### Hidden Canvas for Frame Capture
`App.tsx` uses hidden canvas element to capture video frames for AI analysis:
```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);
// ...
<div className="hidden">
  <canvas ref={canvasRef} />
</div>
```

### Dual Video Ref Management
Two separate video refs with synchronized state:
```typescript
const userVideoRef = useRef<HTMLVideoElement>(null);
const proVideoRef = useRef<HTMLVideoElement>(null);
```

## COMMANDS

```bash
# Development
npm run dev          # Vite dev server on localhost:3000

# Build
npm run build        # Production build to dist/
npm run preview      # Preview production build

# Setup
npm install          # Install dependencies
cp .env.local.example .env.local  # Set GEMINI_API_KEY
```

## ENVIRONMENT

**Required**: `.env.local` with:
```
GEMINI_API_KEY=your_api_key_here
```

Loaded via Vite `define` in `vite.config.ts`:
```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

## NOTES

- **No testing framework** configured (Jest/Vitest not present)
- **No ESLint/Prettier** configured
- **API key in .env.local** - security concern for production
- **Flat structure** - no `src/` directory
- **No CI/CD** configuration files
- Built with Google AI Studio (exported project)
- Uses Tailwind CSS via CDN, not npm package
