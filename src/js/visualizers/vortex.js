import { Visualizer, settings } from './base.js';

// Vortex Visualizer - Spinning vortex effect
export class VortexVisualizer extends Visualizer {
    constructor() {
        super('Vortex');
        this.settings = {
            rings: 20,
            speed: 1.0,
            twist: 1.0,
            bassBoost: 2.0,
            waveIntensity: 1.0,
            glowIntensity: 1.0,
            colorShift: 0
        };
        this.rotation = 0;
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
    }

    draw() {
        // Clear with fade
        this.ctx.fillStyle = settings.bgColor + '20';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.9;

        // Calculate audio zones
        let bass = 0, mid = 0, high = 0;
        for (let i = 0; i < 32; i++) bass += this.frequencyData[i];
        for (let i = 32; i < 128; i++) mid += this.frequencyData[i];
        for (let i = 128; i < this.frequencyData.length; i++) high += this.frequencyData[i];
        
        bass = bass / 32 / 255;
        mid = mid / 96 / 255;
        high = high / (this.frequencyData.length - 128) / 255;

        // Update rotation
        this.rotation += 0.02 * this.settings.speed * (1 + bass * this.settings.bassBoost) * settings.sensitivity;

        // Draw vortex rings
        for (let ring = 0; ring < this.settings.rings; ring++) {
            const ringProgress = ring / this.settings.rings;
            const radius = maxRadius * ringProgress;
            
            // Get frequency for this ring
            const freqIndex = Math.floor(ringProgress * this.frequencyData.length);
            const intensity = this.frequencyData[freqIndex] / 255;

            // Calculate twist
            const twist = this.rotation + ringProgress * Math.PI * 2 * this.settings.twist;

            // Number of segments in this ring
            const segments = 32 + Math.floor(ring * 2);
            const angleStep = (Math.PI * 2) / segments;

            this.ctx.beginPath();
            
            for (let i = 0; i <= segments; i++) {
                const angle = i * angleStep + twist;
                
                // Add wave distortion based on audio
                const distortion = intensity * 20 * this.settings.waveIntensity * Math.sin(angle * 3 + this.rotation);
                const r = radius + distortion;

                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;

                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }

            this.ctx.closePath();

            // Color based on position and intensity
            const hue = (ringProgress * 120 + this.rotation * 50 + this.settings.colorShift) % 360;
            const alpha = 0.3 + intensity * 0.7;
            
            this.ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
            this.ctx.lineWidth = 2 + intensity * 3;
            
            // Glow effect
            if (intensity > 0.5 && this.settings.glowIntensity > 0) {
                this.ctx.shadowBlur = 15 * intensity * this.settings.glowIntensity;
                this.ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            }
            
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // Fill with gradient
            if (ring % 3 === 0) {
                const gradient = this.ctx.createRadialGradient(
                    centerX, centerY, radius * 0.5,
                    centerX, centerY, radius
                );
                gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
                gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${intensity * 0.2})`);
                
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        }

        // Draw center glow
        const centerGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, maxRadius * 0.3
        );
        centerGradient.addColorStop(0, `rgba(255, 255, 255, ${bass * 0.5})`);
        centerGradient.addColorStop(0.5, `${settings.primaryColor}${Math.floor(mid * 128).toString(16).padStart(2, '0')}`);
        centerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = centerGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, maxRadius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw particles spiraling out
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const progress = (i / particleCount + this.rotation * 0.1) % 1;
            const angle = progress * Math.PI * 4 + this.rotation;
            const r = progress * maxRadius;
            
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            
            const freqIndex = Math.floor(progress * this.frequencyData.length);
            const intensity = this.frequencyData[freqIndex] / 255;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2 + intensity * 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    getCustomSettings() {
        return [
            {
                key: 'rings',
                label: 'Ring Count',
                type: 'range',
                min: 5,
                max: 40,
                step: 5,
                value: this.settings.rings
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
                key: 'twist',
                label: 'Twist',
                type: 'range',
                min: 0,
                max: 5,
                step: 0.5,
                value: this.settings.twist
            },
            {
                key: 'bassBoost',
                label: 'Bass Reactivity',
                type: 'range',
                min: 0,
                max: 5,
                step: 0.5,
                value: this.settings.bassBoost
            },
            {
                key: 'waveIntensity',
                label: 'Wave Intensity',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.waveIntensity
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
                key: 'colorShift',
                label: 'Color Shift',
                type: 'range',
                min: 0,
                max: 360,
                step: 10,
                value: this.settings.colorShift
            }
        ];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
    }
}
