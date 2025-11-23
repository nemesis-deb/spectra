// Settings Management
class Settings {
    constructor() {
        this.data = {
            primaryColor: '#00ff88',
            lineWidth: 2,
            smoothing: 0.8,
            sensitivity: 1.0,
            bgColor: '#000000',
            mirrorEffect: false,
            beatDetection: true,
            beatFlashIntensity: 0.3,
            beatFlashDuration: 0.92,
            gpuAcceleration: true,
            useCamelotNotation: true,
            openDevToolsOnStartup: false
        };
    }

    load() {
        const saved = localStorage.getItem('audioVisualizerSettings');
        if (saved) {
            const loaded = JSON.parse(saved);
            Object.assign(this.data, loaded);
        }
        return this.data;
    }

    save() {
        localStorage.setItem('audioVisualizerSettings', JSON.stringify(this.data));
        console.log('Settings saved:', this.data);
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
        this.save();
    }

    getAll() {
        return this.data;
    }
}

module.exports = Settings;
