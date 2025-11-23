# GitHub Release Instructions for v1.0.2

## ✅ What's Ready

### Windows Builds (Complete)
- ✅ `Spectra Setup 1.0.2.exe` (75.77 MB) - Installer
- ✅ `Spectra 1.0.2.exe` (75.53 MB) - Portable

### Linux & macOS Builds
⚠️ These require building on their respective platforms:
- Linux: Requires Ubuntu/Debian to build AppImage/deb
- macOS: Requires macOS to build DMG/zip

## 📦 Creating the GitHub Release

### Step 1: Go to GitHub Releases
1. Navigate to: https://github.com/nemesis-deb/spectra/releases
2. Click "Draft a new release"

### Step 2: Fill in Release Details
- **Tag**: `v1.0.2` (should auto-select the tag we pushed)
- **Release title**: `Spectra v1.0.2 - Key Detection + Preset System`
- **Description**: Copy from `RELEASE_NOTES_v1.0.2.md`

### Step 3: Upload Windows Builds
Drag and drop these files from `dist/` folder:
- `Spectra Setup 1.0.2.exe` - Rename to: `Spectra-Setup-1.0.2.exe`
- `Spectra 1.0.2.exe` - Rename to: `Spectra-Portable-1.0.2.exe`

### Step 4: Add Build Instructions for Other Platforms

Add this section to the release notes:

```markdown
## 🏗️ Building from Source

### Linux (Ubuntu/Debian)
\`\`\`bash
git clone https://github.com/nemesis-deb/spectra.git
cd spectra
git checkout v1.0.2
npm install
npm run build:linux
\`\`\`

Outputs:
- `dist/Spectra-1.0.2.AppImage` (Universal)
- `dist/Spectra-1.0.2.deb` (Debian/Ubuntu)

### macOS
\`\`\`bash
git clone https://github.com/nemesis-deb/spectra.git
cd spectra
git checkout v1.0.2
npm install
npm run build:mac
\`\`\`

Outputs:
- `dist/Spectra-1.0.2.dmg`
- `dist/Spectra-1.0.2-mac.zip`
```

### Step 5: Publish Release
1. Check "Set as the latest release"
2. Click "Publish release"

## 🚀 Alternative: Using GitHub CLI

If you have GitHub CLI installed:

\`\`\`bash
# Create release
gh release create v1.0.2 \
  --title "Spectra v1.0.2 - Key Detection + Preset System" \
  --notes-file RELEASE_NOTES_v1.0.2.md \
  "dist/Spectra Setup 1.0.2.exe#Spectra-Setup-1.0.2.exe" \
  "dist/Spectra 1.0.2.exe#Spectra-Portable-1.0.2.exe"
\`\`\`

## 📝 Post-Release Checklist

- [ ] Verify downloads work
- [ ] Test installer on clean Windows machine
- [ ] Update README.md with download links
- [ ] Announce on Discord/social media
- [ ] Close related issues/PRs

## 🔄 Building Linux/macOS Later

### Option 1: GitHub Actions (Recommended)
Create `.github/workflows/build.yml` to auto-build on all platforms

### Option 2: Use CI Services
- AppVeyor (Windows)
- Travis CI (Linux/macOS)
- CircleCI (all platforms)

### Option 3: Manual Build
- Find a Linux/macOS machine
- Clone repo, checkout v1.0.2
- Run build commands
- Upload to release

## 📊 Release Assets Summary

### Current (Windows Only)
- Spectra-Setup-1.0.2.exe (Installer)
- Spectra-Portable-1.0.2.exe (Portable)

### Future (When Built)
- Spectra-1.0.2.AppImage (Linux Universal)
- Spectra-1.0.2.deb (Debian/Ubuntu)
- Spectra-1.0.2.dmg (macOS)
- Spectra-1.0.2-mac.zip (macOS)

## 🎯 Quick Upload Command

From PowerShell in project root:

\`\`\`powershell
# Rename files for release
Copy-Item "dist\Spectra Setup 1.0.2.exe" "dist\Spectra-Setup-1.0.2.exe"
Copy-Item "dist\Spectra 1.0.2.exe" "dist\Spectra-Portable-1.0.2.exe"

# Open dist folder
explorer dist
\`\`\`

Then drag and drop to GitHub release page!

---

**Repository**: https://github.com/nemesis-deb/spectra
**Release Page**: https://github.com/nemesis-deb/spectra/releases/new
