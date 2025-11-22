# Audio Visualizer

A beautiful real-time audio visualizer built with Electron, featuring multiple visualization modes, beat detection, BPM analysis, and Discord Rich Presence integration.

![Audio Visualizer](icon_nobg.png)

## Features

### 🎨 8 Unique Visualizers
- **Waveform** - Classic oscilloscope-style waveform
- **Frequency Bars** - Traditional frequency spectrum bars
- **Circular** - Circular frequency visualization
- **Particles** - Dynamic particle system responding to audio
- **Spectrum** - Colorful frequency spectrum
- **Radial Bars** - Circular bar visualization
- **Wave Rings** - Concentric wave patterns
- **Oscilloscope** - XY oscilloscope mode

### 🎵 Audio Features
- **BPM Detection** - Automatic tempo detection using web-audio-beat-detector
- **Beat Flashing** - Visual effects synced to the beat
- **Playback Controls** - Play, pause, next, previous, shuffle, repeat
- **Speed Control** - Adjust playback speed (0.5x to 2x)
- **Volume Control** - Adjustable volume with visual feedback
- **Progress Bar** - Seek to any position in the track

### 🎮 Discord Integration
- **Rich Presence** - Show what you're listening to on Discord
- Displays current song, artist, and visualizer
- Shows time remaining when playing
- Updates automatically

### 🎛️ Customization
- **Color Themes** - Customize primary color and background
- **Visualizer Settings** - Each visualizer has unique settings
- **Beat Detection** - Adjustable flash intensity and duration
- **Smoothing & Sensitivity** - Fine-tune the visualization
- **Mirror Effect** - Optional mirrored visualization

### 📁 File Management
- **Folder Browser** - Browse and load music folders
- **Search** - Filter songs by title or artist
- **Queue View** - See and manage your playlist
- **Auto-load** - Remembers last opened folder
- **Format Support** - MP3, WAV, OGG, FLAC, M4A, AAC, WMA

## Installation

### Download
Download the latest installer from the [Releases](../../releases) page.

### Build from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/audio-visualizer.git
   cd audio-visualizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the app**
   ```bash
   npm start
   ```

4. **Build installer**
   ```bash
   npm run build:win    # Windows
   npm run build:mac    # macOS
   npm run build:linux  # Linux
   ```

## Discord Rich Presence Setup

1. Go to https://discord.com/developers/applications
2. Create a new application named "Audio Visualizer"
3. Copy the Application ID
4. Open `main.js` and replace the `clientId` on line 6
5. (Optional) Upload your icon in Rich Presence → Art Assets as `icon`

See [DISCORD_SETUP.md](DISCORD_SETUP.md) for detailed instructions.

## Keyboard Shortcuts

- **Space** - Play/Pause
- **Arrow Left** - Previous track
- **Arrow Right** - Next track
- **Arrow Up** - Volume up
- **Arrow Down** - Volume down

## Technologies

- **Electron** - Desktop app framework
- **Web Audio API** - Audio processing and analysis
- **Canvas API** - Real-time visualization rendering
- **discord-rpc** - Discord Rich Presence integration
- **web-audio-beat-detector** - BPM detection

## Project Structure

```
audio-visualizer/
├── main.js              # Electron main process
├── renderer.js          # Renderer process & visualizers
├── index.html           # UI layout
├── package.json         # Dependencies & build config
├── icon_nobg.png        # App icon
└── README.md           # This file
```

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Add new visualizers

## License

MIT License - feel free to use this project however you'd like!

## Credits

Built with ❤️ using Electron and Web Audio API

BPM detection powered by [web-audio-beat-detector](https://github.com/chrisguttandin/web-audio-beat-detector)
