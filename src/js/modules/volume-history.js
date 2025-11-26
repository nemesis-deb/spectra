// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export class VolumeHistoryVisualizer {
    constructor(canvasId, analyser) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            return;
        }
        console.log('VolumeHistoryVisualizer: Canvas found', this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.analyser = analyser;
        console.log('VolumeHistoryVisualizer: Initial analyser:', this.analyser);

        // Configuration
        this.historyDuration = 1000; // 1 seconds
        this.fps = 60;
        this.maxHistoryLength = (this.historyDuration / 1000) * this.fps;
        this.history = new Array(this.maxHistoryLength).fill(0);

        this.isRunning = false;

        if (this.analyser) {
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        } else {
            this.dataArray = new Uint8Array(0);
        }

        // Bind loop
        this.draw = this.draw.bind(this);
    }

    start() {
        if (this.isRunning) return;
        console.log('VolumeHistoryVisualizer: Starting...');
        this.isRunning = true;
        this.draw();
    }

    stop() {
        this.isRunning = false;
    }

    updateAnalyser(analyser) {
        //console.log('VolumeHistoryVisualizer: Updating analyser', analyser);
        this.analyser = analyser;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    getRMS() {
        if (!this.analyser || !this.dataArray) return 0;
        // Use time domain data for accurate volume measurement (not frequency data)
        this.analyser.getByteTimeDomainData(this.dataArray);
        // Calculate RMS from time domain data
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            // Convert from 0-255 range to -1 to 1 range
            const normalized = (this.dataArray[i] - 128) / 128;
            sum += normalized * normalized;
        }
        return Math.sqrt(sum / this.dataArray.length);
    }

    draw() {
        if (!this.isRunning) return;

        requestAnimationFrame(this.draw);

        // Get current volume
        const rms = this.getRMS();

        // Debug RMS every 60 frames
        //if (this.frameCounter === undefined) this.frameCounter = 0;
        //this.frameCounter++;
        //if (this.frameCounter % 60 === 0) {
        //    console.log('Volume RMS:', rms, 'Canvas:', this.canvas.width, 'x', this.canvas.height);
        //}

        // Add to history
        this.history.push(rms);
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
        }

        // Clear canvas
        const width = this.canvas.width;
        const height = this.canvas.height;
        this.ctx.clearRect(0, 0, width, height);

        // Draw filled area
        this.ctx.beginPath();
        this.ctx.moveTo(0, height); // Start at bottom left

        for (let i = 0; i < this.history.length; i++) {
            const value = this.history[i];
            const x = (i / (this.maxHistoryLength - 1)) * width;

            // Amplify RMS for better visibility (RMS is typically 0.0-0.3 for music)
            // Using a non-linear scale can help small sounds show up
            const amplified = Math.min(Math.sqrt(value) * 1.5, 1.0);

            const y = height - (amplified * height);
            this.ctx.lineTo(x, y);
        }

        this.ctx.lineTo(width, height); // Down to bottom right
        this.ctx.closePath(); // Back to bottom left

        // Fill - use CSS variable for theme color
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#00ff88';
        const rgb = hexToRgb(primaryColor);
        if (rgb) {
            this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
        } else {
            this.ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
        }
        this.ctx.fill();

        // Stroke top line - use CSS variable for theme color
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = primaryColor;
        this.ctx.stroke();
    }
}
