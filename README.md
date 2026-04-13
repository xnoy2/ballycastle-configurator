# Ballycastle Climbing Frames — Configurator

Interactive 3D climbing frame configurator built with React + Vite + Three.js.

---

## Quick Start

### 1. Install Node.js
Download from https://nodejs.org (choose LTS version — v20 or v22)

### 2. Open this folder in VSCode terminal, then run:

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Project Structure

```
src/
├── data/
│   └── products.js          ← All modules, options & prices — edit here
├── hooks/
│   └── useConfigurator.js   ← All state logic (selections, pricing, warnings)
├── components/
│   ├── TopBar.jsx/css        ← Header bar
│   ├── ModulePanel.jsx/css   ← Left column — module selectors
│   ├── ViewerPanel.jsx/css   ← Centre — Three.js 3D viewer
│   └── SummaryPanel.jsx/css  ← Right column — line items + quote CTA
├── App.jsx / App.css         ← Root layout (3-column grid)
├── main.jsx                  ← React entry point
└── index.css                 ← Global CSS variables & reset
```

---

## Adding Your GLB Files (when ready)

### Step 1 — Drop files into `/public/models/`
```
public/
└── models/
    ├── tower-1.5m.glb
    ├── roof-wooden.glb
    ├── slide-3.0m.glb
    └── ...
```

### Step 2 — Fill in the `glb` field in `src/data/products.js`
Each option already has a commented-out example:
```js
// Before:
glb: null, // '/models/tower-1.5m.glb'

// After:
glb: '/models/tower-1.5m.glb',
```
That's it. The viewer auto-detects the path, downloads the model,
and swaps out the placeholder mesh. No code changes needed.

### Step 3 — Adjust position/rotation if parts don't snap together
Each option also has `position` and `rotation` fields:
```js
position: [0, 0, 0],   // [x, y, z] in metres
rotation: [0, 0, 0],   // [x, y, z] in radians
```
Tweak these until all parts line up in the scene.

### How the GLB system works
```
products.js          →  glb: '/models/...'  (or null)
                               │
useConfigurator.js   →  activeGlbParts[]    (only enabled + selected options)
                               │
ViewerPanel.jsx      →  passes to GlbScene
                               │
GlbScene.jsx         →  maps each part to <GlbPart>
                               │
GlbPart.jsx          →  glb set?  → useGLTF(url) → <primitive>
                          glb null? → <PlaceholderMesh> (shape per type)
```

---

## Adding Supabase (Step 4)

```bash
npm install @supabase/supabase-js
```

Create `src/lib/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

Create `.env` in root:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then wire up `handleGenerateQuote` in `SummaryPanel.jsx` to insert into a
`quotes` table.

---

## Tech Stack

| Layer      | Technology                     |
|------------|--------------------------------|
| Framework  | React 18 + Vite 5              |
| 3D Viewer  | Three.js + React Three Fiber   |
| 3D Helpers | @react-three/drei              |
| Icons      | lucide-react                   |
| Backend    | Supabase (Step 4)              |
| 3D Format  | GLB (glTF-Binary)              |
