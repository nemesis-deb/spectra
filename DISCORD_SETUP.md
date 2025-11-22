# Discord Rich Presence Setup

Your audio visualizer now has Discord Rich Presence integration! Here's how to set it up:

## Step 1: Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "Audio Visualizer" (or whatever you want)
4. Click "Create"

## Step 2: Get Your Client ID

1. In your application page, you'll see "Application ID" 
2. Copy this ID
3. Open `main.js` in your project
4. Replace the placeholder client ID on line 6:
   ```javascript
   const clientId = '1234567890123456789'; // Replace with your actual ID
   ```

## Step 3: Add Rich Presence Assets (Optional)

1. In your Discord application page, go to "Rich Presence" → "Art Assets"
2. Upload an image named `icon` (this will be your large image)
3. Recommended size: 512x512 or 1024x1024 PNG

## Step 4: Test It

1. Make sure Discord is running on your computer
2. Start your audio visualizer
3. Play a song
4. Check your Discord profile - you should see:
   - Song title as "details"
   - Artist name (or "Paused") as "state"
   - Time remaining when playing
   - Your custom icon (if uploaded)

## What Shows Up

**When playing:**
- Details: Song title
- State: "by Artist Name"
- Timer: Time remaining in song

**When paused:**
- Details: Song title
- State: "⏸ Paused"

**When idle:**
- Details: "No song playing"
- State: "Idle"

## Troubleshooting

- **Not showing up?** Make sure Discord is running before you start the app
- **"Failed to connect to Discord" error?** Check that your Client ID is correct
- **Icon not showing?** Make sure you named it exactly `icon` in the Art Assets section
