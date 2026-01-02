# LyricsIO - YouTube Lyrics Finder

A Chrome extension that automatically detects songs playing on YouTube and displays lyrics using AI.

![LyricsIO Preview](preview.png)

## Features

- 🎵 **Auto-detect songs** - Automatically identifies the song playing on YouTube
- 🤖 **AI-powered lyrics** - Uses OpenAI's GPT model to fetch accurate lyrics
- 🎨 **Beautiful UI** - Modern, draggable lyrics panel with dark/light themes
- ⚡ **Real-time updates** - Lyrics update automatically when you switch videos
- 🔧 **Customizable** - Toggle auto-detection, panel visibility, and theme

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** in the top right corner
4. Click **Load unpacked** and select the `lyricsio` folder
5. The extension icon should appear in your toolbar

### Setup

1. Click the LyricsIO extension icon
2. Enter your Groq API key (get one FREE at [Groq Console](https://console.groq.com/keys))
3. Configure your preferences:
   - **Auto-detect songs**: Automatically fetch lyrics when a video starts
   - **Show lyrics panel**: Display the lyrics panel on YouTube
   - **Dark theme**: Toggle between dark and light themes
4. Click **Save Settings**

## Usage

1. Go to YouTube and play any music video
2. The lyrics panel will appear on the right side of the video
3. Lyrics will be automatically fetched (if auto-detect is enabled)
4. You can also click **Fetch Lyrics Now** in the popup to manually fetch lyrics

### Panel Controls

- **Drag** the header to move the panel
- **Refresh** button to re-fetch lyrics
- **Minimize** button to collapse the panel
- **Close** button to hide the panel

## How It Works

1. The extension monitors YouTube for video changes
2. When a new video is detected, it extracts the song title and artist from the video metadata
3. The song information is sent to Groq's LLaMA model
4. The AI returns the complete lyrics with proper formatting
5. Lyrics are displayed in a beautiful, scrollable panel

## API Key

This extension uses Groq API which has a **generous FREE tier**. Your API key is:
- Stored locally in Chrome's sync storage
- Never shared with third parties
- Only used to make requests to Groq's API

Get your FREE API key at: https://console.groq.com/keys

## Privacy

- The extension only runs on YouTube pages
- No data is collected or stored externally
- Your API key is stored securely in Chrome's storage

## Requirements

- Google Chrome (or Chromium-based browser)
- Groq API key (FREE at Groq Console)

## Troubleshooting

### Lyrics not appearing?
1. Make sure you've entered a valid OpenAI API key
2. Check that the lyrics panel is enabled in settings
3. Try clicking the refresh button in the panel
4. Make sure you're on a YouTube video page (`youtube.com/watch?v=...`)

### Wrong lyrics?
The AI tries to identify the song from the video title. If the title is unclear or doesn't contain the song name, try:
1. Clicking the refresh button
2. The AI will attempt to find the best matching lyrics

## License

MIT License - feel free to modify and distribute!

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.
