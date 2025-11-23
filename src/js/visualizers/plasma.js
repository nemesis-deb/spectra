import { Visualizer, settings } from './base.js';

// Plasma Visualizer - Flowing plasma effect
export class PlasmaVisualizer extends Visualizer {
    constructor() {
        super('Plasma');
        this.settings = {
            speed: 1.0,
            scale: 1.0,
            colorShift: 0,
            audioReactivity: 1.0,
            complexity: 1.0,
            brightness: 1.0,
            waveType: 0, // 0=sine, 1=circular, 2=diamond
            pulseIntensity: 1.0,
            colorCycle: true,
            bassBoost: 1.0
        };
        this.time = 0;
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
        this.time += 0.01 * this.settings.speed * settings.sensitivity;
    }

    draw() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;

        // Calculate frequency zones for better reactivity
        let bass = 0, mid = 0, high = 0;
        for (let i = 0; i < 32; i++) bass += this.frequencyData[i];
        for (let i = 32; i < 128; i++) mid += this.frequencyData[i];
        for (let i = 128; i < this.frequencyData.length; i++) high += this.frequencyData[i];
        
        bass = bass / 32 / 255;
        mid = mid / 96 / 255;
        high = high / (this.frequencyData.length - 128) / 255;

        const avgFreq = (bass + mid + high) / 3;

        // Generate plasma effect
        for (let y = 0; y < height; y += 2) {
            for (let x = 0; x < width; x += 2) {
                // Get local frequency for this position
                const posFreqIndex = Math.floor(((x / width) * 0.5 + (y / height) * 0.5) * this.frequencyData.length);
                const localIntensity = this.frequencyData[posFreqIndex] / 255;

                // Plasma algorithm with enhanced audio reactivity
                const audioWarp = localIntensity * this.settings.audioReactivity * 5;
                const complexityFactor = this.settings.complexity;
                const bassWarp = bass * 3 * this.settings.bassBoost;
                const pulse = Math.sin(this.time * 2) * mid * this.settings.pulseIntensity;
                
                let value;
                if (this.settings.waveType === 1) {
                    // Circular waves
                    const dist = Math.sqrt((x - width/2) * (x - width/2) + (y - height/2) * (y - height/2));
                    value = Math.sin(dist / (16 * this.settings.scale) + this.time + audioWarp) +
                           Math.sin(x / (16 * this.settings.scale) + this.time + bassWarp) +
                           Math.sin(y / (16 * this.settings.scale) - this.time + bassWarp) +
                           Math.cos(dist / (24 * this.settings.scale) - this.time * 0.7) * complexityFactor +
                           pulse;
                } else if (this.settings.waveType === 2) {
                    // Diamond pattern
                    const diamond = Math.abs(x - width/2) + Math.abs(y - height/2);
                    value = Math.sin(diamond / (16 * this.settings.scale) + this.time + audioWarp) +
                           Math.sin(x / (12 * this.settings.scale) + this.time + bassWarp) +
                           Math.sin(y / (12 * this.settings.scale) - this.time + bassWarp) +
                           Math.sin((x + y) / (20 * this.settings.scale) + this.time * 0.8) * complexityFactor +
                           pulse;
                } else {
                    // Classic sine waves
                    value = Math.sin(x / (16 * this.settings.scale) + this.time + audioWarp) +
                           Math.sin(y / (8 * this.settings.scale) - this.time + bassWarp) +
                           Math.sin((x + y) / (16 * this.settings.scale) + this.time) +
                           Math.sin(Math.sqrt(x * x + y * y) / (8 * this.settings.scale) + this.time) +
                           Math.sin(x / (32 * this.settings.scale) + y / (32 * this.settings.scale) + this.time * 0.5) * complexityFactor +
                           pulse;
                }

                // Map to color with enhanced audio reactivity
                const normalized = (value + 5) / 10;
                const cycleOffset = this.settings.colorCycle ? this.time * 20 : 0;
                const hue = (normalized * 360 + this.settings.colorShift + cycleOffset + avgFreq * 180 + mid * 120) % 360;
                const sat = 60 + avgFreq * 40;
                const light = (30 + normalized * 50 + high * 20) * this.settings.brightness;

                const rgb = this.hslToRgb(hue, sat, light);
                
                const index = (y * width + x) * 4;
                data[index] = rgb.r;
                data[index + 1] = rgb.g;
                data[index + 2] = rgb.b;
                data[index + 3] = 255;

                // Fill 2x2 block for performance
                if (x + 1 < width) {
                    const index2 = (y * width + x + 1) * 4;
                    data[index2] = rgb.r;
                    data[index2 + 1] = rgb.g;
                    data[index2 + 2] = rgb.b;
                    data[index2 + 3] = 255;
                }
                if (y + 1 < height) {
                    const index3 = ((y + 1) * width + x) * 4;
                    data[index3] = rgb.r;
                    data[index3 + 1] = rgb.g;
                    data[index3 + 2] = rgb.b;
                    data[index3 + 3] = 255;
                    
                    if (x + 1 < width) {
                        const index4 = ((y + 1) * width + x + 1) * 4;
                        data[index4] = rgb.r;
                        data[index4 + 1] = rgb.g;
                        data[index4 + 2] = rgb.b;
                        data[index4 + 3] = 255;
                    }
                }
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return {
            r: Math.round(255 * f(0)),
            g: Math.round(255 * f(8)),
            b: Math.round(255 * f(4))
        };
    }

    getCustomSettings() {
        return [
            {
                key: 'speed',
                label: 'Speed',
                type: 'range',
                min: 0.1,
                max: 3,
                step: 0.1,
                value: this.settings.speed
            },
            {
                key: 'scale',
                label: 'Scale',
                type: 'range',
                min: 0.5,
                max: 3,
                step: 0.1,
                value: this.settings.scale
            },
            {
                key: 'colorShift',
                label: 'Color Shift',
                type: 'range',
                min: 0,
                max: 360,
                step: 10,
                value: this.settings.colorShift
            },
            {
                key: 'audioReactivity',
                label: 'Audio Reactivity',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.audioReactivity
            },
            {
                key: 'complexity',
                label: 'Complexity',
                type: 'range',
                min: 0,
                max: 2,
                step: 0.1,
                value: this.settings.complexity
            },
            {
                key: 'brightness',
                label: 'Brightness',
                type: 'range',
                min: 0.5,
                max: 2,
                step: 0.1,
                value: this.settings.brightness
            },
            {
                key: 'waveType',
                label: 'Wave Type',
                type: 'range',
                min: 0,
                max: 2,
                step: 1,
                value: this.settings.waveType
            },
            {
                key: 'pulseIntensity',
                label: 'Pulse Intensity',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.pulseIntensity
            },
            {
                key: 'colorCycle',
                label: 'Color Cycle',
                type: 'checkbox',
                value: this.settings.colorCycle
            },
            {
                key: 'bassBoost',
                label: 'Bass Boost',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.bassBoost
            }
        ];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
    }
}
