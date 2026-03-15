# MONOMYTH.exe

An interactive narrative game engine based on **Joseph Campbell's Hero's Journey theory**. Players input a keyword and character name, and the AI generates a complete 6-step hero's journey story, blending **Ancient Greek mythology** settings, **hand gesture recognition** interaction, and **PDF export** functionality.

[Experience Live](https://monomyth.vercel.app/)
[Demo Video](http://xhslink.com/o/8OL8y6u676w )  


## 📖 Project Overview

### Core Features

- **AI-Powered Dynamic Story Generation**: Uses Google Gemini 2.5 Flash to generate stories following the hero's journey framework based on user input
- **Three-Stage Game Flow**:
  - **Opening Page**: Immersive visual introduction
  - **Input Page**: Enter a story theme (seed) and hero name
  - **Story Page**: Real-time narrative experience
- **Multiple Interaction Methods**:
  - **Keyboard Input**
  - **Gesture Recognition** (MediaPipe): Use hand gestures left/right to select story paths
- **Full-Screen Immersion Mode**: Retro terminal-style UI
- **Story Export**: Automatically generate PDF books with complete story and AI-generated illustrations
- **Retro-Futuristic Aesthetic**: CRT scanlines, green terminal fonts, neon glow effects

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19.2.0 with Vite 7.2.2
- **Styling**: Tailwind CSS + Custom CSS (retro terminal style)
- **Animations**: Pure CSS keyframe animations

### AI & Machine Learning
- **LLM**: Google Gemini 2.5 Flash (story generation)
- **Gesture Recognition**: MediaPipe Tasks Vision (real-time hand detection)
- **Image Generation**: Imagen API via `@google/genai` (illustration generation)

### Backend / API
- **Runtime**: Vercel Serverless Functions (`/api/story`, `/api/icon`, `/api/cover`)
- **Secret Management**: `GEMINI_API_KEY` stored in server-side environment variables

### Export
- **PDF Generation**: html2pdf.js

### Development Tools
- **Build**: Vite
- **Linting**: ESLint
- **Local Full-Stack Dev**: Vercel CLI (`vercel dev`)
- **Package Manager**: npm
- **Deployment**: Vercel (primary), GitHub Pages (static-only fallback)

## 🎮 Game Flow

### 1. Opening Page
- Visually striking title and narration
- Click anywhere to proceed to input stage

### 2. Input Page

**Step One**: Enter the story theme (Language based on the input word)
```
Question: What is the most important thing in your life?
Examples: freedom, love, power, knowledge...
```

**Step Two**: Enter the hero's name
```
Question: The name of the hero is?
Examples: Orion, Artemis, Alexander...
```

### 3. Story Page

#### Story Structure (6 Steps + 1 Epilogue)
1. **Steps 1-2 (Separation)**: The Call to Adventure and Crossing the First Threshold
2. **Steps 3-4 (Initiation)**: The Road of Trials and The Abyss
3. **Steps 5-6 (Return)**: The Ultimate Boon and Master of Two Worlds
4. **Step 7 (Epilogue)**: The Grand Title and Final Reflection

#### Interaction Methods

**Gesture Interaction** (requires camera permission)
```
Move hand to left 40% area    →  Select left option
Move hand to right 40% area   →  Select right option
Progress bar fills to 100%    →  Auto-selects choice
```

#### Story Completion
- Displays Grand Title: The mythical name given to the story
- Provides PDF export button
- Restart button (resets the entire narration)

## 📦 Project Structure

```
MONOMYTH/
├── api/                     # Serverless API routes (run on Vercel)
│   ├── story.js             # Story generation endpoint
│   ├── icon.js              # Background icon generation endpoint
│   ├── cover.js             # Cover image generation endpoint
│   └── _lib/env.js          # Local/server env loader
├── src/
│   ├── pages/
│   │   ├── opening/          # Opening page
│   │   │   ├── opening.jsx
│   │   │   └── opening.css
│   │   ├── input/            # Input page
│   │   │   ├── input.jsx
│   │   │   └── input.css
│   │   └── story/            # Story page
│   │       ├── story.jsx      # Main story logic with typewriter effect & choice handling
│   │       └── story.css      # Retro terminal styling
│   ├── models/               # AI & Interaction modules
│   │   ├── handChoice.jsx    # Gesture recognition controller (MediaPipe)
│   │   ├── coverGenerator.jsx # PDF cover generation (Gemini Vision)
│   │   └── iconGenerator.jsx  # Icon/illustration generation
│   ├── components/
│   │   ├── header/           # Page header
│   │   ├── footer/           # Page footer
│   │   └── background.jsx    # Progressive background
│   ├── App.jsx               # Main app component (manages three-stage state)
│   ├── constants.js          # System prompt and max steps config
│   └── main.jsx              # App entry point
├── index.html
├── package.json
├── vercel.json
├── vite.config.js
├── .env.local                # Local environment variables (git-ignored)
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm
- Vercel CLI (`npm i -g vercel`)
- Google AI Studio API key (for Gemini access)

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/SihongShen/MONOMYTH.exe.git
cd MONOMYTH
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment Variables
```bash
touch .env.local
```

Edit `.env.local` and add your API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**How to Get an API Key**:
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Select a new or existing project
4. Copy the generated key to your `.env.local` file

**⚠️ Security Warning**:
- Never hardcode API keys in source code
- Add `.env.local` to `.gitignore` (already included)
- Exposed keys can be abused; protect them carefully

#### 4. Start Local Full-Stack Development (Frontend + API)
```bash
npm run dev:local
```

Open your browser and visit `http://localhost:3000`

#### 5. Frontend-only Development (Optional)
```bash
npm run dev
```

Use this mode only for UI work. API routes in `/api/*` are not served in this mode.

#### 6. Build for Production
```bash
npm run build
npm run preview  # Preview production build locally
```

#### 7. Deploy
```bash
npm run deploy
```

`npm run deploy` deploys to Vercel production.

If you need static-only GitHub Pages deployment:
```bash
npm run deploy:pages
```

## 🎨 Core Components Explained

### 1. **Typewriter Component** (Typing Effect)
```jsx
<Typewriter 
  text={node.narrative}
  isLatest={isLatest}
  speed={25}
  onComplete={handleTypewriterComplete}
/>
```
- Displays story text character by character with blinking cursor
- Animation only plays for the latest story node
- Triggers `onComplete` callback when finished

### 2. **HandChoiceController Component** (Gesture Recognition)
```jsx
<HandChoiceController 
  leftOption="Choice A Text"
  rightOption="Choice B Text"
  onSelect={(selected) => handleChoice(selected)}
/>
```
- Real-time webcam input (requires user permission)
- Auto-triggers when hand is in left/right 40% area for 2-3 seconds
- Visual progress bar feedback
- Shows ghost hand animation when no hand is detected

### 3. **GeminiCover Component** (PDF Cover)
- Generates artistic illustrations for stories
- Uses Gemini Vision API
- Integrated into PDF export workflow

### 4. **ProgressiveBackground Component** (Background Animation)
- Classic CRT scanline effect
- CSS gradients and keyframe animations
- Smooth transitions

## 🎯 Story Generation Prompt

Story generation relies on a carefully designed **system prompt** (see `src/constants.js`) that includes:

### Hero's Journey Framework
- **Separation** (Steps 1-2): Call to Adventure, Refusal, Crossing Threshold
- **Initiation** (Steps 3-4): Road of Trials, The Abyss, Dark Ordeal
- **Return** (Steps 5-6): Ultimate Boon, Magic Flight, Return Threshold
- **Resolution** (Step 7): Grand Title, Final Reflection

### Aesthetic Guidance
- **Setting**: Strictly Ancient Greek/Mediterranean mythology
- **Forbidden Elements**: No sci-fi terminology (code, glitch, system, dimension)
- **Required Elements**: Sensory details (sight, sound, smell, touch, psyche), metaphors, mythological archetypes

### Choice Design
- Avoid binary opposites (yes/no, stay/leave)
- Offer two different **methods of engagement** rather than simple branches

### JSON Output Format
```json
{
  "narrative": "Story text",
  "choices": [
    {
      "id": "A",
      "shortDesc": "Brief description",
      "text": "Narration after choice"
    },
    {
      "id": "B",
      "shortDesc": "Brief description",
      "text": "Narration after choice"
    }
  ],
  "title": "Step title",
  "step": 1,
  "stage": "SEPARATION",
  "grandTitle": "Story final name (only in epilogue)"
}
```

---

## 🎮 User Interaction Flow

```
Opening Page
  ↓ (Click anywhere)
Input Page - Step 1
  Enter theme keyword (e.g., "freedom")
  ↓ (Press Enter)
Input Page - Step 2
  Enter hero name (e.g., "Orion")
  ↓ (Press Enter)
Input Page - Step 3 (Loading progress bar)
  ↓ (Progress reaches 100%)
Story Page - Step 1
  Display story text (typewriter effect)
  ↓ (Click option or gesture)
Story Page - Steps 2-6
  Repeat choice → Next step
  ↓ (Complete step 6)
Story Page - Epilogue (Step 7)
  Display story grand title
  ↓ (Click export or restart)
Story Export/Reset
```

## 📱 Device Compatibility

| Feature | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Story Reading | ✅ | ✅ | ✅ |
| Button Selection | ✅ | ✅ | ✅ |
| Gesture Recognition | ✅ | ⚠️ Requires camera | ⚠️ Requires camera |
| PDF Export | ✅ | ✅ | ⚠️ File management challenging |

---

## 🔧 Environment Configuration

### `.env` File Example

```env
# Google Gemini API Key (get from https://aistudio.google.com)
VITE_GEMINI_API_KEY=your_api_key_here

# (Optional) Custom API endpoint
# VITE_API_ENDPOINT=https://your-custom-endpoint.com

# (Optional) Debug mode
# VITE_DEBUG=true
```

### Available Environment Variables
- `VITE_GEMINI_API_KEY` *(required)*: Google AI API key
- All `VITE_` prefixed variables are exposed to client code
- Non-`VITE_` prefixed variables are only used during build time

## 📖 Development Guide

### Modifying Story Prompts

Edit `SYSTEM_INSTRUCTION` in `src/constants.js`:

```javascript
export const SYSTEM_INSTRUCTION = `
  // Modify story framework, style, constraints, etc.
`;
```

**Embark on your hero's journey!** 🌟
