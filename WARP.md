# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Bubble Notes Chat** is a modern note-taking application designed as a conversation with yourself. It's built as a React-based web app with multiple deployment options including desktop apps via Tauri or Electron.

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Vite
- **UI Framework:** shadcn/ui components + Radix UI primitives
- **Styling:** Tailwind CSS with custom neumorphic design system
- **State Management:** Zustand with persistence
- **Form Handling:** React Hook Form + Zod validation  
- **Desktop Apps:** Tauri
- **Mobile:** Capacitor support configured

## Development Commands

### Core Development
```bash
# Start development server (runs on http://localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Desktop Development
```bash
# Tauri development (recommended - requires Rust)
npm run tauri:dev

# Build Tauri desktop app
npm run tauri:build

# Tauri CLI commands
npm run tauri -- [command]
```

### Testing & Quality
```bash
# Run ESLint
npm run lint

# Install dependencies
npm install

# Clean install
rm -rf node_modules package-lock.json && npm install
```

## Architecture Overview

### Application Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components 
│   ├── Sidebar.tsx     # Notes list sidebar
│   ├── ChatWindow.tsx  # Main message area
│   ├── MessageBubble.tsx # Individual message display
│   ├── MessageInput.tsx # Message composition
│   └── ThemeProvider.tsx # Theme management
├── hooks/              # Custom React hooks
│   ├── useMessageEdit.ts # Message editing logic
│   └── use-mobile.ts   # Mobile detection
├── store/              # State management
│   └── notesStore.ts   # Main Zustand store
├── pages/              # Route components
│   ├── Index.tsx       # Main app layout
│   └── NotFound.tsx    # 404 page
└── lib/                # Utilities
    └── utils.ts        # Helper functions
```

### State Management Architecture
The app uses **Zustand** for state management with persistence:

- **Central Store:** `src/store/notesStore.ts`
- **Persistence:** Automatic localStorage persistence via Zustand middleware
- **State Shape:**
  ```typescript
  interface NotesState {
    notes: Note[]           // All notes
    activeNoteId: string    // Currently selected note
    isEditing: string       // Message being edited
  }
  ```

### Component Architecture
- **Two-panel Layout:** `Sidebar` + `ChatWindow`
- **Message System:** Chat-like interface with formatting options
- **Live Editing:** In-place message editing with auto-save
- **Theme System:** Dark/light mode toggle with system preference

### Key Design Patterns
- **Neumorphic UI:** Custom CSS classes (`neuro-base`, `neuro-button`, `neuro-inset`)
- **Responsive Design:** Mobile-first with desktop enhancements
- **Type Safety:** Full TypeScript coverage with strict configuration
- **Component Composition:** Heavy use of Radix UI primitives with shadcn/ui styling

## Development Guidelines

### Adding New Features
1. **Components:** Add to `src/components/` with TypeScript interfaces
2. **State:** Extend the Zustand store in `notesStore.ts`
3. **Hooks:** Custom logic goes in `src/hooks/`
4. **Styling:** Use Tailwind classes + neumorphic design tokens

### Message Formatting System
Messages support multiple formats:
```typescript
type MessageFormat = 'plain' | 'h1' | 'h2' | 'h3' | 'bold' | 'italic' | 'ul' | 'ol'
```

### Custom Styles
The app uses a custom neumorphic design system:
- `neuro-base` - Base elevated surface
- `neuro-button` - Interactive button style
- `neuro-inset` - Inset/pressed appearance
- `neuro-subtle` - Subtle elevation
- `neuro-pressed` - Active/pressed state

### Desktop App Development
- **Tauri:** Rust-based, small bundle (~2-3MB)
- **Window Config:** See `src-tauri/tauri.conf.json` for desktop window settings
- **Build Output:** `src-tauri/target/release/bundle/` (contains .msi and .exe installers)

### State Persistence
- Data automatically persists to localStorage
- Storage key: `notes-storage`
- Versioned storage with migration support
- All notes, messages, and app state preserved across sessions

### Import Aliases
- `@/` maps to `src/` directory
- Use `@/components/ui/*` for shadcn components
- Use `@/lib/utils` for utilities

## Key Files to Understand

- **`src/store/notesStore.ts`** - Central state management
- **`src/components/ChatWindow.tsx`** - Main message interface
- **`src/components/Sidebar.tsx`** - Notes list and navigation
- **`src/hooks/useMessageEdit.ts`** - Message editing behavior
- **`tailwind.config.ts`** - Custom design system configuration
- **`src-tauri/tauri.conf.json`** - Desktop app configuration

## Deployment Options

### Web Deployment
Standard Vite build output in `dist/` directory.

### Desktop Deployment  
See `DEPLOYMENT_GUIDE.md` for detailed instructions on:
- Tauri setup and building
- Windows installer generation (.msi and .exe)
- Cross-platform considerations

### Mobile Deployment
Capacitor is configured but requires additional setup for iOS/Android builds.
