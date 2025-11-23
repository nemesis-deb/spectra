import { Visualizer, settings } from './base.js';

// Matrix Visualizer - Matrix-style falling code
export class MatrixVisualizer extends Visualizer {
    constructor() {
        super('Matrix');
        this.settings = {
            speed: 1.0,
            density: 0.5,
            fontSize: 14,
            trailLength: 20,
            glowIntensity: 1.0,
            colorMode: 0, // 0=green, 1=rainbow, 2=audio-reactive
            bassReactivity: 1.5,
            randomReset: true,
            fadeSpeed: 0.05
        };
        this.columns = [];
        this.fontSize = this.settings.fontSize;
        this.chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.initialized = false;
        this.time = 0;
    }

    initColumns() {
        if (!this.canvas) return;
        const numColumns = Math.floor(this.canvas.width / this.fontSize);
        this.columns = [];
        for (let i = 0; i < numColumns; i++) {
            this.columns.push({
                y: Math.random() * this.canvas.height,
                speed: 0.5 + Math.random() * 1.5,
                chars: []
            });
        }
        this.initialized = true;
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
        this.time += 0.01;
    }

    draw() {
        // Initialize columns on first draw
        if (!this.initialized) {
            this.initColumns();
            if (!this.initialized) return; // Still not ready
        }

        // Fade effect
        this.ctx.fillStyle = `rgba(0, 0, 0, ${this.settings.fadeSpeed})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = `${this.fontSize}px monospace`;

        // Calculate audio reactivity
        let bass = 0;
        for (let i = 0; i < 32; i++) {
            bass += this.frequencyData[i];
        }
        bass = bass / 32 / 255;

        const speedMultiplier = 1 + bass * this.settings.bassReactivity;

        this.columns.forEach((column, i) => {
            // Get frequency for this column
            const freqIndex = Math.floor((i / this.columns.length) * this.frequencyData.length);
            const intensity = this.frequencyData[freqIndex] / 255;

            // Random character
            const char = this.chars[Math.floor(Math.random() * this.chars.length)];
            const x = i * this.fontSize;

            // Determine color based on mode
            let headColor, trailColor;
            if (this.settings.colorMode === 1) {
                // Rainbow mode
                const hue = (i / this.columns.length * 360 + this.time * 50) % 360;
                headColor = `hsl(${hue}, 100%, 70%)`;
                trailColor = `hsl(${hue}, 100%, 50%)`;
            } else if (this.settings.colorMode === 2) {
                // Audio-reactive color
                const hue = 120 + intensity * 240;
                headColor = `hsl(${hue}, 100%, 70%)`;
                trailColor = `hsl(${hue}, 100%, 50%)`;
            } else {
                // Classic green
                headColor = settings.primaryColor;
                trailColor = settings.primaryColor;
            }

            // Bright head with glow
            this.ctx.fillStyle = headColor;
            this.ctx.globalAlpha = 0.8 + intensity * 0.2;
            
            if (this.settings.glowIntensity > 0) {
                this.ctx.shadowBlur = 10 * this.settings.glowIntensity * (1 + intensity);
                this.ctx.shadowColor = headColor;
            }
            
            this.ctx.fillText(char, x, column.y);
            this.ctx.shadowBlur = 0;

            // Trail
            this.ctx.fillStyle = trailColor;
            for (let j = 1; j < this.settings.trailLength; j++) {
                const trailY = column.y - j * this.fontSize;
                if (trailY > 0) {
                    this.ctx.globalAlpha = (1 - j / 20) * 0.5;
                    const trailChar = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.ctx.fillText(trailChar, x, trailY);
                }
            }

            this.ctx.globalAlpha = 1;

            // Move column down
            column.y += column.speed * this.settings.speed * speedMultiplier * settings.sensitivity;

            // Reset if off screen
            if (column.y > this.canvas.height) {
                column.y = 0;
                column.speed = 0.5 + Math.random() * 1.5;
            }

            // Random reset based on density
            if (this.settings.randomReset && Math.random() < 0.001 * this.settings.density) {
                column.y = 0;
            }
        });
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
                key: 'density',
                label: 'Density',
                type: 'range',
                min: 0.1,
                max: 2,
                step: 0.1,
                value: this.settings.density
            },
            {
                key: 'fontSize',
                label: 'Font Size',
                type: 'range',
                min: 10,
                max: 24,
                step: 2,
                value: this.settings.fontSize
            },
            {
                key: 'trailLength',
                label: 'Trail Length',
                type: 'range',
                min: 5,
                max: 40,
                step: 5,
                value: this.settings.trailLength
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
                key: 'bassReactivity',
                label: 'Bass Reactivity',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.bassReactivity
            },
            {
                key: 'randomReset',
                label: 'Random Reset',
                type: 'checkbox',
                value: this.settings.randomReset
            },
            {
                key: 'fadeSpeed',
                label: 'Fade Speed',
                type: 'range',
                min: 0.01,
                max: 0.2,
                step: 0.01,
                value: this.settings.fadeSpeed
            }
        ];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        if (key === 'density' || key === 'fontSize') {
            this.fontSize = this.settings.fontSize;
            this.initColumns();
        }
    }
}
