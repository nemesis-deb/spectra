# Spectra Preset Format (.spk)

## Overview
Spectra presets are JSON files with the `.spk` extension that store visualizer configurations and settings.

**SPK** = **Sp**ectra **K**it

## File Structure

```json
{
  "version": "1.0.0",
  "name": "Starfield",
  "timestamp": "2025-11-23T12:00:00.000Z",
  "visualizer": {
    "type": "Starfield",
    "settings": {
      "starCount": 200,
      "speed": 1.5,
      "haloFreqStart": 25,
      "haloFreqEnd": 75,
      "haloIntensity": 1.2
    }
  },
  "global": {
    "primaryColor": "#00ff88",
    "bgColor": "#000000",
    "lineWidth": 2,
    "smoothing": 0.8,
    "sensitivity": 1.0,
    "mirrorEffect": false,
    "beatDetection": true,
    "beatFlashIntensity": 0.3,
    "beatFlashDuration": 0.92
  }
}
```

## Fields

### Root Level
- **version** (string): Preset format version (currently "1.0.0")
- **name** (string): Visualizer name
- **timestamp** (string): ISO 8601 timestamp of preset creation
- **visualizer** (object): Visualizer-specific configuration
- **global** (object): Global application settings

### Visualizer Object
- **type** (string): Visualizer name (must match available visualizers)
- **settings** (object): Visualizer-specific settings (varies by visualizer)

### Global Object
- **primaryColor** (string): Primary color in hex format
- **bgColor** (string): Background color in hex format
- **lineWidth** (number): Line width (1-10)
- **smoothing** (number): Audio smoothing (0-1)
- **sensitivity** (number): Audio sensitivity (0.5-2)
- **mirrorEffect** (boolean): Enable mirror effect
- **beatDetection** (boolean): Enable beat detection
- **beatFlashIntensity** (number): Beat flash intensity (0-1)
- **beatFlashDuration** (number): Beat flash duration (0.85-0.98)

## Visualizer-Specific Settings

### Starfield
```json
{
  "starCount": 200,        // Number of stars (50-500)
  "speed": 1.0,            // Movement speed (0.1-3)
  "haloFreqStart": 25,     // Halo frequency start % (0-100)
  "haloFreqEnd": 75,       // Halo frequency end % (0-100)
  "haloIntensity": 1.0     // Halo brightness multiplier (0-2)
}
```

### Radial Bars
```json
{
  "barCount": 64,          // Number of bars (16-128)
  "rotation": 0,           // Rotation angle (0-360)
  "frequencyStart": 0,     // Frequency range start % (0-100)
  "frequencyEnd": 100      // Frequency range end % (0-100)
}
```

### Kaleidoscope
```json
{
  "particleCount": 100,    // Number of particles (50-300)
  "speed": 1.0,            // Animation speed (0.1-3)
  "trailLength": 10,       // Trail length (0-20)
  "bloomIntensity": 0.5    // Bloom effect intensity (0-1)
}
```

### Particles
```json
{
  "particleCount": 170,    // Number of particles (50-500)
  "speed": 1.6             // Movement speed (0.1-3)
}
```

## Usage

### Saving a Preset
1. Configure your visualizer and settings
2. Open Settings modal
3. Click "Save Preset" button
4. Choose location and filename
5. File will be saved with `.spk` extension

### Loading a Preset
1. Open Settings modal
2. Click "Load Preset" button
3. Select a `.spk` file
4. Settings will be applied immediately

## Example Presets

### Vocal Focus
```json
{
  "version": "1.0.0",
  "name": "Starfield_Vocal_Focus",
  "visualizer": {
    "type": "Starfield",
    "settings": {
      "haloFreqStart": 40,
      "haloFreqEnd": 80,
      "haloIntensity": 1.5
    }
  }
}
```

### Bass Heavy
```json
{
  "version": "1.0.0",
  "name": "Radial_Bass",
  "visualizer": {
    "type": "Radial Bars",
    "settings": {
      "frequencyStart": 0,
      "frequencyEnd": 30
    }
  },
  "global": {
    "beatFlashIntensity": 0.8,
    "sensitivity": 1.5
  }
}
```

## Notes
- Preset files are plain JSON and can be edited manually
- Invalid presets will show an error message
- Missing fields will use default values
- Presets are portable across different installations
- Share presets with other Spectra users!

## Version History
- **1.0.0** (2025-11-23): Initial preset format
