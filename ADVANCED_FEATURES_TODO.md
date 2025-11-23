# Advanced Features Roadmap

This document outlines advanced features to be implemented in the Audio Visualizer.

## 🎉 Recent Accomplishments (January 2025)

### Major Visualizer Update Complete!
- ✅ **Added 5 new visualizers** (Kaleidoscope, DNA Helix, Starfield, Tunnel, Fireworks)
- ✅ **Total visualizers: 13** (8 original + 5 new)
- ✅ **WebGL/Three.js integration** for GPU-accelerated 3D visualizers
- ✅ **Fixed GPU acceleration** - removed --disable-gpu flag
- ✅ **Trail effects** with proper GPU acceleration
- ✅ **Enhanced music reactivity** across all visualizers

### Major Refactoring Complete!
- ✅ **Extracted 8 visualizers** to separate ES6 modules
- ✅ **Created 4 core modules**: FileManager, DiscordRPC, BPMDetector, SpotifyIntegration
- ✅ **Reduced codebase** by ~1,000 lines (40% reduction!)
- ✅ **Modern architecture** with ES6 imports/exports
- ✅ **All features working** - no regressions!

### Features Completed
- ✅ **Beat Detection** with BPM-based timing
- ✅ **BPM Detection** with live display
- ✅ **Key Detection** with chromagram analysis (Camelot notation)
- ✅ **Preset System** - Save/load visualizer configs as .spk files
- ✅ **GPU Acceleration** toggle for better performance (FIXED!)
- ✅ **Recursive folder scanning** with subfolder toggle
- ✅ **Discord Rich Presence** with accurate timestamps
- ✅ **Spotify Integration** (metadata/playlists only - no DRM playback)
- ✅ **Custom Settings Modal** with organized sections
- ✅ **Custom UI Controls** (dropdowns, checkboxes, sliders)
- ✅ **Frequency range customization** for Radial Bars
- ✅ **Enhanced Starfield** with vocal-reactive center halo

**Note on Spotify:** Integration provides playlist browsing and metadata (BPM, key, artist, etc.) but does NOT play Spotify tracks directly due to DRM limitations. Use it to discover music and get track info, then play matching local files for visualization.

---

## 🎨 Visual Enhancements

### Phase 1: Visualizer Transitions
- [ ] Create transition manager class
- [ ] Implement fade transition between visualizers
- [ ] Add morph transition (blend two visualizers)
- [ ] Add slide transition effects
- [ ] Create transition duration setting (0.5s - 3s)
- [ ] Add transition easing options (linear, ease-in-out, etc.)
- [ ] Test transitions with all 8 visualizers

### Phase 2: Beat Detection ✅ COMPLETED
- [x] Implement beat detection algorithm (BPM-based timing)
- [x] Create beat threshold settings
- [x] Add visual flash effect on beat
- [x] Add pulse effect on beat
- [x] Create beat sensitivity slider (Flash Intensity & Duration)
- [x] Add beat indicator in UI
- [x] Test with various music genres
- [x] **BONUS:** Extracted to BPMDetector module for better organization

### Phase 3: Color Schemes from Album Art
- [ ] Install/implement color extraction library (Vibrant.js or similar)
- [ ] Extract dominant colors from album art
- [ ] Create color palette generator
- [ ] Apply colors to visualizers automatically
- [ ] Add manual color override option
- [ ] Cache extracted colors for performance
- [ ] Test with various album art styles

### Phase 4: Dual Visualizer Mode
- [ ] Create split-screen layout option
- [ ] Add horizontal/vertical split toggle
- [ ] Allow independent visualizer selection for each pane
- [ ] Implement synchronized audio analysis for both
- [ ] Add split ratio adjustment (50/50, 60/40, 70/30)
- [ ] Create quad view (4 visualizers)
- [ ] Add performance optimization for dual mode

### Phase 5: Background Blur Effect
- [ ] Extract album art from audio files (ID3 tags)
- [ ] Implement blur filter (CSS backdrop-filter or canvas)
- [ ] Add blur intensity slider (0-20px)
- [ ] Create opacity control for background
- [ ] Add color overlay options
- [ ] Implement fallback gradient if no album art
- [ ] Test performance impact

### Phase 6: Reactive UI
- [ ] Make control buttons pulse with bass
- [ ] Add glow effect to active elements
- [ ] Create reactive progress bar (thickness changes)
- [ ] Make volume slider react to audio
- [ ] Add subtle animations to file list
- [ ] Create intensity setting for UI reactions
- [ ] Optimize for performance

