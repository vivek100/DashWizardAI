# Dashboard AI Application

## Overview
A modern dashboard application with AI chat interface, data visualization, and lazy background synchronization with Supabase.

## 🆕 New: React Flow Dashboard Editor

The dashboard editor has been completely refactored to use **React Flow** for better performance, maintainability, and user experience:

- 🎯 **Fixed drag and drop interactions** - No more buggy custom implementation
- ⚙️ **Separate config button** - Clear distinction between selection and configuration
- 🔄 **Proper zoom and scroll handling** - Table scrolling works correctly when zoomed
- 📏 **Enhanced resizing** - React-resizable integration with visual feedback
- 🎨 **Better interaction modes** - Clear separation of drag, select, configure actions
- 🚀 **Improved performance** - React Flow's optimized rendering
- 🔮 **Future-ready** - Built-in support for widget connections and advanced features

### Key Improvements

| Issue | Before | After |
|-------|--------|-------|
| Drag & Drop | Buggy custom implementation | React Flow's robust system |
| Config Panel | Opens on all clicks | Dedicated config button |
| Table Scrolling | Broken when zoomed | Proper event handling |
| Widget Resizing | Complex custom logic | React-resizable library |
| Interaction Modes | Confusing mixed states | Clear separation |

### Migration Status

- ✅ **Dependencies added** - React Flow and react-resizable
- ✅ **Types enhanced** - Better TypeScript support
- ✅ **Components created** - WidgetFlowNode and DashboardFlowEditor
- ✅ **Interaction improved** - Clear action separation
- 🔄 **Ready for testing** - Install dependencies and update routes

## 🆕 New: Lazy Background Sync Implementation

The dashboard store now features **lazy background synchronization** that provides:

- ⚡ **Instant loading** from localStorage
- 🔄 **Background sync** with Supabase  
- 📱 **Offline-first** functionality
- 🔀 **Zero breaking changes** to existing components
- 🛡️ **Graceful error handling** and retry logic

### Key Benefits

| Feature | Before | After |
|---------|--------|-------|
| App startup | Waits for network | Instant from localStorage |
| User operations | Could block on network | Always synchronous/immediate |
| Offline support | Broken | Full functionality + queue |
| Error handling | Poor UX | Graceful degradation |
| Component changes | Required rewrites | Zero breaking changes |

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │    │  Dashboard Store │    │  Sync Manager   │
│                 │────│                  │────│                 │
│ (No Changes!)   │    │  (Synchronous)   │    │  (Background)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                         │
                       ┌────────▼──────────┐    ┌─────────▼──────────┐
                       │ Local Storage     │    │ Supabase Utils     │
                       │ - Instant Access  │    │ - CRUD Operations  │
                       │ - Backup/Recovery │    │ - Conflict Detect  │
                       │ - Version Migrate │    │ - Error Handling   │
                       └───────────────────┘    └────────────────────┘
```

## Features

### Dashboard Management
- Create, edit, and delete dashboards
- Widget-based dashboard builder with **React Flow integration**
- Template system with pre-built analytics dashboards
- Real-time data visualization
- **Background sync** to Supabase with offline support

### Data Integration
- CSV file upload and processing
- SQL query interface for data exploration
- Multiple data source support
- Automatic schema detection

### AI Chat Interface
- Natural language queries for dashboard creation
- Intelligent widget suggestions
- Context-aware responses
- **Persistent conversation history** (synced)

### User Management
- Supabase authentication
- User-specific dashboard isolation
- Template sharing capabilities
- **Multi-device synchronization**

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- Environment variables configured

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd project
```

2. Install dependencies
```bash
npm install
```

3. **Install React Flow dependencies** (for new dashboard editor)
```bash
# Run the PowerShell script
./install-dependencies.ps1

# Or manually install
pnpm add @reactflow/core @reactflow/controls @reactflow/background @reactflow/minimap react-resizable
pnpm add -D @types/react-resizable
```

4. Set up environment variables
```bash
cp .env.example .env.local
# Add your Supabase credentials
```

5. **Run database migration** (for lazy sync)
```bash
# Execute the SQL migration in your Supabase dashboard
# File: src/utils/migrations/001_create_dashboards_table.sql
```

### Updating to React Flow Dashboard Editor

1. **Install dependencies** (see above)
2. **Update routes** to use the new editor:
```typescript
// Replace in your router
import { DashboardFlowEditorWrapper } from './components/dashboards/DashboardFlowEditor';

<Route path="/dashboards/:id" element={<DashboardFlowEditorWrapper />} />
```

3. **Test thoroughly** - All existing functionality should work
4. **Remove old editor** - Delete DashboardEditor.tsx if everything works

## Development

### Project Structure
```
src/
├── components/
│   ├── dashboards/
│   │   ├── DashboardFlowEditor.tsx    # New React Flow editor
│   │   ├── WidgetFlowNode.tsx         # React Flow node wrapper
│   │   ├── WidgetRenderer.tsx         # Enhanced with config button
│   │   └── DashboardEditor.tsx        # Old editor (can be removed)
│   └── ...
├── store/
│   ├── dashboardStore.ts              # Lazy sync implementation
│   └── ...
└── types/
    └── index.ts                       # Enhanced with React Flow types
```

### Key Components

#### DashboardFlowEditor
- Main React Flow-based dashboard editor
- Handles widget creation, deletion, and positioning
- Manages interaction modes and config panel
- Provides zoom, pan, and grid controls

#### WidgetFlowNode
- React Flow node wrapper for widgets
- Integrates react-resizable for widget resizing
- Handles selection, configuration, and deletion
- Provides visual feedback for interactions

#### WidgetRenderer
- Enhanced with config button next to delete button
- Clear interaction mode handling
- Proper event propagation control
- Better visual feedback for different states

## Contributing

### React Flow Refactor Guidelines

When working with the new React Flow implementation:

1. **Use interaction modes** - Always specify the correct interaction mode
2. **Handle events properly** - Use stopPropagation for widget interactions
3. **Test zoom scenarios** - Ensure table scrolling works when zoomed
4. **Maintain type safety** - Use the enhanced Widget and WidgetNode types

### Code Style

- Use TypeScript for all new components
- Follow the existing component patterns
- Add proper JSDoc comments for complex functions
- Test interaction modes thoroughly

## Troubleshooting

### React Flow Issues

**Widget not dragging properly:**
- Check that the widget is not in preview mode
- Verify interaction mode is set correctly
- Ensure event handlers are properly configured

**Table scrolling broken:**
- Verify the widget is in 'scroll' interaction mode
- Check that zoom controls don't interfere
- Test in both edit and preview modes

**Config panel not opening:**
- Use the dedicated config button (gear icon)
- Check that the widget is selected
- Verify onConfigure callback is properly set

### Lazy Sync Issues

**Data not syncing:**
- Check network connectivity
- Verify Supabase credentials
- Check browser console for sync errors

**Offline functionality broken:**
- Clear localStorage and restart
- Check sync queue status
- Verify conflict resolution logic

## License

MIT License - see LICENSE file for details. 