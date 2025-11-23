import { Visualizer, settings } from './base.js';

// Nebula Visualizer - Space nebula with particles
export class NebulaVisualizer extends Visualizer {
    constructor() {
        super('Nebula');
        this.settings = {
            particleCount: 200,
            speed: 1.0,
            spread: 1.0,
            glowSize: 1.0,
            colorShift: 0,
            attraction: 1.0,
            explosionThreshold: 150,
            explosionForce: 5.0,
            orbitalStrength: 1.0,
            particleSize: 1.0,
            trailEffect: true,
            damping: 0.99,
            bassAttraction: 1.0,
            midOrbital: 1.0,
            highRepulsion: 0,
            colorMode: 0, // 0=blue-purple, 1=rainbow, 2=audio-reactive
            nebulaGlowIntensity: 1.0,
            particleGlowIntensity: 1.0,
            wrapEdges: true,
            explosionCooldownTime: 120,
            clusterThreshold: 0.7,
            velocityLimit: 10,
            colorCycle: false,
            colorCycleSpeed: 1.0,
            particleSizeVariation: 1.0,
            turbulence: 0
        };
        this.particles = [];
        this.initialized = false;
        this.explosionCooldown = 0;
        this.time = 0;
    }

    initParticles() {
        if (!this.canvas) return;
        this.particles = [];
        for (let i = 0; i < this.settings.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
        this.initialized = true;
    }

    createParticle() {
        if (!this.canvas) return { x: 0, y: 0, vx: 0, vy: 0, size: 1, hue: 200, life: 0 };
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: (Math.random() * 3 + 1) * this.settings.particleSizeVariation,
            hue: this.settings.colorMode === 1 ? Math.random() * 360 : Math.random() * 60 + 180,
            life: Math.random(),
            baseHue: Math.random() * 360
        };
    }

    update(timeDomainData, frequencyData) {
        this.frequencyData = frequencyData;
        this.time += 0.01 * this.settings.colorCycleSpeed;
    }

