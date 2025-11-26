<template>
  <div class="settings-modal" :class="{ hidden: !isOpen }" @click.self="close">
    <div class="settings-modal-overlay" @click="close"></div>
    <div class="settings-modal-content" @click.stop>
      <div class="settings-modal-header">
        <h2>Settings</h2>
        <button class="icon-btn" @click="close" title="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="settings-modal-body">
        <!-- Settings Sidebar -->
        <div class="settings-sidebar">
          <button 
            v-for="category in categories" 
            :key="category.id"
            :class="['settings-category', { active: activeCategory === category.id }]"
            @click="activeCategory = category.id"
          >
            <span>{{ category.name }}</span>
          </button>
        </div>
        
        <!-- Settings Content -->
        <div class="settings-content">
          <!-- Appearance Section -->
          <div v-show="activeCategory === 'appearance'" class="settings-section">
            <h3>Appearance</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <label>Color Theme</label>
                <select v-model="colorTheme" @change="onColorThemeChange" class="setting-select">
                  <option value="green">Green (Default)</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="red">Red</option>
                  <option value="orange">Orange</option>
                  <option value="cyan">Cyan</option>
                  <option value="pink">Pink</option>
                  <option value="yellow">Yellow</option>
                  <option value="custom">Custom Color</option>
                </select>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Choose a color theme for the entire app</p>
              </div>
              
              <div v-if="colorTheme === 'custom'" class="setting-item">
                <label>Custom Primary Color</label>
                <div class="setting-control">
                  <input type="color" v-model="primaryColor" @input="onCustomColorChange">
                  <span>{{ primaryColor }}</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label>Background Color</label>
                <div class="setting-control">
                  <input type="color" v-model="backgroundColor" @input="onBackgroundColorChange">
                  <span>{{ backgroundColor }}</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label>Line Width: <span>{{ lineWidth }}</span></label>
                <input type="range" v-model.number="lineWidth" min="1" max="10" @input="onSettingChange('lineWidth', lineWidth)">
              </div>
              
              <div class="setting-item">
                <label>Smoothing: <span>{{ (smoothing * 100).toFixed(0) }}</span></label>
                <input type="range" :value="smoothing * 100" min="0" max="100" @input="smoothing = $event.target.value / 100; onSettingChange('smoothing', smoothing)">
              </div>
              
              <div class="setting-item">
                <label>Sensitivity: <span>{{ (sensitivity * 100).toFixed(0) }}</span></label>
                <input type="range" :value="sensitivity * 100" min="50" max="200" @input="sensitivity = $event.target.value / 100; onSettingChange('sensitivity', sensitivity)">
              </div>
              
              <div class="setting-item">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="mirrorEffect" @change="onSettingChange('mirrorEffect', mirrorEffect)">
                  <span>Mirror Effect</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Performance Section -->
          <div v-show="activeCategory === 'performance'" class="settings-section">
            <h3>Performance</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <label>Canvas Resolution</label>
                <select v-model="canvasResolution" @change="onCanvasResolutionChange" class="setting-select">
                  <option value="800x400">800 × 400 (Low)</option>
                  <option value="1200x600">1200 × 600 (Default)</option>
                  <option value="1600x800">1600 × 800 (High)</option>
                  <option value="1920x1080">1920 × 1080 (Full HD)</option>
                  <option value="2560x1440">2560 × 1440 (2K)</option>
                  <option value="3840x2160">3840 × 2160 (4K)</option>
                  <option value="custom">Custom...</option>
                </select>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Higher resolutions provide better quality but may impact performance</p>
              </div>
              
              <div v-if="canvasResolution === 'custom'" class="setting-item">
                <label>Custom Resolution</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <input 
                    type="number" 
                    v-model.number="customCanvasWidth" 
                    placeholder="Width" 
                    min="400" 
                    max="7680"
                    style="width: 100px; padding: 8px; background: #2a2a2a; border: 1px solid #444; color: #fff; border-radius: 3px;"
                  >
                  <span style="color: #666;">×</span>
                  <input 
                    type="number" 
                    v-model.number="customCanvasHeight" 
                    placeholder="Height" 
                    min="200" 
                    max="4320"
                    style="width: 100px; padding: 8px; background: #2a2a2a; border: 1px solid #444; color: #fff; border-radius: 3px;"
                  >
                  <button 
                    @click="applyCustomResolution"
                    style="padding: 8px 16px; background: #00ff88; color: #000; border: none; border-radius: 3px; cursor: pointer; font-weight: 600;"
                  >
                    Apply
                  </button>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="gpuAcceleration" @change="onSettingChange('gpuAcceleration', gpuAcceleration)">
                  <span>GPU Acceleration</span>
                </label>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 30px;">Enable hardware acceleration for smoother visuals</p>
              </div>
              
              <div class="setting-item">
                <label>FPS Cap</label>
                <select v-model="fpsCap" @change="onSettingChange('fpsCap', fpsCap)" class="setting-select">
                  <option value="unlimited">Unlimited</option>
                  <option value="500">500 FPS</option>
                  <option value="360">360 FPS</option>
                  <option value="240">240 FPS</option>
                  <option value="200">200 FPS</option>
                  <option value="144">144 FPS</option>
                  <option value="120">120 FPS</option>
                  <option value="60">60 FPS</option>
                  <option value="30">30 FPS</option>
                  <option value="24">24 FPS</option>
                </select>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Limit frame rate to reduce CPU/GPU usage</p>
              </div>
            </div>
          </div>

          <!-- Beat Detection Section -->
          <div v-show="activeCategory === 'beat-detection'" class="settings-section">
            <h3>Beat Detection</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="beatDetection" @change="onSettingChange('beatDetection', beatDetection)">
                  <span>Enable Beat Flashing</span>
                </label>
              </div>
              
              <div class="setting-item">
                <label>Flash Intensity: <span>{{ beatFlashIntensity.toFixed(2) }}</span></label>
                <input type="range" v-model.number="beatFlashIntensity" min="0" max="1" step="0.05" @input="onSettingChange('beatFlashIntensity', beatFlashIntensity)">
              </div>
              
              <div class="setting-item">
                <label>Flash Duration: <span>{{ beatFlashDuration.toFixed(2) }}</span></label>
                <input type="range" v-model.number="beatFlashDuration" min="0.85" max="0.98" step="0.01" @input="onSettingChange('beatFlashDuration', beatFlashDuration)">
              </div>
            </div>
          </div>

          <!-- Display Section -->
          <div v-show="activeCategory === 'display'" class="settings-section">
            <h3>Display</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <label>Key Notation Format</label>
                <select v-model="keyNotation" @change="onSettingChange('keyNotation', keyNotation)" class="setting-select">
                  <option value="standard">Standard (C major, A minor)</option>
                  <option value="camelot">Camelot (8B, 5A)</option>
                  <option value="numeric">Numeric (E4, A2, B3)</option>
                </select>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Choose how musical keys are displayed</p>
              </div>
              <div class="setting-item">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="useCamelotNotation" @change="onSettingChange('useCamelotNotation', useCamelotNotation)">
                  <span>Use Camelot Notation (Legacy - use Key Notation Format instead)</span>
                </label>
                <small style="color: #888; display: block; margin-top: 4px;">Deprecated: Use Key Notation Format setting above</small>
              </div>
            </div>
          </div>

          <!-- Album Art Section -->
          <div v-show="activeCategory === 'album-art'" class="settings-section">
            <h3>Album Art</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="albumArtBackground" @change="onSettingChange('albumArtBackground', albumArtBackground)">
                  <span>Show Album Art in File List</span>
                </label>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 30px;">Display album art thumbnails instead of music note icons</p>
              </div>
              
              <div class="setting-item">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="albumArtWallpaper" @change="onSettingChange('albumArtWallpaper', albumArtWallpaper)">
                  <span>Enable Album Art Background</span>
                </label>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 30px;">Show current song's album cover as blurred, rotating background</p>
              </div>
              
              <div v-if="albumArtWallpaper" class="setting-item">
                <label>Blur Power: <span>{{ albumArtBlur }}px</span></label>
                <input type="range" v-model.number="albumArtBlur" min="0" max="100" @input="onSettingChange('albumArtBlur', albumArtBlur)">
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Adjust the blur intensity of the background</p>
              </div>
              
              <div v-if="albumArtWallpaper" class="setting-item">
                <label>Background Opacity: <span>{{ (albumArtOpacity * 100).toFixed(0) }}%</span></label>
                <input type="range" :value="albumArtOpacity * 100" min="0" max="100" @input="albumArtOpacity = $event.target.value / 100; onSettingChange('albumArtOpacity', albumArtOpacity)">
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Adjust the transparency of the background</p>
              </div>
              
              <div v-if="albumArtWallpaper" class="setting-item">
                <label>Rotation Speed: <span>{{ albumArtRotationSpeed }}s</span></label>
                <input type="range" v-model.number="albumArtRotationSpeed" min="10" max="200" @input="onSettingChange('albumArtRotationSpeed', albumArtRotationSpeed)">
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Time for one full rotation (lower = faster)</p>
              </div>
              
              <div v-if="albumArtWallpaper" class="setting-item">
                <label>Zoom Level: <span>{{ albumArtZoom.toFixed(2) }}x</span></label>
                <input type="range" v-model.number="albumArtZoom" min="1.0" max="3.0" step="0.1" @input="onSettingChange('albumArtZoom', albumArtZoom)">
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Zoom level to avoid visible corners after blur (default: 1.5x)</p>
              </div>
            </div>
          </div>

          <!-- Developer Section -->
          <div v-show="activeCategory === 'developer'" class="settings-section">
            <h3>Developer</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="openDevToolsOnStartup" @change="onSettingChange('openDevToolsOnStartup', openDevToolsOnStartup)">
                  <span>Open DevTools on Startup</span>
                </label>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0 30px;">Automatically open developer tools when app starts (requires restart)</p>
              </div>
            </div>
          </div>

          <!-- Visualizer Settings Section (dynamic) -->
          <div v-show="activeCategory === 'visualizer'" class="settings-section">
            <h3>{{ visualizerSettingsTitle }}</h3>
            <div class="settings-grid" ref="visualizerSettingsRef">
              <p v-if="visualizerSettings.length === 0" class="empty-tweaks">No custom settings for this visualizer</p>
              <div v-for="setting in visualizerSettings" :key="setting.key" class="setting-item">
                <!-- Range input -->
                <template v-if="setting.type === 'range'">
                  <label>{{ setting.label }}: <span>{{ setting.value }}</span></label>
                  <input 
                    type="range" 
                    :min="setting.min" 
                    :max="setting.max" 
                    :step="setting.step || 1" 
                    :value="setting.value"
                    @input="onVisualizerSettingChange(setting.key, parseFloat($event.target.value))"
                  >
                </template>
                
                <!-- Select input -->
                <template v-else-if="setting.type === 'select'">
                  <label>{{ setting.label }}:</label>
                  <select 
                    :value="setting.value" 
                    @change="onVisualizerSettingChange(setting.key, $event.target.value)"
                    class="setting-select"
                  >
                    <option v-for="opt in setting.options" :key="opt" :value="opt">
                      {{ opt.charAt(0).toUpperCase() + opt.slice(1) }}
                    </option>
                  </select>
                </template>
                
                <!-- Checkbox input -->
                <template v-else-if="setting.type === 'checkbox'">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      :checked="setting.value"
                      @change="onVisualizerSettingChange(setting.key, $event.target.checked)"
                    >
                    <span>{{ setting.label }}</span>
                  </label>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useSettingsStore } from '../stores/settings.js';
