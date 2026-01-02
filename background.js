// Background service worker for LyricsIO

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('LyricsIO Background: Received message', request.type);
  
  if (request.type === 'GET_LYRICS') {
    fetchLyrics(request.songInfo, request.apiKey)
      .then(lyrics => {
        console.log('LyricsIO Background: Lyrics fetched successfully');
        sendResponse({ success: true, lyrics });
      })
      .catch(error => {
        console.error('LyricsIO Background: Error fetching lyrics', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

// Try multiple lyrics sources for accuracy
async function fetchLyrics(songInfo, apiKey) {
  const { title, artist } = songInfo;
  
  console.log('LyricsIO: Searching lyrics for:', title, 'by', artist);
  
  // Try dedicated lyrics APIs first (more accurate)
  try {
    const lyricsFromAPI = await fetchFromLyricsAPI(title, artist);
    if (lyricsFromAPI) {
      return formatLyricsResponse(title, artist, lyricsFromAPI, 'Lyrics API');
    }
  } catch (e) {
    console.log('LyricsIO: Lyrics API failed, trying next source...', e.message);
  }

  // Try another lyrics source
  try {
    const lyricsFromLrclib = await fetchFromLrclib(title, artist);
    if (lyricsFromLrclib) {
      return formatLyricsResponse(title, artist, lyricsFromLrclib, 'LRCLIB');
    }
  } catch (e) {
    console.log('LyricsIO: LRCLIB failed, trying AI fallback...', e.message);
  }

  // Fallback to AI (less accurate but can find more songs)
  if (apiKey) {
    return await fetchFromAI(title, artist, apiKey);
  }
  
  throw new Error('Could not find lyrics. Try searching with a different song title.');
}

// Fetch from lyrics.ovh API (free, no auth)
async function fetchFromLyricsAPI(title, artist) {
  if (!artist) return null;
  
  const response = await fetch(
    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
  );
  
  if (!response.ok) {
    throw new Error('Song not found');
  }
  
  const data = await response.json();
  return data.lyrics;
}

// Fetch from LRCLIB (free lyrics database)
async function fetchFromLrclib(title, artist) {
  const params = new URLSearchParams({
    track_name: title,
    artist_name: artist || ''
  });
  
  const response = await fetch(`https://lrclib.net/api/search?${params}`);
  
  if (!response.ok) {
    throw new Error('Song not found');
  }
  
  const data = await response.json();
  
  if (data && data.length > 0) {
    // Return plain lyrics or synced lyrics
    return data[0].plainLyrics || data[0].syncedLyrics || null;
  }
  
  return null;
}

// Format the lyrics response nicely
function formatLyricsResponse(title, artist, lyrics, source) {
  const header = `🎵 ${title}${artist ? ` - ${artist}` : ''}\n\n`;
  const footer = `\n\n— Source: ${source}`;
  return header + lyrics.trim() + footer;
}

// Fallback to AI when APIs don't have the song
async function fetchFromAI(title, artist, apiKey) {
  const prompt = `I need the EXACT lyrics for the song "${title}"${artist ? ` by ${artist}` : ''}.

IMPORTANT: Only provide lyrics if you are CERTAIN they are correct. Do not guess or make up lyrics.

If you know the exact lyrics, format them like this:
[Verse 1]
(lyrics...)

[Chorus]
(lyrics...)

(continue with proper section markers...)

If you are not sure about the exact lyrics, respond with:
"I couldn't find verified lyrics for this song. Please try searching on a lyrics website."`;

  console.log('LyricsIO: Making API request to Groq...');
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a lyrics expert. Only provide lyrics you are absolutely certain about. Never make up or guess lyrics. If unsure, say so.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'AI request failed');
  }

  const data = await response.json();
  
  if (data.choices && data.choices[0]?.message?.content) {
    const lyrics = data.choices[0].message.content;
    return `🎵 ${title}${artist ? ` - ${artist}` : ''}\n\n${lyrics}\n\n— Source: AI (verify accuracy)`;
  }
  
  throw new Error('No lyrics found');
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LyricsIO extension installed');
  
  // Set default settings
  chrome.storage.sync.get(['autoDetect', 'showPanel', 'darkTheme'], (result) => {
    if (result.autoDetect === undefined) {
      chrome.storage.sync.set({
        autoDetect: true,
        showPanel: true,
        darkTheme: true
      });
    }
  });
});
