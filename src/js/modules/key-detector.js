// Key Detector Module - Handles musical key detection
// Uses chromagram analysis to detect the musical key of audio

export class KeyDetector {
    constructor() {
        this.detectedKey = '';
        this.detectedScale = ''; // 'major' or 'minor'
        this.confidence = 0;
        
        // Krumhansl-Schmuckler key profiles (correlation weights)
        this.majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
        this.minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
        
        // Note names
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Camelot Wheel mapping (key -> Camelot notation)
        // Format: [note][scale] -> Camelot
        this.camelotMap = {
            // Major keys (B side)
            'C major': '8B', 'G major': '9B', 'D major': '10B', 'A major': '11B',
            'E major': '12B', 'B major': '1B', 'F# major': '2B', 'C# major': '3B',
            'G# major': '4B', 'D# major': '5B', 'A# major': '6B', 'F major': '7B',
            // Minor keys (A side)
            'A minor': '8A', 'E minor': '9A', 'B minor': '10A', 'F# minor': '11A',
            'C# minor': '12A', 'G# minor': '1A', 'D# minor': '2A', 'A# minor': '3A',
            'F minor': '4A', 'C minor': '5A', 'G minor': '6A', 'D minor': '7A'
        };
    }

    // Analyze key using chromagram analysis (optimized with Web Audio API)
    async analyze(audioBuffer) {
        try {
            console.log('Analyzing musical key...');
            
            // Use a smaller sample for faster analysis (first 30 seconds)
            const maxDuration = 30; // seconds
            const duration = Math.min(audioBuffer.duration, maxDuration);
            const sampleCount = Math.floor(duration * audioBuffer.sampleRate);
            
            // Get audio data (first channel, limited duration)
            const channelData = audioBuffer.getChannelData(0).slice(0, sampleCount);
            const sampleRate = audioBuffer.sampleRate;
            
            // Calculate chromagram (pitch class distribution) - optimized
            const chromagram = await this.calculateChromagramOptimized(channelData, sampleRate);
            
            // Find best matching key using Krumhansl-Schmuckler algorithm
            const keyResult = this.findBestKey(chromagram);
            
            this.detectedKey = keyResult.key;
            this.detectedScale = keyResult.scale;
            this.confidence = keyResult.confidence;
            
            console.log('✓ Key detected:', this.getKeyString(), 'Confidence:', (this.confidence * 100).toFixed(1) + '%');
            
            return {
                success: true,
                key: this.detectedKey,
                scale: this.detectedScale,
                confidence: this.confidence,
                keyString: this.getKeyString()
            };
        } catch (error) {
            console.error('Key detection failed:', error);
            this.reset();
            return { success: false, key: '', scale: '', confidence: 0, error: error.message };
        }
    }

    // Calculate chromagram (optimized version using simplified frequency analysis)
    async calculateChromagramOptimized(audioData, sampleRate) {
        return new Promise((resolve) => {
            // Use setTimeout to prevent UI blocking
            setTimeout(() => {
                const chromagram = new Array(12).fill(0);
                const chunkSize = 8192; // Larger chunks for faster processing
                const hopSize = 4096;
                const numChunks = Math.min(100, Math.floor((audioData.length - chunkSize) / hopSize)); // Limit chunks
                
                // Process audio in chunks (sample only, not all data)
                for (let i = 0; i < numChunks; i++) {
                    const offset = i * hopSize;
                    
                    // Simple energy-based pitch detection (much faster than FFT)
                    for (let pitchClass = 0; pitchClass < 12; pitchClass++) {
                        // Calculate reference frequency for this pitch class (C=0, C#=1, etc.)
                        const baseFreq = 440 * Math.pow(2, (pitchClass - 9) / 12); // A=440Hz reference
                        
                        // Check multiple octaves
                        for (let octave = 2; octave <= 5; octave++) {
                            const freq = baseFreq * Math.pow(2, octave - 4);
                            const period = sampleRate / freq;
                            
                            // Simple autocorrelation at this frequency
                            let correlation = 0;
                            const samples = Math.min(Math.floor(period * 2), chunkSize / 2);
                            
                            for (let j = 0; j < samples; j++) {
                                const idx1 = offset + j;
                                const idx2 = offset + j + Math.floor(period);
                                if (idx2 < audioData.length) {
                                    correlation += audioData[idx1] * audioData[idx2];
                                }
                            }
                            
                            chromagram[pitchClass] += Math.abs(correlation);
                        }
                    }
                }
                
                // Normalize chromagram
                const max = Math.max(...chromagram);
                if (max > 0) {
                    for (let i = 0; i < 12; i++) {
                        chromagram[i] /= max;
                    }
                }
                
                resolve(chromagram);
            }, 0);
        });
    }



