// Parse filename to extract artist and title
function parseFileName(filename) {
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

module.exports = { parseFileName };
