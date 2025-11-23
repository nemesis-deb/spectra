# Source Code Organization

This directory contains the organized source code for the Audio Visualizer application.

## Directory Structure

```
src/
├── css/
│   └── styles.css          # All application styles
├── js/
│   ├── renderer.js         # Main application logic
│   └── utils/
│       ├── time-formatter.js    # Time formatting utilities
│       └── file-parser.js       # Filename parsing utilities
```

## Module Descriptions

### css/styles.css
All application styling including:
- Layout and components
- Dark theme colors
- Custom scrollbar
- Responsive design

### js/renderer.js
Main application logic containing:
- Audio playback
- Visualizers
- File browser
- Spotify integration
- Discord RPC
- UI handlers

### js/utils/
Utility functions (available for future use):
- **time-formatter.js**: Formats seconds to MM:SS
- **file-parser.js**: Parses filenames to extract artist and title

## Notes

The utility modules are created for future refactoring but are not currently used by renderer.js to maintain stability. They can be integrated when needed.