import { useUIStore } from '../stores/ui.js';

const settingsStore = useSettingsStore();
const uiStore = useUIStore();

// Categories
const categories = [
  { id: 'appearance', name: 'Appearance' },
  { id: 'performance', name: 'Performance' },
  { id: 'beat-detection', name: 'Beat Detection' },
  { id: 'display', name: 'Display' },
  { id: 'album-art', name: 'Album Art' },
  { id: 'developer', name: 'Developer' },
  { id: 'visualizer', name: 'Visualizer' }
];

// State
const activeCategory = ref('appearance');
const visualizerSettings = ref([]);
const visualizerSettingsTitle = ref('Visualizer Settings');

// Computed properties from store
const isOpen = computed(() => uiStore.settingsPanelOpen);
const colorTheme = computed({
  get: () => settingsStore.colorTheme,
  set: (value) => settingsStore.setColorTheme(value)
});
const primaryColor = computed({
  get: () => settingsStore.primaryColor,
  set: (value) => settingsStore.setPrimaryColor(value)
});
const backgroundColor = computed({
  get: () => settingsStore.backgroundColor,
  set: (value) => settingsStore.setBackgroundColor(value)
});
const lineWidth = computed({
  get: () => settingsStore.lineWidth,
  set: (value) => settingsStore.updateSetting('lineWidth', value)
});
const smoothing = computed(() => settingsStore.smoothing);
const sensitivity = computed(() => settingsStore.sensitivity);
const mirrorEffect = computed({
  get: () => settingsStore.mirrorEffect,
  set: (value) => settingsStore.updateSetting('mirrorEffect', value)
});
const canvasResolution = computed({
  get: () => settingsStore.canvasResolution,
  set: (value) => settingsStore.updateSetting('canvasResolution', value)
});
const customCanvasWidth = computed({
  get: () => settingsStore.customCanvasWidth,
  set: (value) => settingsStore.updateSetting('customCanvasWidth', value)
});
const customCanvasHeight = computed({
  get: () => settingsStore.customCanvasHeight,
  set: (value) => settingsStore.updateSetting('customCanvasHeight', value)
});
const gpuAcceleration = computed({
  get: () => settingsStore.gpuAcceleration,
  set: (value) => settingsStore.updateSetting('gpuAcceleration', value)
});
const fpsCap = computed({
  get: () => settingsStore.fpsCap,
  set: (value) => settingsStore.updateSetting('fpsCap', value)
});
const beatDetection = computed({
  get: () => settingsStore.beatDetection,
  set: (value) => settingsStore.updateSetting('beatDetection', value)
});
const beatFlashIntensity = computed({
  get: () => settingsStore.beatFlashIntensity,
  set: (value) => settingsStore.updateSetting('beatFlashIntensity', value)
});
const beatFlashDuration = computed({
  get: () => settingsStore.beatFlashDuration,
  set: (value) => settingsStore.updateSetting('beatFlashDuration', value)
});
const useCamelotNotation = computed({
  get: () => settingsStore.useCamelotNotation,
  set: (value) => settingsStore.updateSetting('useCamelotNotation', value)
});

