# Testing Checklist

Use this checklist to test the Audio Visualizer app before distribution.

## Development Testing (npm start)

### Basic Functionality
- [ ] App launches without errors
- [ ] Window opens with correct size
- [ ] All UI elements are visible and styled correctly

### File Playback
- [ ] File picker opens
- [ ] Can select audio file (MP3, WAV, OGG)
- [ ] File loads successfully
- [ ] Duration displays correctly
- [ ] Play button works
- [ ] Audio plays through speakers
- [ ] Pause button works
- [ ] Can play different files

### Microphone Input
- [ ] Microphone permission requested
- [ ] Microphone starts successfully
- [ ] Visualization responds to sound
- [ ] Stop microphone works
- [ ] Can switch between file and mic

### Visualizers
- [ ] Waveform displays correctly
- [ ] Frequency Bars display correctly
- [ ] Circular visualizer displays correctly
- [ ] Particles visualizer displays correctly
- [ ] Can switch between visualizers
- [ ] Visualizations respond to audio

### Settings
- [ ] Settings panel expands/collapses
- [ ] Primary color picker works
- [ ] Background color picker works
- [ ] Line width slider works
- [ ] Smoothing slider works
- [ ] Sensitivity slider works
- [ ] Mirror effect toggle works
- [ ] Settings persist after restart

### Drag & Drop
- [ ] Drop zone highlights on drag over
- [ ] Can drop audio file
- [ ] File loads from drop
- [ ] Error message for non-audio files

### Keyboard Shortcuts
- [ ] Space plays/pauses
- [ ] 1-4 switch visualizers
- [ ] S toggles settings

### Window Controls
- [ ] Minimize button works
- [ ] Maximize button works
- [ ] Close button works
- [ ] Window can be resized
- [ ] Minimum size enforced

## Build Testing (npm run build:win)

### Build Process
- [ ] Build completes without errors
- [ ] dist/ folder created
- [ ] Installer (.exe) created
- [ ] Portable executable created
- [ ] File sizes reasonable (~100-150 MB)

### Installer Testing
- [ ] Installer runs
- [ ] Can choose installation directory
- [ ] Desktop shortcut created (if selected)
- [ ] Start menu shortcut created
- [ ] App installs successfully
- [ ] Can launch from shortcuts

### Portable Executable Testing
- [ ] Portable .exe runs
- [ ] No installation required
- [ ] All features work

### Built App Functionality
- [ ] All features from development testing work
- [ ] Settings persist
- [ ] No console errors
- [ ] Performance is good

## Cross-Platform Testing (if applicable)

### macOS
- [ ] DMG opens correctly
- [ ] App can be dragged to Applications
- [ ] App launches from Applications
- [ ] All features work

### Linux
- [ ] AppImage is executable
- [ ] AppImage runs
- [ ] DEB package installs
- [ ] All features work

## Performance Testing

- [ ] Smooth 60fps visualization
- [ ] No lag when switching visualizers
- [ ] No memory leaks (check Task Manager)
- [ ] CPU usage reasonable (<20% idle)
- [ ] Audio playback is smooth

## Edge Cases

- [ ] Very large audio files (>100MB)
- [ ] Very short audio files (<1 second)
- [ ] Corrupted audio files
- [ ] Switching audio sources rapidly
- [ ] Changing settings during playback
- [ ] Multiple rapid visualizer switches

## Known Issues

Document any issues found during testing:

1. 
2. 
3. 

## Sign-off

- [ ] All critical features tested
- [ ] No blocking bugs found
- [ ] Ready for distribution

Tested by: _______________
Date: _______________
Version: _______________