### Phase 7: Visualizer Presets
- [ ] Create preset data structure (visualizer + settings)
- [ ] Add "Save Preset" button
- [ ] Create preset manager UI
- [ ] Implement preset loading
- [ ] Add preset naming and description
- [ ] Create default presets (Chill, Party, Minimal, etc.)
- [ ] Export/import presets as JSON
- [ ] Add preset thumbnails/previews

### Phase 8: Strobe/Flash Warning
- [ ] Implement flash detection algorithm
- [ ] Calculate flash frequency and intensity
- [ ] Show warning modal when threshold exceeded
- [ ] Add "Reduce Motion" mode
- [ ] Create flash intensity limiter
- [ ] Add accessibility settings panel
- [ ] Test with high-energy visualizations

### Phase 9: Waveform History (Ghost Effect) ✅ COMPLETED
- [x] Store previous waveform frames in buffer
- [x] Render trailing waveforms with decreasing opacity
- [x] Add trail length setting (0-20 frames) - **Kaleidoscope visualizer**
- [x] Create trail fade speed control (GPU-accelerated)
- [x] Optimize memory usage (WebGL preserveDrawingBuffer)
- [x] Test with Kaleidoscope visualizer
- [ ] Add color shift option for trails
- [ ] Extend to other visualizers

### Phase 10: 3D Visualizers ✅ PARTIALLY COMPLETED
- [x] Set up Three.js or WebGL context
- [x] Create 3D tunnel visualizer (Tunnel - pulsing rings)
- [x] Create 3D helix visualizer (DNA Helix - rotating double helix)
- [x] Create 3D kaleidoscope visualizer (symmetrical particles)
- [x] Implement lighting effects (ambient + point lights)
- [x] Add particle system in 3D space (Kaleidoscope)
- [x] Optimize for performance (GPU acceleration, instancing)
- [ ] Create 3D cube visualizer
- [ ] Create 3D sphere visualizer
- [ ] Add camera controls (rotation, zoom)
- [ ] Create 3D spectrum bars
- [ ] Add fallback for unsupported devices

---

## 📊 Audio Analysis

### Phase 11: BPM Detection ✅ COMPLETED
- [x] Implement BPM detection algorithm (web-audio-beat-detector)
- [x] Display BPM in UI (live display in controls bar)
- [ ] Add BPM history graph
- [ ] Create tap tempo feature
- [x] Add BPM-based effects (pulse on beat) - **DONE!**
- [x] Cache BPM for each song (analyzed on load)
- [x] Test accuracy with various genres
- [x] **BONUS:** Spotify BPM integration
- [x] **BONUS:** Extracted to BPMDetector module

### Phase 12: Key Detection ✅ COMPLETED
- [x] Implement musical key detection algorithm (Krumhansl-Schmuckler chromagram analysis)
- [x] Display key in UI (C major, A minor, etc.)
- [x] Spotify key integration (automatic from track features)
- [x] Manual key setting support
- [x] Confidence calculation
- [x] **BONUS:** Extracted to KeyDetector module for better organization
- [ ] Add key change detection
- [ ] Create key-based color schemes
- [ ] Cache detected keys
- [ ] Test with various music styles

### Phase 13: Spectrum Analyzer Display
- [ ] Create detailed spectrum analyzer visualizer
- [ ] Add frequency labels (Hz)
- [ ] Implement logarithmic frequency scale
- [ ] Add peak hold indicators
- [ ] Create customizable frequency bands
- [ ] Add dB scale display
- [ ] Implement waterfall display mode

### Phase 14: Peak Meter
- [ ] Create peak meter UI component
- [ ] Add left/right channel meters
- [ ] Implement peak hold with decay
- [ ] Add clipping indicator (red warning)
- [ ] Create VU meter style option
- [ ] Add meter orientation (vertical/horizontal)
- [ ] Implement RMS and peak modes

### Phase 15: Stereo Visualizer
- [ ] Create left/right channel separation
- [ ] Add stereo waveform visualizer
- [ ] Create stereo spectrum analyzer
- [ ] Implement phase correlation meter
- [ ] Add stereo width indicator
- [ ] Create Lissajous curve visualizer
- [ ] Test with mono and stereo files