    // Find best matching key using Krumhansl-Schmuckler algorithm
    findBestKey(chromagram) {
        let bestKey = 'C';
        let bestScale = 'major';
        let bestCorrelation = -Infinity;
        
        // Try all 24 keys (12 major + 12 minor)
        for (let tonic = 0; tonic < 12; tonic++) {
            // Test major key
            const majorCorr = this.calculateCorrelation(chromagram, this.majorProfile, tonic);
            if (majorCorr > bestCorrelation) {
                bestCorrelation = majorCorr;
                bestKey = this.noteNames[tonic];
                bestScale = 'major';
            }
            
            // Test minor key
            const minorCorr = this.calculateCorrelation(chromagram, this.minorProfile, tonic);
            if (minorCorr > bestCorrelation) {
                bestCorrelation = minorCorr;
                bestKey = this.noteNames[tonic];
                bestScale = 'minor';
            }
        }
        
        // Normalize correlation to confidence (0-1)
        const confidence = Math.max(0, Math.min(1, (bestCorrelation + 1) / 2));
        
        return {
            key: bestKey,
            scale: bestScale,
            confidence: confidence
        };
    }

    // Calculate correlation between chromagram and key profile
    calculateCorrelation(chromagram, profile, tonic) {
        // Rotate profile to match tonic
        const rotatedProfile = [...profile.slice(tonic), ...profile.slice(0, tonic)];
        
        // Calculate Pearson correlation coefficient
        const n = 12;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += chromagram[i];
            sumY += rotatedProfile[i];
            sumXY += chromagram[i] * rotatedProfile[i];
            sumX2 += chromagram[i] * chromagram[i];
            sumY2 += rotatedProfile[i] * rotatedProfile[i];
        }
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    // Get formatted key string (e.g., "C major", "A minor")
    getKeyString() {
        if (!this.detectedKey) return '--';
        return `${this.detectedKey} ${this.detectedScale}`;
    }

    // Get Camelot notation (e.g., "8B", "5A")
    getCamelotString() {
        if (!this.detectedKey) return '--';
        const fullKey = `${this.detectedKey} ${this.detectedScale}`;
        return this.camelotMap[fullKey] || '--';
    }

    // Get key display based on notation preference
    getKeyDisplay(useCamelot = true) {
        if (!this.detectedKey) return '--';
        return useCamelot ? this.getCamelotString() : this.getKeyString();
    }

    // Get short key string (e.g., "Cmaj", "Am")
    getShortKeyString() {
        if (!this.detectedKey) return '--';
        const scaleAbbrev = this.detectedScale === 'major' ? 'maj' : 'm';
        return `${this.detectedKey}${scaleAbbrev}`;
    }

    // Reset key data
    reset() {
        this.detectedKey = '';
        this.detectedScale = '';
        this.confidence = 0;
    }

    // Set key manually (e.g., from Spotify or user input)
    setKey(key, scale = 'major') {
        // Parse key if it's in format like "C major" or "Am"
        if (scale === 'major' && key.includes('major')) {
            this.detectedKey = key.replace(' major', '').trim();
            this.detectedScale = 'major';
        } else if (scale === 'major' && key.includes('minor')) {
            this.detectedKey = key.replace(' minor', '').trim();
            this.detectedScale = 'minor';
        } else if (key.endsWith('m') && key.length <= 3) {
            this.detectedKey = key.slice(0, -1);
            this.detectedScale = 'minor';
        } else if (key.endsWith('maj')) {
            this.detectedKey = key.replace('maj', '');
            this.detectedScale = 'major';
        } else {
            this.detectedKey = key;
            this.detectedScale = scale;
        }
        
        this.confidence = 1.0; // Manual setting has full confidence
        console.log('Key set manually:', this.getKeyString());
    }

    // Get current key
    getKey() {
        return this.detectedKey;
    }

    // Get current scale
    getScale() {
        return this.detectedScale;
    }

    // Get confidence level
    getConfidence() {
        return this.confidence;
    }
}
