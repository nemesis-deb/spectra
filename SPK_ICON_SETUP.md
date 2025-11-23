# Setting Up .spk File Icon

## Step 1: Convert PNG to ICO

You have `spk-icon.png` - you need to convert it to `spk-icon.ico` format.

### Option A: Online Converter (Easiest)
1. Go to https://convertio.co/png-ico/ or https://www.icoconverter.com/
2. Upload your `spk-icon.png`
3. Select sizes: 16x16, 32x32, 48x48, 256x256 (multi-size ICO)
4. Download as `spk-icon.ico`
5. Place it in the root directory of your project

### Option B: Using ImageMagick (Command Line)
```bash
magick convert spk-icon.png -define icon:auto-resize=256,128,96,64,48,32,16 spk-icon.ico
```

### Option C: Using GIMP (Free Software)
1. Open `spk-icon.png` in GIMP
2. File → Export As
3. Change extension to `.ico`
4. Select multiple sizes in the export dialog
5. Save to project root

## Step 2: Register File Type (Windows)

### During Development
1. Right-click `register-spk-filetype.bat`
2. Select "Run as Administrator"
3. The script will register `.spk` files with your icon

### After Building the App
When you build the installer with `npm run build`, electron-builder will automatically:
- Register the `.spk` file extension
- Associate it with your app
- Set the custom icon
- Add "Open with Spectra" to the context menu

## Step 3: Test

1. Create a test `.spk` file (save a preset)
2. Check if it shows your custom icon in File Explorer
3. Right-click the file → should see "Open with Spectra"
4. Double-click should open the file in Spectra

## Troubleshooting

### Icon not showing?
- Refresh icon cache: 
  ```cmd
  ie4uinit.exe -show
  ```
- Or restart Windows Explorer:
  ```cmd
  taskkill /f /im explorer.exe & start explorer.exe
  ```

### File association not working?
- Run `register-spk-filetype.bat` as Administrator
- Check registry: `HKEY_CLASSES_ROOT\.spk`

### Icon looks blurry?
- Make sure your ICO file contains multiple sizes
- Recommended sizes: 16x16, 32x32, 48x48, 256x256

## File Locations

```
your-project/
├── spk-icon.png              # Your original icon (source)
├── spk-icon.ico              # Converted icon (needed)
├── register-spk-filetype.bat # Manual registration script
├── unregister-spk-filetype.bat # Cleanup script
└── package.json              # Updated with fileAssociations
```

## What Happens When User Installs

1. Installer runs
2. `.spk` extension is registered with Windows
3. Your icon is associated with `.spk` files
4. Users can double-click `.spk` files to open in Spectra
5. Right-click menu shows "Open with Spectra"

## Uninstalling

The uninstaller will automatically remove the file association, or you can manually run:
```cmd
unregister-spk-filetype.bat
```

## Icon Design Tips

For best results, your `spk-icon.png` should:
- Be at least 256x256 pixels
- Have a transparent background
- Be simple and recognizable at small sizes
- Use high contrast colors
- Match your app's branding

## Example Icon Ideas

- 🎵 Waveform with "SPK" text
- 📊 Spectrum bars forming an "S"
- 🎨 Colorful audio visualization pattern
- 📦 Package/box with audio waves
- ⚡ Lightning bolt + sound wave

---

**Note:** File associations only work in the built/installed version of the app, not during development with `npm start`.
