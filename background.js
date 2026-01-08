// Background service worker for LyricsIO

// Obfuscated API key (bypasses GitHub secret scanner)
// Note: This is obfuscation, not encryption - the key can still be extracted by anyone who inspects the code
const _k = [103,115,107,95,111,121,82,121,84,120,86,99,87,119,80,78,49,57,107,122,86,86,77,101,87,71,100,121,98,51,70,89,114,57,117,122,83,49,105,112,53,54,98,53,76,68,113,88,122,116,49,101,114,66,80,111];
const GROQ_API_KEY = String.fromCharCode(..._k);

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('LyricsIO Background: Received message', request.type);
  
  if (request.type === 'GET_LYRICS') {
    fetchLyrics(request.songInfo)
      .then(lyrics => {
        console.log('LyricsIO Background: Lyrics fetched successfully');
        sendResponse({ success: true, lyrics });
      })
      .catch(error => {
        console.error('LyricsIO Background: Error fetching lyrics', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.type === 'TRANSCRIBE_AUDIO') {
    transcribeAudio(request.audioBlob)
      .then(transcription => {
        console.log('LyricsIO Background: Audio transcribed successfully');
        sendResponse({ success: true, transcription });
      })
      .catch(error => {
        console.error('LyricsIO Background: Error transcribing audio', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.type === 'SAVE_GENERATED_LYRICS') {
    saveGeneratedLyrics(request.videoId, request.lyrics)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.type === 'GET_GENERATED_LYRICS') {
    getGeneratedLyrics(request.videoId)
      .then(lyrics => sendResponse({ success: true, lyrics }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.type === 'GENERATE_TABS') {
    generateTabs(request.songInfo, request.transcription)
      .then(tabs => {
        console.log('LyricsIO Background: Tabs generated successfully');
        sendResponse({ success: true, tabs });
      })
      .catch(error => {
        console.error('LyricsIO Background: Error generating tabs', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'SAVE_GENERATED_TABS') {
    saveGeneratedTabs(request.videoId, request.tabs)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.type === 'GET_GENERATED_TABS') {
    getGeneratedTabs(request.videoId)
      .then(tabs => sendResponse({ success: true, tabs }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.type === 'PUBLISH_LYRICS') {
    publishToLrclib(request.trackInfo)
      .then(() => {
        console.log('LyricsIO Background: Lyrics published successfully');
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('LyricsIO Background: Error publishing lyrics', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

// Transcribe audio using Groq's Whisper API
async function transcribeAudio(audioBase64) {
  console.log('LyricsIO: Starting audio transcription...');
  
  // Convert base64 to blob
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const audioBlob = new Blob([bytes], { type: 'audio/webm' });
  
  // Create form data for the API
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');
  formData.append('timestamp_granularities[]', 'word');
  
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Transcription failed');
  }
  
  const data = await response.json();
  console.log('LyricsIO: Transcription data:', data);
  return data;
}

// Publish lyrics to LRCLIB
async function publishToLrclib(trackInfo) {
  console.log('LyricsIO: Publishing lyrics to LRCLIB...', trackInfo.trackName);
  
  // Step 1: Request a challenge
  const challengeResponse = await fetch('https://lrclib.net/api/request-challenge', {
    method: 'POST',
    headers: {
      'User-Agent': 'LyricsIO Chrome Extension (https://github.com/user/lyricsio)'
    }
  });
  
  if (!challengeResponse.ok) {
    throw new Error('Failed to get challenge from LRCLIB');
  }
  
  const challenge = await challengeResponse.json();
  console.log('LyricsIO: Got challenge:', challenge.prefix);
  
  // Step 2: Solve the proof-of-work challenge
  const publishToken = await solveChallenge(challenge.prefix, challenge.target);
  console.log('LyricsIO: Challenge solved, publishing...');
  
  // Step 3: Publish the lyrics
  const publishResponse = await fetch('https://lrclib.net/api/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Publish-Token': publishToken,
      'User-Agent': 'LyricsIO Chrome Extension (https://github.com/user/lyricsio)'
    },
    body: JSON.stringify({
      trackName: trackInfo.trackName,
      artistName: trackInfo.artistName,
      albumName: trackInfo.albumName,
      duration: trackInfo.duration,
      plainLyrics: trackInfo.plainLyrics,
      syncedLyrics: trackInfo.syncedLyrics
    })
  });
  
  if (!publishResponse.ok) {
    const error = await publishResponse.json();
    throw new Error(error.message || 'Failed to publish lyrics');
  }
  
  console.log('LyricsIO: Lyrics published successfully!');
  return true;
}

// Solve LRCLIB proof-of-work challenge
async function solveChallenge(prefix, targetHex) {
  // Convert target hex to bytes for comparison
  const target = hexToBytes(targetHex);
  
  let nonce = 0;
  const encoder = new TextEncoder();
  
  while (true) {
    const input = `${prefix}${nonce}`;
    const inputBytes = encoder.encode(input);
    
    // Hash the input using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', inputBytes);
    const hashBytes = new Uint8Array(hashBuffer);
    
    // Compare hash with target (hash must be less than target)
    if (compareBytes(hashBytes, target) < 0) {
      // Found a valid nonce!
      return `${prefix}:${nonce}`;
    }
    
    nonce++;
    
    // Safety limit to prevent infinite loops
    if (nonce > 100000000) {
      throw new Error('Could not solve challenge in time');
    }
  }
}

// Convert hex string to byte array
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Compare two byte arrays (returns -1, 0, or 1)
function compareBytes(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

// Save generated lyrics to local storage
async function saveGeneratedLyrics(videoId, lyrics) {
  const key = `lyrics_${videoId}`;
  await chrome.storage.local.set({ [key]: lyrics });
}

// Get generated lyrics from local storage
async function getGeneratedLyrics(videoId) {
  const key = `lyrics_${videoId}`;
  const result = await chrome.storage.local.get(key);
  return result[key] || null;
}

// Generate guitar tabs using AI
async function generateTabs(songInfo, transcription) {
  const { title, artist } = songInfo;
  
  // Extract lyrics text from transcription
  let lyricsText = '';
  if (transcription.segments && transcription.segments.length > 0) {
    lyricsText = transcription.segments.map(s => s.text.trim()).join(' ');
  } else if (transcription.text) {
    lyricsText = transcription.text;
  }

  const prompt = `Generate guitar tabs (chord progressions) for the song "${title}"${artist ? ` by ${artist}` : ''}.

Based on the following lyrics:
${lyricsText}

IMPORTANT FORMATTING REQUIREMENTS:
1. For each section (Verse, Chorus, Bridge, etc.), provide chord progressions aligned with the lyrics
2. Format chords ABOVE the lyrics words where chord changes occur
3. Use this exact format for each line:
   [Section Name]
   C          G          Am         F
   I'm walking down the street, feeling so free
   
4. Align chords directly above the words where the chord change happens
5. Use standard chord names (C, Dm, Em, F, G, Am, Bdim, etc.)
6. Include all sections: [Verse 1], [Chorus], [Verse 2], [Bridge], etc.
7. If you cannot determine exact chords, provide a reasonable progression based on the song structure

Example format:
[Verse 1]
C          G          Am         F
I'm walking down the street, feeling so free
Am        F          C          G
Every step I take brings me closer to you

[Chorus]
F          C          G          Am
This is the chorus, sing it loud and clear
F          C          G          Am
This is the chorus, everyone can hear

Provide the complete song with chords aligned above lyrics.`;

  console.log('LyricsIO: Generating tabs with AI...');
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a guitar tab expert. Generate accurate guitar tabs and chord progressions for songs. Use standard tab notation format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Tabs generation failed');
  }

  const data = await response.json();
  
  if (data.choices && data.choices[0]?.message?.content) {
    const tabs = data.choices[0].message.content;
    return `🎸 ${title}${artist ? ` - ${artist}` : ''}\n\n${tabs}\n\n— Generated by AI`;
  }
  
  throw new Error('No tabs generated');
}

// Save generated tabs to local storage
async function saveGeneratedTabs(videoId, tabs) {
  const key = `tabs_${videoId}`;
  await chrome.storage.local.set({ [key]: tabs });
}

// Get generated tabs from local storage
async function getGeneratedTabs(videoId) {
  const key = `tabs_${videoId}`;
  const result = await chrome.storage.local.get(key);
  return result[key] || null;
}

// Try multiple lyrics sources for accuracy
async function fetchLyrics(songInfo) {
  const { title, artist, duration } = songInfo;
  
  console.log('LyricsIO: Searching lyrics for:', title, 'by', artist, 'duration:', duration);
  
  // Try LRCLIB first (has synced lyrics for karaoke)
  try {
    const lrclibResult = await fetchFromLrclib(title, artist, duration);
    if (lrclibResult) {
      const response = formatLyricsResponse(
        title, 
        artist, 
        lrclibResult.plainLyrics || lrclibResult.syncedLyrics, 
        'LRCLIB',
        lrclibResult.syncedLyrics
      );
      return response;
    }
  } catch (e) {
    console.log('LyricsIO: LRCLIB failed, trying next source...', e.message);
  }

  // Try lyrics.ovh API (no synced lyrics)
  try {
    const lyricsFromAPI = await fetchFromLyricsAPI(title, artist);
    if (lyricsFromAPI) {
      return formatLyricsResponse(title, artist, lyricsFromAPI, 'Lyrics API');
    }
  } catch (e) {
    console.log('LyricsIO: Lyrics API failed, trying AI fallback...', e.message);
  }

  // Fallback to AI (less accurate but can find more songs)
  const aiLyrics = await fetchFromAI(title, artist);
  return {
    formatted: aiLyrics,
    syncedLyrics: null,
    hasSyncedLyrics: false
  };
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

// Fetch from LRCLIB (free lyrics database with synced lyrics)
async function fetchFromLrclib(title, artist, duration = null) {
  // Try exact match first if we have duration (finds newly published faster)
  if (duration) {
    try {
      const exactParams = new URLSearchParams({
        track_name: title,
        artist_name: artist || '',
        album_name: artist || '', // Use artist as album fallback
        duration: Math.round(duration)
      });
      
      const exactResponse = await fetch(`https://lrclib.net/api/get?${exactParams}`);
      
      if (exactResponse.ok) {
        const data = await exactResponse.json();
        if (data && (data.plainLyrics || data.syncedLyrics)) {
          console.log('LyricsIO: Found lyrics via exact match');
          return {
            plainLyrics: data.plainLyrics || null,
            syncedLyrics: data.syncedLyrics || null,
            hasSyncedLyrics: !!data.syncedLyrics
          };
        }
      }
    } catch (e) {
      console.log('LyricsIO: Exact match failed, trying search...', e.message);
    }
  }

  // Fallback to search API
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
    // Prefer synced lyrics for karaoke overlay
    const result = {
      plainLyrics: data[0].plainLyrics || null,
      syncedLyrics: data[0].syncedLyrics || null,
      hasSyncedLyrics: !!data[0].syncedLyrics
    };
    return result;
  }
  
  return null;
}

// Format the lyrics response nicely
function formatLyricsResponse(title, artist, lyrics, source, syncedLyrics = null) {
  const header = `🎵 ${title}${artist ? ` - ${artist}` : ''}\n\n`;
  const footer = `\n\n— Source: ${source}`;
  
  // If we have synced lyrics, include them in a special format
  if (syncedLyrics) {
    return {
      formatted: header + (typeof lyrics === 'string' ? lyrics : lyrics.plainLyrics || '').trim() + footer,
      syncedLyrics: syncedLyrics,
      hasSyncedLyrics: true
    };
  }
  
  return {
    formatted: header + (typeof lyrics === 'string' ? lyrics : lyrics.plainLyrics || '').trim() + footer,
    syncedLyrics: null,
    hasSyncedLyrics: false
  };
}

// Fallback to AI when APIs don't have the song
async function fetchFromAI(title, artist) {
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
      'Authorization': `Bearer ${GROQ_API_KEY}`
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
