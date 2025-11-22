# Audio Visualizer App - Learning Roadmap

## Phase 1: Project Setup & Foundation
- [ ] Initialize npm project (`npm init`)
- [ ] Install Electron (`npm install electron --save-dev`)
- [ ] Install audio processing library (`npm install web-audio-api`)
- [ ] Create basic project structure (main.js, renderer.js, index.html)
- [ ] Set up Electron window that opens and displays "Hello World"
- [ ] Configure package.json with start script

## Phase 2: Audio Input - File Playback
- [x] Create HTML audio element or use Web Audio API AudioContext
- [x] Add file picker button to select audio files
- [x] Load audio file into AudioContext
- [x] Create AudioBufferSourceNode to play the file
- [x] Add play/pause controls
- [x] Test that audio plays correctly

## Phase 3: Audio Analysis Setup
- [x] Create AnalyserNode from AudioContext
- [x] Connect audio source → analyser → destination (speakers)
- [x] Set up analyser properties (fftSize, smoothingTimeConstant)
- [x] Create data arrays for frequency and time domain data
- [x] Test getting data from analyser (console.log the values)

## Phase 4: Canvas Visualization - Waveform
- [x] Add HTML5 canvas element to your page
- [x] Get canvas 2D context in JavaScript
- [x] Create animation loop using requestAnimationFrame
- [x] Get time domain data from analyser (getByteTimeDomainData)
- [x] Draw waveform: loop through data and draw lines
- [x] Clear canvas each frame and redraw
- [x] Adjust colors, line width, and styling

## Phase 5: System Audio Capture (Advanced)
- [x] Research: Electron doesn't capture system audio directly
- [x] Option A: Use desktopCapturer API to capture screen with audio
- [x] Option B: Use navigator.mediaDevices.getUserMedia for mic input
- [ ] Option C: Integrate native module (more complex)
- [x] Implement chosen approach
- [x] Connect system audio stream to AudioContext
- [x] Test with music playing in browser/Spotify

## Phase 6: Visualizer Architecture (Extensibility)
- [x] Create base Visualizer class/interface
- [x] Define common methods: init(), update(audioData), draw(canvas)
- [x] Refactor waveform into WaveformVisualizer class
- [x] Create visualizer manager/registry to hold multiple visualizers
- [x] Add UI to switch between visualizers
- [x] Test switching between visualizers

## Phase 7: Add More Visualizers
- [x] Create FrequencyBarsVisualizer (frequency domain data)
- [x] Create CircularVisualizer (radial waveform)
- [x] Create ParticleVisualizer (audio-reactive particles)
- [x] Add each to the visualizer registry

## Phase 8: Customization System
- [x] Add settings panel/modal
- [x] Create controls for colors (color pickers)
- [x] Add sliders for: line width, smoothing, sensitivity
- [x] Add toggles for: background, glow effects, mirroring
- [x] Save settings to localStorage
- [x] Load settings on app start

## Phase 9: Polish & Features
- [x] Add window controls (using native OS controls)
- [ ] Make window frameless/transparent (optional)
- [x] Add keyboard shortcuts
- [x] Add drag-and-drop for audio files
- [x] Improve UI/UX design
- [ ] Add app icon

## Phase 10: Build & Distribution
- [x] Install electron-builder (`npm install electron-builder --save-dev`)
- [x] Configure build settings in package.json
- [x] Build executable for Windows
- [ ] Test the built app
- [ ] (Optional) Add auto-updater

---

## Key Concepts to Learn Along the Way

### Web Audio API
- AudioContext: The main audio processing graph
- AudioNode: Building blocks (source, analyser, destination)
- AnalyserNode: Provides frequency/time domain data
- Connecting nodes: source.connect(analyser).connect(destination)

### Canvas API
- getContext('2d'): Get drawing context
- clearRect(): Clear the canvas
- beginPath(), moveTo(), lineTo(), stroke(): Draw lines
- fillStyle, strokeStyle: Set colors
- requestAnimationFrame(): Smooth 60fps animation loop

### Electron Basics
- Main process (main.js): Node.js environment, creates windows
- Renderer process (renderer.js): Browser environment, UI logic
- IPC: Communication between main and renderer
- BrowserWindow: Creates app windows

### Architecture Pattern
- Separation of concerns: audio logic, visualization logic, UI logic
- Plugin/strategy pattern: Swappable visualizers
- Observer pattern: Audio data → visualizers

---

## Helpful Resources
- Electron docs: https://www.electronjs.org/docs
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Canvas tutorial: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial
- Audio visualizer tutorial: Search "Web Audio API visualizer tutorial"

---

## Tips
- Start small, test often
- Console.log everything when debugging
- Use Chrome DevTools (Electron has built-in DevTools)
- Comment your code as you learn
- Don't worry about perfect code first time - refactor later
- Google errors - they're learning opportunities!

Good luck! Check off items as you complete them. Come back anytime you get stuck or need guidance on a specific step.
