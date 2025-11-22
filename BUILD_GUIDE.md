# Build Guide

This guide will help you build the Audio Visualizer app for distribution.

## Prerequisites

Before building, ensure you have:
- Node.js installed (v14 or higher)
- All dependencies installed (`npm install`)
- The app tested and working (`npm start`)

## Build Commands

### Windows Build
```bash
npm run build:win
```

**Output** (in `dist/` folder):
- `Audio Visualizer Setup X.X.X.exe` - NSIS installer
- `Audio Visualizer X.X.X.exe` - Portable executable

**Requirements**:
- Windows 7 or higher
- No additional dependencies needed

### macOS Build
```bash
npm run build:mac
```

**Output** (in `dist/` folder):
- `Audio Visualizer-X.X.X.dmg` - DMG installer
- `Audio Visualizer-X.X.X-mac.zip` - ZIP archive

**Requirements**:
- macOS 10.11 or higher
- Must be built on macOS (for code signing)

### Linux Build
```bash
npm run build:linux
```

**Output** (in `dist/` folder):
- `Audio Visualizer-X.X.X.AppImage` - Universal Linux app
- `audio-visualizer_X.X.X_amd64.deb` - Debian package

**Requirements**:
- Most modern Linux distributions
- AppImage requires FUSE

## Build Configuration

The build configuration is in `package.json` under the `"build"` section:

```json
{
  "build": {
    "appId": "com.audiovisualizer.app",
    "productName": "Audio Visualizer",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "renderer.js",
      "index.html",
      "package.json"
    ]
  }
}
```

## Adding an App Icon (Optional)

To add a custom icon:

1. Create a `build/` folder in your project root
2. Add icon files:
   - Windows: `icon.ico` (256x256 or larger)
   - macOS: `icon.icns` (512x512 or larger)
   - Linux: `icon.png` (512x512 or larger)

You can use online tools to convert images to these formats:
- https://icoconvert.com/ (for .ico)
- https://cloudconvert.com/ (for .icns)

## Testing the Built App

### Windows
1. Navigate to `dist/`
2. Run the portable `.exe` or install using the setup file
3. Test all features

### macOS
1. Open the `.dmg` file
2. Drag the app to Applications
3. Test all features

### Linux
1. Make the AppImage executable: `chmod +x Audio\ Visualizer-*.AppImage`
2. Run it: `./Audio\ Visualizer-*.AppImage`
3. Or install the `.deb`: `sudo dpkg -i audio-visualizer_*.deb`

## Troubleshooting

### Build fails with "Cannot find module"
- Run `npm install` again
- Delete `node_modules/` and run `npm install`

### Icon not showing
- Ensure icon files are in the `build/` folder
- Check file names match the configuration
- Rebuild the app

### App won't start after building
- Check the console for errors
- Ensure all files are included in the `files` array in package.json
- Test with `npm start` before building

### Large file size
- This is normal for Electron apps (includes Chromium and Node.js)
- Windows installer: ~100-150 MB
- Can be reduced with advanced configuration (not covered here)

## Distribution

Once built, you can distribute the app by:
1. Uploading to GitHub Releases
2. Hosting on your website
3. Submitting to app stores (requires additional setup)
4. Sharing the portable executables directly

## Auto-Updates (Advanced)

To add auto-update functionality:
1. Install `electron-updater`
2. Configure update server
3. Add update checking code to `main.js`
4. Sign your builds (required for macOS)

See: https://www.electron.build/auto-update

## Next Steps

- Add a custom icon
- Test on different operating systems
- Create a GitHub release
- Share your app!

## Resources

- [electron-builder documentation](https://www.electron.build/)
- [Electron documentation](https://www.electronjs.org/docs)
- [Code signing guide](https://www.electron.build/code-signing)