const keyNotation = computed({
  get: () => settingsStore.keyNotation || 'camelot',
  set: (value) => settingsStore.updateSetting('keyNotation', value)
});
const albumArtBackground = computed({
  get: () => settingsStore.albumArtBackground,
  set: (value) => settingsStore.updateSetting('albumArtBackground', value)
});

const albumArtWallpaper = computed({
  get: () => settingsStore.albumArtWallpaper !== false,
  set: (value) => settingsStore.updateSetting('albumArtWallpaper', value)
});

const albumArtBlur = computed({
  get: () => settingsStore.albumArtBlur || 20,
  set: (value) => settingsStore.updateSetting('albumArtBlur', value)
});

const albumArtOpacity = computed({
  get: () => settingsStore.albumArtOpacity || 0.3,
  set: (value) => settingsStore.updateSetting('albumArtOpacity', value)
});

const albumArtRotationSpeed = computed({
  get: () => settingsStore.albumArtRotationSpeed || 50,
  set: (value) => settingsStore.updateSetting('albumArtRotationSpeed', value)
});

const albumArtZoom = computed({
  get: () => settingsStore.albumArtZoom || 1.5,
  set: (value) => settingsStore.updateSetting('albumArtZoom', value)
});
const openDevToolsOnStartup = computed({
  get: () => settingsStore.openDevToolsOnStartup,
  set: (value) => settingsStore.updateSetting('openDevToolsOnStartup', value)
});