### Phase 16: Audio Fingerprinting
- [ ] Research audio fingerprinting APIs (AcoustID, Gracenote)
- [ ] Implement fingerprint generation
- [ ] Add song identification feature
- [ ] Display identified song info
- [ ] Auto-update metadata from identification
- [ ] Add manual identification trigger
- [ ] Handle API rate limits and errors

---

## 🎵 Advanced Playback Features

### Phase 17: Crossfade Between Songs
- [ ] Implement crossfade algorithm
- [ ] Add crossfade duration setting (0-10s)
- [ ] Create fade curve options (linear, exponential)
- [ ] Pre-load next track for seamless transition
- [ ] Add crossfade preview
- [ ] Test with various file formats
- [ ] Optimize memory usage

### Phase 18: Gapless Playback
- [ ] Remove silence detection at track boundaries
- [ ] Implement seamless track transitions
- [ ] Pre-buffer next track
- [ ] Handle different sample rates
- [ ] Add gapless toggle option
- [ ] Test with live albums and DJ mixes

### Phase 19: A-B Loop
- [ ] Add A-B loop UI controls
- [ ] Implement loop point setting (click to set A, click to set B)
- [ ] Create loop indicator on progress bar
- [ ] Add loop count display
- [ ] Implement infinite loop option
- [ ] Add keyboard shortcuts (L for loop, Shift+L to clear)
- [ ] Save loop points per song

### Phase 20: Pitch Shift
- [ ] Implement pitch shifting algorithm
- [ ] Add pitch control slider (-12 to +12 semitones)
- [ ] Create fine-tune control (cents)
- [ ] Add preset pitch shifts (octave up/down)
- [ ] Maintain audio quality during shift
- [ ] Test with various audio types
- [ ] Add pitch shift indicator in UI

### Phase 21: Bookmarks
- [ ] Create bookmark data structure
- [ ] Add "Add Bookmark" button
- [ ] Implement bookmark list UI
- [ ] Add bookmark naming
- [ ] Create bookmark navigation (jump to bookmark)
- [ ] Add bookmark export/import
- [ ] Display bookmarks on progress bar
- [ ] Implement bookmark hotkeys (Ctrl+B)

### Phase 22: Smart Playlists
- [ ] Create smart playlist builder UI
- [ ] Add filter by BPM range
- [ ] Add filter by duration
- [ ] Add filter by genre (from tags)
- [ ] Add filter by play count
- [ ] Add filter by date added
- [ ] Implement "Similar to current song" playlist
- [ ] Add random playlist generator

### Phase 23: Recently Played
- [ ] Create play history database (localStorage or file)
- [ ] Track each song play with timestamp
- [ ] Create "Recently Played" view
- [ ] Add date grouping (Today, Yesterday, This Week)
- [ ] Implement history limit (last 100 songs)
- [ ] Add "Clear History" option
- [ ] Create history export feature

### Phase 24: Play Count
- [ ] Track play count per song
- [ ] Display play count in file browser
- [ ] Add "Most Played" view
- [ ] Create play count statistics
- [ ] Add play count reset option
- [ ] Export play count data
- [ ] Add play count threshold for "favorites"

---

## 📁 Library Management

### Phase 25: Multiple Folder Support
- [ ] Create folder list UI
- [ ] Add "Add Folder" button
- [ ] Implement folder scanning for multiple directories
- [ ] Create unified file list from all folders
- [ ] Add folder enable/disable toggles
- [ ] Save folder list to settings
- [ ] Add folder remove option

### Phase 26: Folder Watching
- [ ] Implement file system watcher (Node.js fs.watch)
- [ ] Detect new files added to watched folders
- [ ] Auto-refresh file list on changes
- [ ] Add notification for new files
- [ ] Implement debouncing for rapid changes
- [ ] Add watch enable/disable toggle
- [ ] Handle folder deletion gracefully

### Phase 27: Tag Editor
- [ ] Install ID3 tag library (node-id3 or music-metadata)
- [ ] Create tag editor UI modal
- [ ] Add fields: Title, Artist, Album, Year, Genre
- [ ] Implement tag reading
- [ ] Implement tag writing
- [ ] Add batch tag editing
- [ ] Add album art editor
- [ ] Create tag templates

### Phase 28: Duplicate Finder
- [ ] Implement duplicate detection algorithm (by hash or metadata)
- [ ] Create duplicate finder UI
- [ ] Show duplicate groups
- [ ] Add comparison view (duration, bitrate, size)
- [ ] Implement smart duplicate selection
- [ ] Add delete duplicate option
- [ ] Create duplicate report export

