# What-If Map — AI Decision Studio

What-If Map is a futuristic, interactive AI decision-mapping platform built to model, visualize, and analyze multi-branch scenarios. Powered by Google Gemini AI, interactive flowchart engines, and high-performance canvas physics, it helps users explore critical choices, projected outcomes, and cognitive decision lineage.

---

## Technology Stack & Architecture

### 1. Core Framework & Runtime
- **[Next.js 16 (App Router)](https://nextjs.org/)**: Full-stack framework utilizing App Router, Server/Client components, and dynamic API endpoints.
- **[React 19](https://react.dev/)**: Latest React release leveraging state management, context providers (`useUserContext`), custom hooks, and concurrent rendering features.

### 2. Artificial Intelligence Engine
- **[@google/genai (Google Gemini API)](https://ai.google.dev/)**: Generates intelligent decision vectors, risk assessment profiles, strategic advice recommendations, and multi-path outcome probabilities.

### 3. Flowchart & Node System
- **[@xyflow/react (React Flow v12)](https://reactflow.dev/)**:
  - Interactive diagramming engine with customizable node types.
  - Custom glassmorphic nodes representing *Mindsets*, *Catalysts*, *Decisions*, *Forecasts*, and *Outcomes*.
  - Gold-highlighted decision lineage tracing algorithm connecting leaf nodes to root parent paths.
  - Interactive MiniMap, layout zoom controls, and custom edge marker styling.

### 4. Physics & Canvas Animations
- **[GSAP (GreenSock Animation Platform)](https://gsap.com/)**: High-performance inertia physics calculations, velocity dampening, and elastic return animations.
- **React Bits `<DotGrid />` Component**:
  - Interactive HTML5 2D Canvas dot grid background.
  - Features mouse proximity color blending, inertia displacement, and click-triggered shockwave physics propagation.

### 5. Database & Authentication
- **[MongoDB](https://www.mongodb.com/) & [Mongoose 9](https://mongoosejs.com/)**: Document-based schema modeling for user history, saved decision paths, and AI persona analysis profiles.
- **[NextAuth.js v4](https://next-auth.js.org/)**: Authentication provider managing secure user sessions and API endpoint authorization.

### 6. Design System & UI Components
- **Vanilla CSS3 & Glassmorphism**:
  - Multi-layered frosted glass panels (`backdrop-filter: blur(30px) saturate(210%)`).
  - Rotating `conic-gradient` animated borders running on compositor threads.
  - Neon glow aura shadows, tactile 3D press feedback, and metallic gradient typography.
- **[Lucide React](https://lucide.dev/)**: Iconography system for component visualization (`Sparkles`, `Brain`, `Zap`, `GitFork`, `TrendingUp`, `Target`, `Compass`, `ArrowLeft`, `RotateCcw`).

---

## Key Features

- **Interactive AI Scenario Generation**: Enter any scenario or life decision to instantly generate a branched decision tree.
- **Interactive Canvas Matrix**: Pan, zoom, and manipulate nodes with a reactive `<DotGrid />` physics background.
- **AI Strategic Advice**: Real-time AI recommendation box analyzing the optimal path forward based on risk tolerance and decision style.
- **Decision Path Lineage Tracing**: Click any end-of-path node to illuminate the entire historical decision lineage in gold.
- **Scenario Saving & History**: Save chosen decision paths to MongoDB and review past scenarios seamlessly.

---

## Getting Started

### Prerequisites
- **Node.js**: `v20.19.0` or higher
- **MongoDB**: A running MongoDB instance or connection URI
- **Google Gemini API Key**: API key for `@google/genai`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/what-if-map.git
   cd what-if-map
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
what-if-map/
├── app/
│   ├── api/
│   │   ├── ai/            # Gemini AI analysis & scenario routes
│   │   ├── auth/          # NextAuth session handler
│   │   └── history/       # MongoDB decision history endpoints
│   ├── components/
│   │   ├── DotGrid.js     # React Bits interactive canvas background
│   │   ├── DotGrid.css    # Canvas positioning styles
│   │   ├── customNode.js  # Glassmorphic flowchart node component
│   │   └── ...
│   ├── hi/                # Interactive Scenario Map page (/hi)
│   ├── login/             # Login & Auth page
│   ├── globals.css        # Core design system & keyframe animations
│   ├── layout.js          # Main application layout & providers
│   └── page.js            # Landing page
├── lib/                   # Database connection & auth utilities
├── models/                # Mongoose database models
└── package.json           # Project manifest & dependencies
```
