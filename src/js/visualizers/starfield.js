import { Visualizer, settings } from './base.js';

// Starfield Visualizer - Flying through space
export class StarfieldVisualizer extends Visualizer {
    constructor() {
        super('Starfield');
        this.settings = {
            starCount: 200,
            speed: 1.0,
            haloFreqStart: 25,  // % of frequency range (mids/vocals)
            haloFreqEnd: 75,    // % of frequency range
            haloIntensity: 1.0  // Multiplier for halo brightness
        };
        this.stars = [];
        this.initStars();
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < this.settings.starCount; i++) {
            this.stars.push({
                x: Math.random() * 2 - 1,
                y: Math.random() * 2 - 1,
                z: Math.random()
            });
        }
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
    }

    draw() {
        // Fade trail effect
        this.ctx.fillStyle = settings.bgColor + '20';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Calculate bass, mid, and high frequencies separately
        let bass = 0, mid = 0, high = 0;
        for (let i = 0; i < 32; i++) bass += this.frequencyData[i];
        for (let i = 32; i < 128; i++) mid += this.frequencyData[i];
        for (let i = 128; i < this.frequencyData.length; i++) high += this.frequencyData[i];
        
        bass = bass / 32 / 255;
        mid = mid / 96 / 255;
        high = high / (this.frequencyData.length - 128) / 255;

        // Bass controls speed, mids control size, highs control brightness
        const speedMultiplier = 1 + bass * 4;
        const sizeMultiplier = 1 + mid * 2;
        const brightnessBoost = high * 0.5;

        // Camera shake on heavy bass
        const shakeX = bass > 0.7 ? (Math.random() - 0.5) * 10 * bass : 0;
        const shakeY = bass > 0.7 ? (Math.random() - 0.5) * 10 * bass : 0;

        this.stars.forEach((star, i) => {
            // Move star forward - bass makes it faster
            star.z -= 0.01 * this.settings.speed * speedMultiplier * settings.sensitivity;
            
            if (star.z <= 0) {
                star.x = Math.random() * 2 - 1;
                star.y = Math.random() * 2 - 1;
                star.z = 1;
            }

            // Project 3D to 2D with camera shake
            const scale = 1 / star.z;
            const x = centerX + star.x * centerX * scale + shakeX;
            const y = centerY + star.y * centerY * scale + shakeY;
            
            // Size reacts to mids and distance
            const baseSize = (1 - star.z) * 3;
            const freqIndex = Math.floor((i / this.stars.length) * this.frequencyData.length);
            const intensity = this.frequencyData[freqIndex] / 255;
            const size = baseSize * sizeMultiplier * (1 + intensity * settings.sensitivity);

            // Alpha reacts to highs and intensity
            const alpha = (1 - star.z) * (0.4 + intensity * 0.6 + brightnessBoost);

            // Color shifts based on frequency range
            let color = settings.primaryColor;
            if (intensity > 0.7) {
                // Bright stars for high intensity
                this.ctx.shadowBlur = 10 * intensity;
                this.ctx.shadowColor = settings.primaryColor;
            } else {
                this.ctx.shadowBlur = 0;
            }

            this.ctx.fillStyle = this.hexToRgba(color, alpha);
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw trail - longer trails on bass hits
            const trailLength = 0.05 + bass * 0.15;
            const prevZ = star.z + trailLength;
            if (prevZ < 1) {
                const prevScale = 1 / prevZ;
                const prevX = centerX + star.x * centerX * prevScale + shakeX;
                const prevY = centerY + star.y * centerY * prevScale + shakeY;

                this.ctx.shadowBlur = 0;
                this.ctx.strokeStyle = this.hexToRgba(color, alpha * 0.6);
                this.ctx.lineWidth = size * 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(prevX, prevY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
        });

        this.ctx.shadowBlur = 0;

        // Center halo reactive to custom frequency range
        const startIdx = Math.floor((this.settings.haloFreqStart / 100) * this.frequencyData.length);
        const endIdx = Math.floor((this.settings.haloFreqEnd / 100) * this.frequencyData.length);
        
        let haloFreqSum = 0;
        for (let i = startIdx; i < endIdx; i++) {
            haloFreqSum += this.frequencyData[i];
        }
        const haloFreqAvg = haloFreqSum / (endIdx - startIdx) / 255;
        
        const haloIntensity = Math.pow(haloFreqAvg, 1.5) * this.settings.haloIntensity; // Non-linear response for more dramatic effect
        
        if (haloIntensity > 0.15) {
            // Inner glow - bright core
            const innerRadius = 20 + haloIntensity * 40;
            const outerRadius = 60 + haloIntensity * 120;
            
            const haloGradient = this.ctx.createRadialGradient(
                centerX + shakeX, centerY + shakeY, 0,
                centerX + shakeX, centerY + shakeY, outerRadius
            );
            
            // Bright center that pulses with vocals
            haloGradient.addColorStop(0, this.hexToRgba(settings.primaryColor, haloIntensity * 0.8));
            haloGradient.addColorStop(0.3, this.hexToRgba(settings.primaryColor, haloIntensity * 0.5));
            haloGradient.addColorStop(0.6, this.hexToRgba(settings.primaryColor, haloIntensity * 0.2));
            haloGradient.addColorStop(1, this.hexToRgba(settings.primaryColor, 0));
            
            this.ctx.fillStyle = haloGradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX + shakeX, centerY + shakeY, outerRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add extra glow ring on strong vocals
            if (haloIntensity > 0.5) {
                this.ctx.strokeStyle = this.hexToRgba(settings.primaryColor, (haloIntensity - 0.5) * 0.6);
                this.ctx.lineWidth = 2 + haloIntensity * 3;
                this.ctx.shadowBlur = 15 * haloIntensity;
                this.ctx.shadowColor = settings.primaryColor;
                this.ctx.beginPath();
                this.ctx.arc(centerX + shakeX, centerY + shakeY, innerRadius + haloIntensity * 20, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
        }

        // Add radial burst effect on heavy bass
        if (bass > 0.8) {
            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, Math.min(centerX, centerY)
            );
            gradient.addColorStop(0, this.hexToRgba(settings.primaryColor, 0));
            gradient.addColorStop(0.5, this.hexToRgba(settings.primaryColor, (bass - 0.8) * 0.3));
            gradient.addColorStop(1, this.hexToRgba(settings.primaryColor, 0));
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    getCustomSettings() {
        return [
            {
                key: 'starCount',
                label: 'Star Count',
                type: 'range',
                min: 50,
                max: 500,
                step: 50,
                value: this.settings.starCount
            },
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
                key: 'haloFreqStart',
                label: 'Halo Freq Start %',
                type: 'range',
                min: 0,
                max: 100,
                step: 5,
                value: this.settings.haloFreqStart
            },
            {
                key: 'haloFreqEnd',
                label: 'Halo Freq End %',
                type: 'range',
                min: 0,
                max: 100,
                step: 5,
                value: this.settings.haloFreqEnd
            },
            {
                key: 'haloIntensity',
                label: 'Halo Intensity',
                type: 'range',
                min: 0,
                max: 2,
                step: 0.1,
                value: this.settings.haloIntensity
            }
        ];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        if (key === 'starCount') {
            this.initStars();
        }
    }
}