    draw() {
        // Initialize particles on first draw
        if (!this.initialized) {
            this.initParticles();
            if (!this.initialized) return; // Still not ready
        }

        // Fade trail
        const fadeAmount = this.settings.trailEffect ? 0.02 : 0.1;
        this.ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmount})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate frequency zones
        let bass = 0, mid = 0, high = 0;
        for (let i = 0; i < 32; i++) bass += this.frequencyData[i];
        for (let i = 32; i < 128; i++) mid += this.frequencyData[i];
        for (let i = 128; i < this.frequencyData.length; i++) high += this.frequencyData[i];
        
        bass = bass / 32 / 255;
        mid = mid / 96 / 255;
        high = high / (this.frequencyData.length - 128) / 255;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Check if particles are clustered at center
        let clusteredCount = 0;
        this.particles.forEach(particle => {
            const dx = centerX - particle.x;
            const dy = centerY - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.settings.explosionThreshold) {
                clusteredCount++;
            }
        });

        // Trigger explosion if most particles are clustered
        const clusterRatio = clusteredCount / this.particles.length;
        if (clusterRatio > this.settings.clusterThreshold && this.explosionCooldown <= 0) {
            this.triggerExplosion(centerX, centerY);
            this.explosionCooldown = this.settings.explosionCooldownTime;
        }
        
        if (this.explosionCooldown > 0) {
            this.explosionCooldown--;
        }

        // Draw nebula glow
        if (this.settings.nebulaGlowIntensity > 0) {
            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, Math.min(centerX, centerY) * 0.8
            );
            const glowIntensity = this.settings.nebulaGlowIntensity;
            gradient.addColorStop(0, `rgba(138, 43, 226, ${bass * 0.3 * glowIntensity})`);
            gradient.addColorStop(0.5, `rgba(75, 0, 130, ${mid * 0.2 * glowIntensity})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Update and draw particles
        this.particles.forEach((particle, i) => {
            // Get frequency for this particle
            const freqIndex = Math.floor((i / this.particles.length) * this.frequencyData.length);
            const intensity = this.frequencyData[freqIndex] / 255;

            // Move particle
            particle.x += particle.vx * this.settings.speed * settings.sensitivity;
            particle.y += particle.vy * this.settings.speed * settings.sensitivity;

            // Attract to center with audio
            const dx = centerX - particle.x;
            const dy = centerY - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const attractionForce = (bass * 0.5 * this.settings.bassAttraction + mid * 0.3) * this.settings.spread * this.settings.attraction;
            
            particle.vx += (dx / dist) * attractionForce * 0.01;
            particle.vy += (dy / dist) * attractionForce * 0.01;

            // Add orbital motion based on mids
            const orbitalForce = mid * 0.5 * this.settings.orbitalStrength * this.settings.midOrbital;
            particle.vx += -dy / dist * orbitalForce * 0.02;
            particle.vy += dx / dist * orbitalForce * 0.02;

            // Add repulsion based on highs
            if (this.settings.highRepulsion > 0) {
                const repulsionForce = high * this.settings.highRepulsion;
                particle.vx -= (dx / dist) * repulsionForce * 0.01;
                particle.vy -= (dy / dist) * repulsionForce * 0.01;
            }

            // Add turbulence
            if (this.settings.turbulence > 0) {
                particle.vx += (Math.random() - 0.5) * this.settings.turbulence * 0.1;
                particle.vy += (Math.random() - 0.5) * this.settings.turbulence * 0.1;
            }

            // Damping
            particle.vx *= this.settings.damping;
            particle.vy *= this.settings.damping;

            // Velocity limit
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (speed > this.settings.velocityLimit) {
                particle.vx = (particle.vx / speed) * this.settings.velocityLimit;
                particle.vy = (particle.vy / speed) * this.settings.velocityLimit;
            }

            // Wrap around or bounce
            if (this.settings.wrapEdges) {
                if (particle.x < 0) particle.x = this.canvas.width;
                if (particle.x > this.canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = this.canvas.height;
                if (particle.y > this.canvas.height) particle.y = 0;
            } else {
                // Bounce off edges
                if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -0.8;
                if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -0.8;
                particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
                particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            }

            // Draw particle with glow
            const size = particle.size * this.settings.particleSize * (1 + intensity * 2);
            const alpha = 0.3 + intensity * 0.7;

            // Apply color based on mode
            let hue;
            if (this.settings.colorMode === 1) {
                // Rainbow mode
                hue = (particle.baseHue + this.settings.colorShift) % 360;
            } else if (this.settings.colorMode === 2) {
                // Audio-reactive
                hue = (120 + intensity * 240 + this.settings.colorShift) % 360;
            } else {
                // Blue-purple default
                hue = (particle.hue + this.settings.colorShift + intensity * 60) % 360;
            }
            
            // Color cycle
            if (this.settings.colorCycle) {
                hue = (hue + this.time * 50) % 360;
            }

            // Glow
            if (this.settings.particleGlowIntensity > 0) {
                const glowSize = size * 3 * this.settings.glowSize;
                const glowGradient = this.ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, glowSize
                );
                const glowAlpha = alpha * this.settings.particleGlowIntensity;
                glowGradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${glowAlpha})`);
                glowGradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, ${glowAlpha * 0.5})`);
                glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                this.ctx.fillStyle = glowGradient;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Core with extra brightness on high intensity
            const coreAlpha = alpha * (1 + intensity * 0.5);
            this.ctx.fillStyle = `hsla(${hue}, 100%, 90%, ${coreAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    getCustomSettings() {
        return [
            {
                key: 'particleCount',
                label: 'Particle Count',
                type: 'range',
                min: 50,
                max: 500,
                step: 50,
                value: this.settings.particleCount
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
                key: 'spread',
                label: 'Spread',
                type: 'range',
                min: 0.1,
                max: 3,
                step: 0.1,
                value: this.settings.spread
            },
            {
                key: 'glowSize',
                label: 'Glow Size',
                type: 'range',
                min: 0.5,
                max: 3,
                step: 0.1,
                value: this.settings.glowSize
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
                key: 'attraction',
                label: 'Attraction',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.attraction
            },
            {
                key: 'explosionThreshold',
                label: 'Explosion Threshold',
                type: 'range',
                min: 50,
                max: 300,
                step: 10,
                value: this.settings.explosionThreshold
            },
            {
                key: 'explosionForce',
                label: 'Explosion Force',
                type: 'range',
                min: 1,
                max: 10,
                step: 0.5,
                value: this.settings.explosionForce
            },
            {
                key: 'orbitalStrength',
                label: 'Orbital Strength',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.orbitalStrength
            },
            {
                key: 'particleSize',
                label: 'Particle Size',
                type: 'range',
                min: 0.5,
                max: 3,
                step: 0.1,
                value: this.settings.particleSize
            },
            {
                key: 'trailEffect',
                label: 'Trail Effect',
                type: 'checkbox',
                value: this.settings.trailEffect
            },
            {
                key: 'damping',
                label: 'Damping',
                type: 'range',
                min: 0.9,
                max: 0.999,
                step: 0.001,
                value: this.settings.damping
            },
            {
                key: 'bassAttraction',
                label: 'Bass Attraction',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.bassAttraction
            },
            {
                key: 'midOrbital',
                label: 'Mid Orbital',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.midOrbital
            },
            {
                key: 'highRepulsion',
                label: 'High Repulsion',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.highRepulsion
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
                key: 'nebulaGlowIntensity',
                label: 'Nebula Glow',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.nebulaGlowIntensity
            },
            {
                key: 'particleGlowIntensity',
                label: 'Particle Glow',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.particleGlowIntensity
            },
            {
                key: 'wrapEdges',
                label: 'Wrap Edges',
                type: 'checkbox',
                value: this.settings.wrapEdges
            },
            {
                key: 'explosionCooldownTime',
                label: 'Explosion Cooldown',
                type: 'range',
                min: 30,
                max: 300,
                step: 10,
                value: this.settings.explosionCooldownTime
            },
            {
                key: 'clusterThreshold',
                label: 'Cluster Threshold',
                type: 'range',
                min: 0.3,
                max: 0.9,
                step: 0.05,
                value: this.settings.clusterThreshold
            },
            {
                key: 'velocityLimit',
                label: 'Velocity Limit',
                type: 'range',
                min: 5,
                max: 20,
                step: 1,
                value: this.settings.velocityLimit
            },
            {
                key: 'colorCycle',
                label: 'Color Cycle',
                type: 'checkbox',
                value: this.settings.colorCycle
            },
            {
                key: 'colorCycleSpeed',
                label: 'Color Cycle Speed',
                type: 'range',
                min: 0.1,
                max: 3,
                step: 0.1,
                value: this.settings.colorCycleSpeed
            },
            {
                key: 'particleSizeVariation',
                label: 'Size Variation',
                type: 'range',
                min: 0.5,
                max: 2,
                step: 0.1,
                value: this.settings.particleSizeVariation
            },
            {
                key: 'turbulence',
                label: 'Turbulence',
                type: 'range',
                min: 0,
                max: 3,
                step: 0.1,
                value: this.settings.turbulence
            }
        ];
    }

    triggerExplosion(centerX, centerY) {
        // Explode all particles outward from center
        this.particles.forEach(particle => {
            const dx = particle.x - centerX;
            const dy = particle.y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Apply explosive force outward
            const force = this.settings.explosionForce;
            particle.vx = (dx / dist) * force * (0.5 + Math.random() * 0.5);
            particle.vy = (dy / dist) * force * (0.5 + Math.random() * 0.5);
            
            // Add some randomness for visual variety
            particle.vx += (Math.random() - 0.5) * 2;
            particle.vy += (Math.random() - 0.5) * 2;
        });
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        if (key === 'particleCount') {
            this.initParticles();
        }
    }
}