// Methods
const close = () => {
  uiStore.toggleSettingsPanel();
};

const onColorThemeChange = () => {
  settingsStore.setColorTheme(colorTheme.value);
};

const onCustomColorChange = () => {
  settingsStore.setPrimaryColor(primaryColor.value);
};

const onBackgroundColorChange = () => {
  settingsStore.setBackgroundColor(backgroundColor.value);
};

const onSettingChange = (key, value) => {
  settingsStore.updateSetting(key, value);
};

const onCanvasResolutionChange = () => {
  if (canvasResolution.value !== 'custom') {
    const [width, height] = canvasResolution.value.split('x').map(Number);
    applyCanvasResolution(width, height);
  }
  settingsStore.updateSetting('canvasResolution', canvasResolution.value);
};

const applyCustomResolution = () => {
  if (customCanvasWidth.value < 400 || customCanvasWidth.value > 7680 || 
      customCanvasHeight.value < 200 || customCanvasHeight.value > 4320) {
    alert('Please enter valid dimensions:\nWidth: 400-7680\nHeight: 200-4320');
    return;
  }
  applyCanvasResolution(customCanvasWidth.value, customCanvasHeight.value);
  settingsStore.updateSetting('canvasResolution', `${customCanvasWidth.value}x${customCanvasHeight.value}`);
};