### Phase 29: Folder Grouping ✅ PARTIALLY COMPLETED
- [x] Add recursive folder scanning (include subfolders option)
- [x] Create checkbox toggle for subfolder inclusion
- [x] Save subfolder preference to localStorage
- [x] Auto-reload folder when toggle changes
- [x] **BONUS:** Extracted to FileManager module
- [ ] Add grouping options (Artist, Album, Genre, Folder)
- [ ] Create grouped view UI
- [ ] Implement collapsible groups
- [ ] Add group sorting options
- [ ] Create group headers with counts
- [ ] Add "Play All in Group" option
- [ ] Implement group search/filter

---

## 🎧 Audio Processing & Export

### Phase 30: Export Audio
- [ ] Implement audio export with effects applied
- [ ] Add format selection (MP3, WAV, FLAC)
- [ ] Create quality/bitrate settings
- [ ] Add export progress indicator
- [ ] Implement batch export
- [ ] Add metadata preservation
- [ ] Create export presets

---

## 🌈 Themes & UI Customization

### Phase 31: Theme System
- [ ] Create theme data structure (colors, fonts, spacing)
- [ ] Implement dark theme (current)
- [ ] Create light theme
- [ ] Add custom theme builder UI
- [ ] Implement theme preview
- [ ] Add theme export/import (JSON)
- [ ] Create theme gallery with presets
- [ ] Add theme hot-swapping

### Phase 32: Layout Customization
- [ ] Create layout editor mode
- [ ] Add drag-and-drop for UI elements
- [ ] Implement panel resizing
- [ ] Add panel show/hide toggles
- [ ] Create layout presets (Minimal, Full, DJ Mode)
- [ ] Save custom layouts
- [ ] Add layout reset option

### Phase 33: Compact Mode
- [ ] Create compact UI layout
- [ ] Hide non-essential elements
- [ ] Add mini player mode
- [ ] Implement always-on-top option
- [ ] Create compact mode toggle
- [ ] Optimize for small screens
- [ ] Add compact mode hotkey

### Phase 34: Transparency Effects
- [ ] Implement window transparency (Electron)
- [ ] Add frosted glass effect (backdrop-filter)
- [ ] Create opacity controls
- [ ] Add blur intensity slider
- [ ] Implement acrylic effect (Windows)
- [ ] Test on different platforms
- [ ] Add transparency toggle

---

## 🌐 Sharing & Export

### Phase 35: Generate Shareable Visualization
- [ ] Implement canvas recording (MediaRecorder API)
- [ ] Add "Record" button
- [ ] Create recording duration setting (5s, 10s, 30s)
- [ ] Implement GIF export (gif.js library)
- [ ] Add video export (WebM, MP4)
- [ ] Create quality settings
- [ ] Add watermark option
- [ ] Implement progress indicator

---

## ⚡ Performance & Optimization

### Phase 36: Hardware Acceleration Toggle ✅ COMPLETED
- [x] Add GPU acceleration toggle (in Settings > Performance)
- [x] Implement CSS-based GPU acceleration (transform: translateZ(0))
- [x] Create performance monitoring (enabled by default)
- [x] **FIXED: Removed --disable-gpu flag** (was forcing CPU rendering!)
- [x] Enhanced GPU hints (perspective, willChange, etc.)
- [x] WebGL/Three.js integration for true GPU utilization
- [ ] Add GPU usage indicator
- [x] Test performance difference (massive improvement after fix!)
- [x] Add auto-detect best mode (enabled by default)

### Phase 37: FPS Limiter
- [ ] Implement FPS limiting (30/60/120/Unlimited)
- [ ] Add FPS counter display
- [ ] Create FPS dropdown selector
- [ ] Optimize animation loop timing
- [ ] Add adaptive FPS mode
- [ ] Test battery impact

### Phase 38: Quality Presets
- [ ] Create quality preset system
- [ ] Define Low preset (reduced particles, simple effects)
- [ ] Define Medium preset (balanced)
- [ ] Define High preset (full effects)
- [ ] Define Ultra preset (maximum quality)
- [ ] Add auto-detect based on hardware
- [ ] Create quality comparison guide

### Phase 39: Memory Usage Display
- [ ] Implement memory monitoring
- [ ] Add memory usage indicator in UI
- [ ] Create memory usage graph
- [ ] Add memory cleanup button
- [ ] Implement automatic garbage collection
- [ ] Add memory leak detection
- [ ] Create memory usage alerts

