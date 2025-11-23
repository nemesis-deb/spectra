# Project Structure

This document describes the organized file structure of the Audio Visualizer project.

## Directory Layout

```
audio-visualizer/
├── main.js                 # Electron main process
├── index.html              # Main HTML file (minimal, links to external files)
├── package.json            # Project dependencies and build config
│
├── src/                    # Source files
│   ├── css/
│   │   └── styles.css      # All application styles
│   │
│   ├── js/
│   │   ├── renderer.js     # Main renderer process (all logic currently here)
│   │   ├── visualizers/    # Future: Individual visualizer modules
│   │   └── utils/          # Future: Utility functions
│   │
│   └── html/               # Future: HTML partials/components
│
├── docs/                   # Documentation
│   ├── README.md
│   ├── BUILD_GUIDE.md
│   ├── DISCORD_SETUP.md
│   ├── SPOTIFY_SETUP.md
│   ├── TESTING.md
│   ├── TODO.md
│   └── ADVANCED_FEATURES_TODO.md
│
└── assets/                 # Images and icons
    ├── icon.png            # App icon (no background)
    └── icon-bg.png         # App icon (with background)
```

## Current Organization

### Completed
- ✅ Extracted CSS from index.html to `src/css/styles.css`
- ✅ Moved renderer.js to `src/js/renderer.js`
- ✅ Updated index.html to use external files
- ✅ Updated package.json build configuration

### Future Improvements

The `renderer.js` file is still quite large (~2500 lines). Consider splitting it into:

1. **src/js/audio-player.js** - Audio playback logic
   - loadAudioFile()
   - Play/pause/seek controls
   - Progress tracking

2. **src/js/visualizers/** - Individual visualizer classes
   - waveform.js
   - frequency-bars.js
   - circular.js
   - particle.js
   - spectrum.js
   - radial-bars.js
   - wave-rings.js
   - oscilloscope.js

3. **src/js/file-browser.js** - File system operations
   - loadFolder()
   - renderFileList()
   - File selection handling

4. **src/js/spotify-integration.js** - Spotify API logic
   - Authentication
   - Playlist loading
   - Track playback

5. **src/js/ui-handlers.js** - UI event handlers
   - Button clicks
   - Keyboard shortcuts
   - Settings panel

6. **src/js/utils/** - Utility functions
   - formatTime()
   - parseFileName()
   - BPM detection

7. **src/js/discord-rpc.js** - Discord Rich Presence
   - updateDiscordPresence()

## Benefits of This Structure

- **Maintainability**: Easier to find and modify specific features
- **Collaboration**: Multiple developers can work on different modules
- **Testing**: Individual modules can be tested in isolation
- **Performance**: Potential for lazy loading modules
- **Clarity**: Clear separation of concerns

## How to Further Modularize

To split renderer.js into modules, you'll need to:

1. Use ES6 modules or CommonJS require/exports
2. Create separate files for each logical component
3. Import/require them in the correct order
4. Consider using a bundler like webpack or esbuild for production builds

Example:
```javascript
// src/js/utils/time-formatter.js
module.exports = {
  formatTime: (seconds) => {
    // implementation
  }
};

// src/js/renderer.js
const { formatTime } = require('./utils/time-formatter');
```
