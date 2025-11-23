// Preset Manager Module - Handles .spk preset files
const { ipcRenderer } = require('electron');

export class PresetManager {
    constructor() {
        this.currentPreset = null;
        this.presetExtension = '.spk';
    }

    // Create preset from current visualizer settings
    createPreset(visualizerName, visualizerSettings, globalSettings) {
        const preset = {
            version: '1.0.0',
            name: visualizerName,
            timestamp: new Date().toISOString(),
            visualizer: {
                type: visualizerName,
                settings: visualizerSettings
            },
            global: {
                primaryColor: globalSettings.primaryColor,
                bgColor: globalSettings.bgColor,
                lineWidth: globalSettings.lineWidth,
                smoothing: globalSettings.smoothing,
                sensitivity: globalSettings.sensitivity,
                mirrorEffect: globalSettings.mirrorEffect,
                beatDetection: globalSettings.beatDetection,
                beatFlashIntensity: globalSettings.beatFlashIntensity,
                beatFlashDuration: globalSettings.beatFlashDuration
            }
        };
        
        return preset;
    }

    // Export preset to .spectra file
    async exportPreset(preset, suggestedName = null) {
        const presetName = suggestedName || `${preset.name}_${Date.now()}`;
        const fileName = presetName.endsWith(this.presetExtension) 
            ? presetName 
            : `${presetName}${this.presetExtension}`;
        
        const presetJSON = JSON.stringify(preset, null, 2);
        
        try {
            const result = await ipcRenderer.invoke('save-preset', {
                fileName: fileName,
                content: presetJSON
            });
            
            if (result.success) {
                console.log('✓ Preset exported:', result.path);
                return { success: true, path: result.path };
            } else {
                console.error('Failed to export preset:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error exporting preset:', error);
            return { success: false, error: error.message };
        }
    }

    // Import preset from .spectra file
    async importPreset() {
        try {
            const result = await ipcRenderer.invoke('load-preset');
            
            if (result.success) {
                const preset = JSON.parse(result.content);
                
                // Validate preset structure
                if (!this.validatePreset(preset)) {
                    return { success: false, error: 'Invalid preset format' };
                }
                
                this.currentPreset = preset;
                console.log('✓ Preset imported:', preset.name);
                return { success: true, preset: preset };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error importing preset:', error);
            return { success: false, error: error.message };
        }
    }

    // Validate preset structure
    validatePreset(preset) {
        if (!preset || typeof preset !== 'object') return false;
        if (!preset.version || !preset.name) return false;
        if (!preset.visualizer || !preset.visualizer.type) return false;
        if (!preset.global) return false;
        return true;
    }

    // Apply preset to current visualizer
    applyPreset(preset, visualizerManager, settingsManager) {
        try {
            // Apply global settings
            if (preset.global) {
                Object.keys(preset.global).forEach(key => {
                    settingsManager.set(key, preset.global[key]);
                });
            }

            // Switch to preset visualizer if different
            const currentVisualizer = visualizerManager.getCurrentVisualizerName();
            if (currentVisualizer !== preset.visualizer.type) {
                visualizerManager.switchVisualizer(preset.visualizer.type);
            }

            // Apply visualizer-specific settings
            if (preset.visualizer.settings) {
                const visualizer = visualizerManager.getCurrentVisualizer();
                Object.keys(preset.visualizer.settings).forEach(key => {
                    if (visualizer.updateSetting) {
                        visualizer.updateSetting(key, preset.visualizer.settings[key]);
                    }
                });
            }

            this.currentPreset = preset;
            console.log('✓ Preset applied:', preset.name);
            return { success: true };
        } catch (error) {
            console.error('Error applying preset:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current preset
    getCurrentPreset() {
        return this.currentPreset;
    }

    // Create preset name suggestion
    generatePresetName(visualizerName) {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        return `${visualizerName}_${dateStr}`;
    }
}
