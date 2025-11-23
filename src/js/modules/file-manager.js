// File Manager Module - Handles folder browsing and file loading
const fs = require('fs');
const path = require('path');

export class FileManager {
    constructor() {
        this.audioFiles = [];
        this.currentFolder = '';
        this.includeSubfolders = localStorage.getItem('includeSubfolders') === 'true' || false;
        this.audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma'];
    }

    // Recursively scan folder for audio files
    scanFolderRecursive(folderPath) {
        let files = [];

        try {
            console.log('Scanning:', folderPath);
            const items = fs.readdirSync(folderPath);
            console.log('  Items found:', items.length);

            items.forEach(item => {
                const fullPath = path.join(folderPath, item);

                try {
                    const stats = fs.statSync(fullPath);

                    if (stats.isDirectory()) {
                        console.log('  [DIR]', item);
                        // Recursively scan subdirectory only if includeSubfolders is enabled
                        if (this.includeSubfolders) {
                            const subFiles = this.scanFolderRecursive(fullPath);
                            files = files.concat(subFiles);
                        }
                    } else if (stats.isFile()) {
                        // Always check files in current directory
                        const ext = path.extname(item).toLowerCase();
                        if (this.audioExtensions.includes(ext)) {
                            console.log('  [AUDIO]', item);
                            files.push({
                                name: item,
                                path: fullPath,
                                folder: path.basename(path.dirname(fullPath))
                            });
                        } else {
                            console.log('  [FILE]', item, '(not audio)');
                        }
                    }
                } catch (err) {
                    console.warn('Error accessing:', fullPath, err.message);
                }
            });
        } catch (error) {
            console.error('Error scanning folder:', folderPath, error.message);
        }

        console.log('  Total audio files from', folderPath, ':', files.length);
        return files;
    }

    // Load folder contents
    loadFolder(folderPath) {
        console.log('=== Loading folder ===');
        console.log('Path:', folderPath);
        console.log('Include subfolders:', this.includeSubfolders);

        try {
            // Check if folder exists
            if (!fs.existsSync(folderPath)) {
                throw new Error('Folder does not exist');
            }

            // Scan folder (with or without subfolders)
            console.log('Starting scan...');
            this.audioFiles = this.scanFolderRecursive(folderPath);

            console.log('Scan complete. Found files:', this.audioFiles.length);
            if (this.audioFiles.length > 0) {
                console.log('First 5 files:', this.audioFiles.slice(0, 5).map(f => f.name));
            }

            // Sort alphabetically
            this.audioFiles.sort((a, b) => a.name.localeCompare(b.name));

            this.currentFolder = folderPath;

            console.log(`Loaded ${this.audioFiles.length} audio files from ${folderPath}`);

            // Save last opened folder to localStorage
            localStorage.setItem('lastOpenedFolder', folderPath);
            console.log('Saved last opened folder:', folderPath);

            return {
                success: true,
                files: this.audioFiles,
                count: this.audioFiles.length
            };
        } catch (error) {
            console.error('Error loading folder:', error);
            return {
                success: false,
                error: error.message,
                files: [],
                count: 0
            };
        }
    }

    // Parse filename to extract artist and title
    parseFileName(filename) {
        // Remove extension
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

        // Remove leading track numbers (01, 01., 1., etc.)
        let cleaned = nameWithoutExt.replace(/^\d+[\s.-]*/, '');

        // Try to split by " - " or " – " (em dash)
        const separators = [' - ', ' – ', ' — '];
        for (const sep of separators) {
            if (cleaned.includes(sep)) {
                const parts = cleaned.split(sep);
                return {
                    artist: parts[0].trim(),
                    title: parts.slice(1).join(sep).trim(),
                    hasArtist: true
                };
            }
        }

        // No separator found, treat entire name as title
        return {
            artist: '',
            title: cleaned.trim(),
            hasArtist: false
        };
    }

    // Get filtered files based on search query
    getFilteredFiles(searchQuery) {
        if (!searchQuery) return this.audioFiles;

        const searchLower = searchQuery.toLowerCase();
        return this.audioFiles.filter(file => {
            const parsed = this.parseFileName(file.name);
            return parsed.title.toLowerCase().includes(searchLower) ||
                parsed.artist.toLowerCase().includes(searchLower) ||
                file.name.toLowerCase().includes(searchLower);
        });
    }

    // Group files by folder
    getGroupedFiles() {
        if (!this.includeSubfolders) {
            // No grouping needed if not using subfolders
            return null;
        }

        const grouped = new Map();
        
        this.audioFiles.forEach(file => {
            const folderPath = path.dirname(file.path);
            const folderName = path.basename(folderPath);
            
            if (!grouped.has(folderPath)) {
                grouped.set(folderPath, {
                    name: folderName,
                    path: folderPath,
                    files: []
                });
            }
            
            grouped.get(folderPath).files.push(file);
        });

        // Convert to array and sort by folder name
        return Array.from(grouped.values()).sort((a, b) => 
            a.name.localeCompare(b.name)
        );
    }

    // Set include subfolders option
    setIncludeSubfolders(include) {
        this.includeSubfolders = include;
        localStorage.setItem('includeSubfolders', include);
    }

    // Get current files
    getFiles() {
        return this.audioFiles;
    }

    // Get current folder
    getCurrentFolder() {
        return this.currentFolder;
    }
}
