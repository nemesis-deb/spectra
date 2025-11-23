# 🎵 YouTube Integration Setup Guide

Spectra now supports YouTube video search and playback with real-time audio visualization!

## 🔑 Getting Your YouTube API Key

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "Spectra Audio Visualizer")
4. Click "Create"

### Step 2: Enable YouTube Data API v3

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"YouTube Data API v3"**
3. Click on it and click **"Enable"**

### Step 3: Create API Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. Your API key will be generated
4. (Optional) Click **"Restrict Key"** to add security:
   - Under "API restrictions", select **"Restrict key"**
   - Choose **"YouTube Data API v3"**
   - Click **"Save"**

### Step 4: Copy Your API Key

Copy the generated API key (looks like: `AIzaSyA...`)

---

## ⚙️ Configure Spectra

### Option 1: Using .env file (Recommended)

1. Create a file named `.env` in the Spectra root directory:
   ```bash
   touch .env
   ```

2. Add your API key:
   ```env
   YOUTUBE_API_KEY=AIzaSyA_your_actual_api_key_here
   ```

3. Save the file

### Option 2: Using Settings Panel

1. Launch Spectra
2. Click the **Settings** ⚙️ icon
3. Go to **"Integrations"** section
4. Enter your YouTube API key
5. Click **"Save"**

---

## 🎬 Using YouTube Search

1. Click the **"YouTube"** button in the sidebar tabs
2. Type your search query (song name, artist, etc.)
3. Click **"Search"** or press Enter
4. Click any video thumbnail to play it
5. Enjoy real-time audio visualization!

---

## 📊 Features

✅ Search any YouTube video
✅ Real-time audio visualization
✅ All visualizers work with YouTube audio
✅ Beat detection and BPM analysis
✅ Key detection (Camelot notation)
✅ Standard playback controls (play, pause, seek, volume)
✅ Discord Rich Presence integration

---

## 🚨 Troubleshooting

### "API Key Required" Warning

**Problem**: YouTube panel shows API key warning
**Solution**:
- Make sure your `.env` file exists in the root directory
- Check that `YOUTUBE_API_KEY` is spelled correctly
- Verify the API key is valid (no extra spaces)
- Restart Spectra after creating `.env`

### "No Results Found"

**Problem**: Search returns no videos
**Solution**:
- Check your internet connection
- Verify API key is valid and has YouTube Data API v3 enabled
- Try a different search term
- Check browser console for error messages (F12)

### "Quota Exceeded" Error

**Problem**: API returns quota error
**Solution**:
- YouTube API has daily quota limits (default: 10,000 units/day)
- Each search costs ~100 units
- Wait until quota resets (midnight Pacific Time)
- Or create a new project with a new API key

### Videos Won't Play

**Problem**: Clicking video doesn't start playback
**Solution**:
- Some videos may be restricted by YouTube
- Check browser console for errors
- Try a different video
- Make sure you have internet connection

---

## 💡 Tips

- **Search Tips**: Be specific! "Daft Punk - Get Lucky" works better than just "music"
- **Performance**: YouTube videos use more bandwidth than local files
- **Offline**: Save your favorite songs locally for offline use
- **Legal**: YouTube integration is for personal use only

---

## 🔒 Privacy & Security

- Your API key is stored locally and never shared
- Spectra doesn't download YouTube videos
- All playback is streamed directly from YouTube
- No user data is collected or transmitted

---

## 📝 API Quota Info

- Default quota: **10,000 units/day**
- Search query: ~100 units
- Video info: ~1 unit
- Resets: Daily at midnight Pacific Time

**Example**: With default quota, you can make ~100 searches per day.

---

## 🆘 Need Help?

- **Issues**: [GitHub Issues](https://github.com/nemesis-deb/spectra/issues)
- **Questions**: [GitHub Discussions](https://github.com/nemesis-deb/spectra/discussions)
- **Documentation**: [Main README](README.md)

---

## ⚖️ Legal Notice

YouTube is a trademark of Google LLC. Spectra is not affiliated with, endorsed by, or sponsored by YouTube or Google. This integration uses the official YouTube IFrame Player API and complies with YouTube's Terms of Service for personal, non-commercial use.

---

**Enjoy visualizing your favorite YouTube music! 🎵✨**
