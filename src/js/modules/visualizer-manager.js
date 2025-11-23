// Visualizer Manager
class VisualizerManager {
    constructor() {
        this.visualizers = new Map();
        this.currentVisualizer = null;
    }

    register(visualizer) {
        this.visualizers.set(visualizer.name, visualizer);
        console.log(`Registered visualizer: ${visualizer.name}`);
    }

    init(canvas, ctx) {
        this.visualizers.forEach(viz => viz.init(canvas, ctx));
    }

    setActive(name) {
        const visualizer = this.visualizers.get(name);
        if (visualizer) {
            this.currentVisualizer = visualizer;
            console.log(`Active visualizer: ${name}`);
            return true;
        }
        return false;
    }

    update(timeDomainData, frequencyData) {
        if (this.currentVisualizer) {
            this.currentVisualizer.update(timeDomainData, frequencyData);
        }
    }

    draw() {
        if (this.currentVisualizer) {
            this.currentVisualizer.draw();
        }
    }

    getAll() {
        return Array.from(this.visualizers.values());
    }

    getCurrent() {
        return this.currentVisualizer;
    }

    getCurrentName() {
        return this.currentVisualizer ? this.currentVisualizer.name : null;
    }

    get(name) {
        return this.visualizers.get(name);
    }
}

module.exports = VisualizerManager;
