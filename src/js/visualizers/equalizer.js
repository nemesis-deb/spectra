import { Visualizer, settings } from './base.js';

// Equalizer Visualizer - Classic equalizer bars with glow
export class EqualizerVisualizer extends Visualizer {
    constructor() {
        super('Equalizer');
        this.settings = {
            barCount: 32,
            gap: 2,
            peakHold: true,
            reflection: true,
            glowIntensity: 1.0,
            colorMode: 0, // 0=gradient, 1=solid, 2=rainbow
            smoothing: 0.5,
            bassBoost: 1.5
        };
        this.peaks = [];
        this.peakDecay = [];
        this.smoothedValues = [];
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
    }

    draw() {
        // Clear with background
        this.ctx.fillStyle = settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const barCount = this.settings.barCount;
        const barWidth = (this.canvas.width / barCount) - this.settings.gap;
        const heightScale = this.canvas.height * 0.8;

        // Initialize peaks array if needed
        if (this.peaks.length !== barCount) {
            this.peaks = new Array(barCount).fill(0);
            this.peakDecay = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
            // Get frequency data for this bar
            const dataIndex = Math.floor((i / barCount) * this.frequencyData.length);
            let value = this.frequencyData[dataIndex] / 255;
            
            // Apply bass boost to lower frequencies
            if (i < barCount * 0.2) {
                value *= this.settings.bassBoost;
            }
            
            // Smooth the values
            if (!this.smoothedValues[i]) this.smoothedValues[i] = value;
            this.smoothedValues[i] = this.smoothedValues[i] * this.settings.smoothing + value * (1 - this.settings.smoothing);
            value = this.smoothedValues[i];
            
            const barHeight = value * heightScale * settings.sensitivity;

            const x = i * (barWidth + this.settings.gap);
            const y = this.canvas.height - barHeight;

            // Update peak
            if (barHeight > this.peaks[i]) {
                this.peaks[i] = barHeight;
                this.peakDecay[i] = 0;
            } else {
                this.peakDecay[i] += 0.5;
                this.peaks[i] = Math.max(0, this.peaks[i] - this.peakDecay[i]);
            }

            // Determine color based on mode
            let barColor;
            if (this.settings.colorMode === 1) {
                // Solid color
                barColor = settings.primaryColor;
                this.ctx.fillStyle = barColor;
            } else if (this.settings.colorMode === 2) {
                // Rainbow mode
                const hue = (i / barCount * 360) % 360;
                barColor = `hsl(${hue}, 100%, 60%)`;
                this.ctx.fillStyle = barColor;
            } else {
                // Gradient mode (default)
                const gradient = this.ctx.createLinearGradient(x, y, x, this.canvas.height);
                
                if (value > 0.8) {
                    gradient.addColorStop(0, '#ff0066');
                    gradient.addColorStop(0.5, '#ff6600');
                    gradient.addColorStop(1, settings.primaryColor);
                } else if (value > 0.5) {
                    gradient.addColorStop(0, '#ffaa00');
                    gradient.addColorStop(1, settings.primaryColor);
                } else {
                    gradient.addColorStop(0, settings.primaryColor);
                    gradient.addColorStop(1, settings.primaryColor);
                }
                
                barColor = settings.primaryColor;
                this.ctx.fillStyle = gradient;
            }

            this.ctx.fillRect(x, y, barWidth, barHeight);

            // Glow effect
            if (value > 0.3 && this.settings.glowIntensity > 0) {
                this.ctx.shadowBlur = 15 * value * this.settings.glowIntensity;
                this.ctx.shadowColor = barColor;
                this.ctx.fillRect(x, y, barWidth, barHeight);
                this.ctx.shadowBlur = 0;
            }

            // Draw peak indicator
            if (this.settings.peakHold && this.peaks[i] > 5) {
                const peakY = this.canvas.height - this.peaks[i];
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(x, peakY - 2, barWidth, 3);
                
                // Peak glow
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#ffffff';
                this.ctx.fillRect(x, peakY - 2, barWidth, 3);
                this.ctx.shadowBlur = 0;
            }

            // Draw reflection
            if (this.settings.reflection) {
                this.ctx.globalAlpha = 0.3;
                const reflectionGradient = this.ctx.createLinearGradient(
                    x, this.canvas.height,
                    x, this.canvas.height + barHeight * 0.5
                );
                reflectionGradient.addColorStop(0, settings.primaryColor);
                reflectionGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                this.ctx.fillStyle = reflectionGradient;
                this.ctx.fillRect(x, this.canvas.height, barWidth, barHeight * 0.3);
                this.ctx.globalAlpha = 1;
            }
        }

        // Draw center line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.stroke();
    }

    getCustomSettings() {
        return [
            {
                key: 'barCount',
                label: 'Bar Count',
                type: 'range',
                min: 16,
                max: 128,
                step: 8,
                value: this.settings.barCount
            },
            {
                key: 'gap',
                label: 'Gap',
                type: 'range',
                min: 0,
                max: 10,
                step: 1,
                value: this.settings.gap
            },
            {
                key: 'peakHold',
                label: 'Peak Hold',
                type: 'checkbox',
                value: this.settings.peakHold
            },
            {
                key: 'reflection',
                label: 'Reflection',
                type: 'checkbox',
                value: this.settings.reflection
            },
            {
                key: 'glowIntensity',
                label: 'Glow Intensity',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.glowIntensity
            },
            {
                key: 'colorMode',
                label: 'Color Mode',
                type: 'range',
                min: 0,
                max: 2,
                step: 1,
                value: this.settings.colorMode
            },
            {
                key: 'smoothing',
                label: 'Smoothing',
                type: 'range',
                min: 0,
                max: 0.9,
                step: 0.1,
                value: this.settings.smoothing
            },
            {
                key: 'bassBoost',
                label: 'Bass Boost',
                type: 'range',
                min: 1,
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