---

## 🛠️ Developer & Advanced Features

### Phase 40: Plugin System
- [ ] Design plugin API architecture
- [ ] Create plugin loader
- [ ] Define plugin manifest format (JSON)
- [ ] Implement plugin sandbox
- [ ] Add plugin manager UI
- [ ] Create example plugins
- [ ] Write plugin development documentation
- [ ] Add plugin marketplace/directory

### Phase 41: API/WebSocket Server
- [ ] Implement WebSocket server
- [ ] Create API endpoints (play, pause, next, etc.)
- [ ] Add authentication/security
- [ ] Create API documentation
- [ ] Implement event broadcasting
- [ ] Add remote control web interface
- [ ] Create API client libraries

### Phase 42: Custom Shader Support
- [ ] Set up WebGL shader pipeline
- [ ] Create shader editor UI
- [ ] Implement GLSL shader loading
- [ ] Add shader compilation error handling
- [ ] Create shader library
- [ ] Add shader hot-reloading
- [ ] Write shader development guide
- [ ] Create example shaders

### Phase 43: Scripting System
- [ ] Implement JavaScript scripting engine
- [ ] Create scripting API
- [ ] Add script editor UI
- [ ] Implement script auto-run on events
- [ ] Create script library
- [ ] Add script debugging tools
- [ ] Write scripting documentation
- [ ] Create example scripts

---

## 📋 Implementation Priority

### High Priority (Implement First)
1. Beat Detection - Adds immediate visual impact
2. Crossfade - Professional feature users expect
3. BPM Detection - Useful for DJs and music enthusiasts
4. Multiple Folder Support - Essential for library management
5. Theme System - Let users customize appearance

### Medium Priority
6. Visualizer Transitions - Polish feature
7. Dual Visualizer Mode - Cool but not essential
8. Album Art Display - Makes UI feel complete
9. Recently Played - Nice to have
10. Quality Presets - Performance optimization

### Low Priority (Nice to Have)
11. 3D Visualizers - Complex, high effort
12. Audio Fingerprinting - Requires external API
13. Plugin System - Advanced feature
14. Custom Shaders - For power users
15. API/WebSocket - For integration

---

## 🧪 Testing Checklist

For each feature:
- [ ] Unit tests written
- [ ] Integration tests passed
- [ ] Performance benchmarked
- [ ] Cross-platform tested (Windows/Mac/Linux)
- [ ] Accessibility tested
- [ ] Documentation updated
- [ ] User feedback collected

---

## 📚 Resources & Libraries

### Recommended Libraries:
- **Beat Detection**: `web-audio-beat-detector`
- **Color Extraction**: `node-vibrant` or `color-thief`
- **3D Graphics**: `three.js`
- **GIF Export**: `gif.js`
- **Video Recording**: `MediaRecorder API`
- **ID3 Tags**: `music-metadata` or `node-id3`
- **Audio Fingerprinting**: `AcoustID` API
- **WebGL Shaders**: `glslify`

---

## 💡 Notes

- Prioritize features that enhance user experience
- Keep performance in mind for all visual features
- Test with various audio formats and qualities
- Consider accessibility for all UI changes
- Document all new features in README
- Create video tutorials for complex features

---

## 🎨 New Visualizers Added (January 2025)

### 2D Visualizers (3)
1. **Kaleidoscope** (WebGL) - Symmetrical mandala patterns with 10+ customization options
   - Particle shapes: sphere, cube, cone, torus
   - Trail effects (0-20 length)
   - Bloom intensity control
   - Depth and spread customization
2. **Starfield** - Enhanced space flight with music reactivity
   - Bass controls speed
   - Mids control size
   - Highs control brightness
   - Camera shake on heavy bass
3. **Fireworks** - Beat-reactive particle explosions
   - Automatic beat detection
   - Gravity and physics simulation
   - Customizable sensitivity

### 3D Visualizers (2)
4. **DNA Helix** - Rotating double helix structure
   - Audio-reactive spheres
   - Connecting bars
   - Customizable height and speed
5. **Tunnel** - Infinite tunnel effect
   - Pulsing rings
   - Audio-reactive scaling
   - Fog effects

---

**Last Updated**: 2025-01-23
**Total Features**: 43 major features (8 completed/partially completed)
**Completed This Session**: 5 new visualizers, GPU acceleration fix, trail effects
**Estimated Development Time**: 6-12 months (depending on team size)
