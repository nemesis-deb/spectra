import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // Theme
    colorTheme: 'green', // 'green', 'blue', 'purple', 'red', 'orange', 'cyan', 'pink', 'yellow', 'custom'
    primaryColor: '#00ff88',
    backgroundColor: '#000000',
    
    // Appearance
    lineWidth: 2,
    smoothing: 0.8,
    sensitivity: 1.0,
    mirrorEffect: false,
    
    // Performance
    canvasResolution: '1200x600',
    customCanvasWidth: 1200,
    customCanvasHeight: 600,
    gpuAcceleration: true,
    fpsCap: 'unlimited', // 'unlimited', '500', '360', '240', '200', '144', '120', '60', '30', '24'
    
    // Beat Detection
    beatDetection: true,
    beatFlashIntensity: 0.3,
    beatFlashDuration: 0.92,
    
    // Display
    useCamelotNotation: true,
    keyNotation: 'camelot', // 'standard', 'camelot', 'numeric'
    
    // Album Art
    albumArtBackground: true, // Show album art in file list
    // Album Art Background Wallpaper
    albumArtWallpaper: true, // Enable album art background wallpaper
    albumArtBlur: 20,
    albumArtOpacity: 0.3,
    albumArtRotationSpeed: 50, // seconds for full rotation (higher = slower)
    albumArtZoom: 1.5, // Zoom level to avoid visible corners (default 1.5x)
    
    // Developer
    openDevToolsOnStartup: false,
    
    // Load from localStorage on init
    loaded: false
  }),

  actions: {
    loadSettings() {
      if (this.loaded) return;
      
      try {
        // Load from old settings format
        const oldSettings = localStorage.getItem('audioVisualizerSettings');
        if (oldSettings) {
          const parsed = JSON.parse(oldSettings);
          Object.assign(this, parsed);
        }
        
        // Load individual settings from localStorage
        const colorTheme = localStorage.getItem('colorTheme');
        if (colorTheme) this.colorTheme = colorTheme;
        
        const canvasResolution = localStorage.getItem('canvasResolution');
        if (canvasResolution) this.canvasResolution = canvasResolution;
        
        const customPrimaryColor = localStorage.getItem('customPrimaryColor');
        if (customPrimaryColor) this.primaryColor = customPrimaryColor;
        
        // Apply theme on load
        if (this.colorTheme !== 'custom') {
          this.applyTheme(this.colorTheme);
        } else {
          this.applyCustomColor(this.primaryColor);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
      
      this.loaded = true;
    },
    
    saveSettings() {
      try {
        const settings = {
          primaryColor: this.primaryColor,
          backgroundColor: this.backgroundColor,
          colorTheme: this.colorTheme,
          lineWidth: this.lineWidth,
          smoothing: this.smoothing,
          sensitivity: this.sensitivity,
          mirrorEffect: this.mirrorEffect,
          canvasResolution: this.canvasResolution,
          customCanvasWidth: this.customCanvasWidth,
          customCanvasHeight: this.customCanvasHeight,
          gpuAcceleration: this.gpuAcceleration,
          fpsCap: this.fpsCap,
          beatDetection: this.beatDetection,
          beatFlashIntensity: this.beatFlashIntensity,
          beatFlashDuration: this.beatFlashDuration,
          useCamelotNotation: this.useCamelotNotation,
          keyNotation: this.keyNotation,
          albumArtBackground: this.albumArtBackground,
          albumArtWallpaper: this.albumArtWallpaper,
          albumArtBlur: this.albumArtBlur,
          albumArtOpacity: this.albumArtOpacity,
          albumArtRotationSpeed: this.albumArtRotationSpeed,
          albumArtZoom: this.albumArtZoom,
          openDevToolsOnStartup: this.openDevToolsOnStartup
        };
        localStorage.setItem('audioVisualizerSettings', JSON.stringify(settings));
        localStorage.setItem('colorTheme', this.colorTheme);
        localStorage.setItem('canvasResolution', this.canvasResolution);
        if (this.colorTheme === 'custom') {
          localStorage.setItem('customPrimaryColor', this.primaryColor);
        }
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    },
    
    setPrimaryColor(color) {
      this.primaryColor = color;
      this.applyCustomColor(color);
      this.saveSettings();
    },
    
    setBackgroundColor(color) {
      this.backgroundColor = color;
      this.saveSettings();
    },
    
    setColorTheme(theme) {
      this.colorTheme = theme;
      if (theme !== 'custom') {
        this.applyTheme(theme);
      }
      this.saveSettings();
    },
    
    applyTheme(themeName) {
      const colorThemes = {
        green: { primary: '#00ff88', primaryHover: '#00dd77', primaryDark: '#00cc6a', primaryLight: '#33ffaa', primaryRgb: '0, 255, 136' },
        blue: { primary: '#0088ff', primaryHover: '#0066dd', primaryDark: '#0055cc', primaryLight: '#33aaff', primaryRgb: '0, 136, 255' },
        purple: { primary: '#aa00ff', primaryHover: '#8800dd', primaryDark: '#7700cc', primaryLight: '#cc33ff', primaryRgb: '170, 0, 255' },
        red: { primary: '#ff4444', primaryHover: '#dd2222', primaryDark: '#cc1111', primaryLight: '#ff6666', primaryRgb: '255, 68, 68' },
        orange: { primary: '#ff8800', primaryHover: '#dd6600', primaryDark: '#cc5500', primaryLight: '#ffaa33', primaryRgb: '255, 136, 0' },
        cyan: { primary: '#00ffff', primaryHover: '#00dddd', primaryDark: '#00cccc', primaryLight: '#33ffff', primaryRgb: '0, 255, 255' },
        pink: { primary: '#ff00aa', primaryHover: '#dd0088', primaryDark: '#cc0077', primaryLight: '#ff33cc', primaryRgb: '255, 0, 170' },
        yellow: { primary: '#ffff00', primaryHover: '#dddd00', primaryDark: '#cccc00', primaryLight: '#ffff33', primaryRgb: '255, 255, 0' }
      };
      
      const theme = colorThemes[themeName];
      if (!theme) return;
      
      document.documentElement.style.setProperty('--theme-primary', theme.primary);
      document.documentElement.style.setProperty('--theme-primary-hover', theme.primaryHover);
      document.documentElement.style.setProperty('--theme-primary-dark', theme.primaryDark);
      document.documentElement.style.setProperty('--theme-primary-light', theme.primaryLight);
      document.documentElement.style.setProperty('--theme-primary-rgb', theme.primaryRgb);
      
      this.primaryColor = theme.primary;
    },
    
    applyCustomColor(color) {
      const rgb = this.hexToRgb(color);
      if (!rgb) return;
      
      const hover = this.rgbToHex(Math.max(0, rgb.r - 34), Math.max(0, rgb.g - 34), Math.max(0, rgb.b - 34));
      const dark = this.rgbToHex(Math.max(0, rgb.r - 51), Math.max(0, rgb.g - 51), Math.max(0, rgb.b - 51));
      const light = this.rgbToHex(Math.min(255, rgb.r + 51), Math.min(255, rgb.g + 51), Math.min(255, rgb.b + 51));
      
      document.documentElement.style.setProperty('--theme-primary', color);
      document.documentElement.style.setProperty('--theme-primary-hover', hover);
      document.documentElement.style.setProperty('--theme-primary-dark', dark);
      document.documentElement.style.setProperty('--theme-primary-light', light);
      document.documentElement.style.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    },
    
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },
    
    rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    },
    
    updateSetting(key, value) {
      this[key] = value;
      this.saveSettings();
    }
  }
});