const applyCanvasResolution = (width, height) => {
  const canvas = document.getElementById('visualizer');
  if (canvas) {
    canvas.width = width;
    canvas.height = height;
    
    // Reinitialize visualizers if available
    if (window.visualizerManager) {
      window.visualizerManager.visualizers.forEach(viz => {
        if (viz.init) {
          viz.init(canvas, canvas.getContext('2d'));
        }
      });
      
      const current = window.visualizerManager.getCurrent();
      if (current && current.resize) {
        current.resize();
      }
    }
    
    console.log(`Canvas resolution changed to ${width}x${height}`);
  }
};

const onVisualizerSettingChange = (key, value) => {
  if (window.visualizerManager && window.visualizerManager.currentVisualizer) {
    window.visualizerManager.currentVisualizer.updateSetting(key, value);
    updateVisualizerSettings();
  }
};

const updateVisualizerSettings = () => {
  if (window.visualizerManager && window.visualizerManager.currentVisualizer) {
    const visualizer = window.visualizerManager.currentVisualizer;
    const customSettings = visualizer.getCustomSettings ? visualizer.getCustomSettings() : [];
    visualizerSettings.value = customSettings;
    visualizerSettingsTitle.value = visualizer.name ? `${visualizer.name} Settings` : 'Visualizer Settings';
    
    // Show visualizer category if there are settings
    if (customSettings.length > 0 && activeCategory.value !== 'visualizer') {
      // Optionally switch to visualizer category
    }
  } else {
    visualizerSettings.value = [];
  }
};

// Watch for visualizer changes
if (typeof window !== 'undefined') {
  watch(() => window.visualizerManager?.currentVisualizer, () => {
    updateVisualizerSettings();
  }, { deep: true });
}

// Keyboard handler
const handleKeydown = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    close();
  }
};

let intervalId = null;

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown);
  updateVisualizerSettings();
  
  // Initialize custom selects after DOM is ready and panel is open
  const initCustomSelects = () => {
    if (!window.createCustomSelect) {
      console.warn('createCustomSelect not available');
      return;
    }
    
    // Initialize all select elements in settings panel
    const selects = document.querySelectorAll('.settings-modal select');
    console.log('Found selects in settings panel:', selects.length);
    selects.forEach(select => {
      if (!select) return;
      if (select.nextElementSibling?.classList.contains('custom-select')) {
        console.log('Select already has custom select:', select);
        return;
      }
      console.log('Initializing custom select for:', select);
      try {
        window.createCustomSelect(select);
      } catch (error) {
        console.error('Error initializing custom select:', error);
      }
    });
  };
  
  // Wait for createCustomSelect to be available
  const waitForCreateCustomSelect = async () => {
    if (window.createCustomSelect) {
      await nextTick();
      initCustomSelects();
    } else {
      setTimeout(waitForCreateCustomSelect, 100);
    }
  };
  
  // Start checking after a short delay
  setTimeout(() => waitForCreateCustomSelect(), 100);
  
  // Also initialize when panel opens
  watch(isOpen, (open) => {
    if (open) {
      if (window.createCustomSelect) {
        setTimeout(initCustomSelects, 100);
      } else {
        waitForCreateCustomSelect();
      }
    }
  });
  
  // Watch for visualizer changes periodically
  intervalId = setInterval(() => {
    if (isOpen.value) {
      updateVisualizerSettings();
    }
  }, 1000);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped>
/* Styles are in global styles.css */
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-modal.hidden {
  display: none;
}
</style>

