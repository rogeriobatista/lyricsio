// LyricsIO Content Script - Runs on YouTube pages

class LyricsIO {
  constructor() {
    this.panel = null;
    this.overlay = null;
    this.settings = {
      autoDetect: true,
      showPanel: true,
      darkTheme: true,
      showOverlay: true
    };
    this.isMinimized = false;
    this.syncedLyrics = null;
    this.parsedLyrics = [];
    this.syncInterval = null;
    
    // Current song tracking - simple approach
    this.currentSong = {
      title: '',
      artist: '',
      videoId: ''
    };
    
    // Audio transcription properties
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.audioSource = null;
    this.audioDestination = null;
    this.apiLyrics = null;
    this.generatedLyrics = null;
    this.currentLyricsSource = 'api';
    this.recordDuration = 0;
    this.recordStartTime = 0;
    this.progressInterval = null;
    this.videoEndHandler = null;
    this.isFetching = false;
    this.language = 'en';
    
    this.init();
  }

  async init() {
    // Load settings
    const stored = await chrome.storage.sync.get(['autoDetect', 'showPanel', 'darkTheme', 'showOverlay', 'language']);
    this.settings = { ...this.settings, ...stored };
    
    // Set language
    this.language = stored.language || detectBrowserLanguage();

    // Create the lyrics panel
    this.createPanel();
    
    // Create the lyrics overlay
    this.createOverlay();

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'FETCH_LYRICS') {
        // Make sure panel is visible
        this.panel.classList.remove('lyricsio-hidden');
        this.isMinimized = false;
        this.panel.classList.remove('lyricsio-minimized');
        this.fetchLyricsForCurrentVideo();
        sendResponse({ success: true });
      } else if (request.type === 'SETTINGS_UPDATED') {
        this.settings = request.settings;
        // Update language if changed
        if (request.settings.language && request.settings.language !== this.language) {
          this.language = request.settings.language;
          this.applyPanelTranslations();
        }
        this.updatePanelVisibility();
        sendResponse({ success: true });
      }
      return true;
    });

    // Watch for video changes
    this.observeVideoChanges();

    // Initial check if on a video page
    if (this.isVideoPage()) {
      // Initial load - get song info and trigger fetch
      setTimeout(() => this.checkForSongChange(), 1000);
    }
  }

  isVideoPage() {
    return window.location.pathname === '/watch';
  }

  getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  createPanel() {
    // Remove existing panel if any
    const existing = document.getElementById('lyricsio-panel');
    if (existing) existing.remove();

    // Create panel container
    this.panel = document.createElement('div');
    this.panel.id = 'lyricsio-panel';
    this.panel.className = this.settings.darkTheme ? 'lyricsio-dark' : 'lyricsio-light';
    
    this.panel.innerHTML = `
      <div class="lyricsio-header">
        <div class="lyricsio-title">
          <svg class="lyricsio-icon" width="20" height="20" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" fill="url(#lyricsio-grad)"/>
            <path d="M16 12v16l12-8-12-8z" fill="#1a1a2e"/>
            <defs>
              <linearGradient id="lyricsio-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ff6b6b"/>
                <stop offset="100%" style="stop-color:#feca57"/>
              </linearGradient>
            </defs>
          </svg>
          <span>LyricsIO</span>
        </div>
        <div class="lyricsio-controls">
          <button class="lyricsio-btn lyricsio-refresh" data-i18n-title="refreshLyrics">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button class="lyricsio-btn lyricsio-minimize" data-i18n-title="minimize">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button class="lyricsio-btn lyricsio-close" data-i18n-title="close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="lyricsio-song-info">
        <div class="lyricsio-song-title" data-i18n="detectingSong">${t('detectingSong', this.language)}</div>
      </div>
      <div class="lyricsio-content">
        <div class="lyricsio-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <p data-i18n="playSongToSeeLyrics">${t('playSongToSeeLyrics', this.language)}</p>
        </div>
      </div>
      <div class="lyricsio-footer">
        <div class="lyricsio-footer-controls">
          <button class="lyricsio-generate-btn" data-i18n-title="generateFromAudio">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <span data-i18n="generate">${t('generate', this.language)}</span>
          </button>
          <div class="lyricsio-source-toggle" style="display: none;">
            <button class="lyricsio-source-btn active" data-source="api">API</button>
            <button class="lyricsio-source-btn" data-source="generated" data-i18n="aiGenerated">${t('aiGenerated', this.language)}</button>
            <button class="lyricsio-publish-btn" style="display: none;" data-i18n-title="publishToHelp">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span data-i18n="publish">${t('publish', this.language)}</span>
            </button>
          </div>
        </div>
        <span class="lyricsio-status" data-i18n="poweredByAI">${t('poweredByAI', this.language)}</span>
      </div>
    `;

    document.body.appendChild(this.panel);

    // Add event listeners
    this.panel.querySelector('.lyricsio-close').addEventListener('click', () => {
      this.panel.classList.add('lyricsio-hidden');
      this.stopRecording();
    });

    this.panel.querySelector('.lyricsio-minimize').addEventListener('click', () => {
      this.toggleMinimize();
    });

    this.panel.querySelector('.lyricsio-refresh').addEventListener('click', () => {
      this.fetchLyricsForCurrentVideo();
    });

    // Generate button
    this.panel.querySelector('.lyricsio-generate-btn').addEventListener('click', () => {
      this.handleGenerateClick();
    });

    // Source toggle buttons
    this.panel.querySelectorAll('.lyricsio-source-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchLyricsSource(e.target.dataset.source);
      });
    });

    // Publish button
    this.panel.querySelector('.lyricsio-publish-btn').addEventListener('click', () => {
      this.publishLyrics();
    });

    // Make panel draggable
    this.makeDraggable();

    // Update visibility based on settings
    this.updatePanelVisibility();
  }

  createOverlay() {
    // Remove existing overlay if any
    const existing = document.getElementById('lyricsio-overlay');
    if (existing) existing.remove();
    
    this.overlay = document.createElement('div');
    this.overlay.id = 'lyricsio-overlay';
    this.overlay.className = 'lyricsio-overlay-hidden';
    
    this.overlay.innerHTML = `
      <div class="lyricsio-overlay-container">
        <div class="lyricsio-overlay-current">♪ ♪ ♪</div>
        <div class="lyricsio-overlay-next"></div>
      </div>
      <button class="lyricsio-overlay-close" title="Hide lyrics overlay">✕</button>
    `;
    
    document.body.appendChild(this.overlay);
    
    // Close button
    this.overlay.querySelector('.lyricsio-overlay-close').addEventListener('click', () => {
      this.overlay.classList.add('lyricsio-overlay-hidden');
      this.settings.showOverlay = false;
      chrome.storage.sync.set({ showOverlay: false });
    });
  }

  makeDraggable() {
    const header = this.panel.querySelector('.lyricsio-header');
    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.lyricsio-btn')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = this.panel.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      this.panel.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.panel.style.left = `${initialX + dx}px`;
      this.panel.style.top = `${initialY + dy}px`;
      this.panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      this.panel.style.transition = '';
    });
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.panel.classList.toggle('lyricsio-minimized', this.isMinimized);
  }

  updatePanelVisibility() {
    if (!this.panel) return;
    
    if (this.settings.showPanel && this.isVideoPage()) {
      this.panel.classList.remove('lyricsio-hidden');
    } else {
      this.panel.classList.add('lyricsio-hidden');
    }

    this.panel.className = this.panel.className.replace(/lyricsio-(dark|light)/, '');
    this.panel.classList.add(this.settings.darkTheme ? 'lyricsio-dark' : 'lyricsio-light');
  }

  applyPanelTranslations() {
    if (!this.panel) return;
    
    // Apply translations to elements with data-i18n attribute
    this.panel.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = t(key, this.language);
      if (translation) {
        element.textContent = translation;
      }
    });
    
    // Apply translations to title attributes
    this.panel.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translation = t(key, this.language);
      if (translation) {
        element.title = translation;
      }
    });
  }

  observeVideoChanges() {
    // Simple polling approach - check every 2 seconds if song changed
    setInterval(() => {
      if (this.isVideoPage() && this.settings.autoDetect && !this.isFetching) {
        this.checkForSongChange();
      }
    }, 2000);

    // Also check on YouTube navigation events
    window.addEventListener('yt-navigate-finish', () => {
      console.log('LyricsIO: yt-navigate-finish');
      setTimeout(() => this.checkForSongChange(), 1000);
    });

    window.addEventListener('popstate', () => {
      setTimeout(() => this.checkForSongChange(), 1000);
    });
  }

  // Check if the current song is different from what we have
  checkForSongChange() {
    if (!this.isVideoPage()) return;
    
    const newSong = this.getCurrentSongFromPage();
    
    // Compare with stored song
    const isDifferent = 
      newSong.title !== this.currentSong.title ||
      newSong.artist !== this.currentSong.artist ||
      newSong.videoId !== this.currentSong.videoId;
    
    if (isDifferent && newSong.title && newSong.title.length > 2) {
      console.log('LyricsIO: Song changed!');
      console.log('  Old:', this.currentSong.title, '-', this.currentSong.artist);
      console.log('  New:', newSong.title, '-', newSong.artist);
      
      this.onSongChange(newSong);
    }
  }

  // Get the current song info directly from the page
  getCurrentSongFromPage() {
    const videoId = this.getVideoId() || '';
    
    // Get title from DOM
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata yt-formatted-string, #title h1');
    let title = titleElement?.textContent?.trim() || '';
    
    // Fallback to document title
    if (!title || title === 'YouTube') {
      title = document.title.replace(' - YouTube', '').trim();
    }
    
    // Get artist/channel
    const channelElement = document.querySelector('#channel-name a, ytd-channel-name a');
    let artist = channelElement?.textContent?.trim() || '';
    
    return { title, artist, videoId };
  }

  // Called when song actually changes
  onSongChange(newSong) {
    console.log('LyricsIO: Song changed - updating');
    
    // Store the new song info
    this.currentSong = { ...newSong };
    this.currentVideoId = newSong.videoId;
    
    this.updatePanelVisibility();
    this.stopLyricsSync();
    this.stopRecording();

    if (!this.isVideoPage()) {
      this.panel?.classList.add('lyricsio-hidden');
      return;
    }

    // Clear old state
    this.syncedLyrics = null;
    this.parsedLyrics = [];
    this.apiLyrics = null;
    this.generatedLyrics = null;
    this.currentLyricsSource = 'api';
    
    // Hide source toggle for new video
    const toggle = this.panel.querySelector('.lyricsio-source-toggle');
    if (toggle) toggle.style.display = 'none';
    
    // Reset source buttons
    this.panel.querySelectorAll('.lyricsio-source-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.source === 'api');
    });
    
    // Reset AI karaoke button text
    const generatedBtn = this.panel.querySelector('[data-source="generated"]');
    if (generatedBtn) {
      generatedBtn.innerHTML = 'AI Generated';
      generatedBtn.title = '';
    }
    
    // Show loading state
    this.updateSongInfo({ title: 'Loading...', artist: '' });
    this.showLoading();
    
    if (this.settings.autoDetect) {
      // Pass the song info directly to avoid reading stale DOM data
      this.fetchLyricsForCurrentVideo(newSong);
    }
  }

  getSongInfo(providedSong = null) {
    // Use provided song info or fall back to stored currentSong
    let { title, artist } = providedSong || this.currentSong;
    
    // If somehow empty, try to get from page again
    if (!title) {
      const songFromPage = this.getCurrentSongFromPage();
      title = songFromPage.title;
      artist = songFromPage.artist;
    }

    // Clean up common patterns in titles
    // Remove common suffixes like (Official Video), [Lyrics], etc.
    title = title
      .replace(/\s*[\(\[]*(official\s*)?(music\s*)?(video|audio|lyrics|lyric|mv|hd|4k|visualizer)[\)\]]*/gi, '')
      .replace(/\s*[\(\[]*feat\.?\s*[^\)\]]+[\)\]]*/gi, '')
      .replace(/\s*[\(\[]*ft\.?\s*[^\)\]]+[\)\]]*/gi, '')
      .replace(/\s*[\(\[]*prod\.?\s*[^\)\]]+[\)\]]*/gi, '')
      .replace(/\s*\|.*$/g, '')
      .trim();

    // Try to extract artist from title if it contains " - "
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }
    }

    // Store the full title for change detection
    this.lastKnownTitle = `${title} ${artist}`.trim();

    // Get video duration for better API matching
    const video = document.querySelector('video');
    const duration = video ? Math.round(video.duration) : null;

    return { title, artist, duration };
  }

  async fetchLyricsForCurrentVideo(providedSong = null) {
    if (!this.panel) {
      this.createPanel();
    }

    const songInfo = this.getSongInfo(providedSong);
    console.log('LyricsIO: Fetching lyrics for:', songInfo);
    
    // Update UI to show loading and block generate button
    this.isFetching = true;
    this.updateGenerateButtonState();
    this.updateSongInfo(songInfo);
    this.showLoading();

    try {
      console.log('LyricsIO: Sending request to background script...');

      // Request lyrics from background script
      const response = await chrome.runtime.sendMessage({
        type: 'GET_LYRICS',
        songInfo
      });

      console.log('LyricsIO: Response received:', response);

      if (response && response.success) {
        this.showLyrics(response.lyrics);
      } else {
        this.showError(response?.error || 'Failed to fetch lyrics. Check your API key.');
      }
    } catch (error) {
      console.error('LyricsIO Error:', error);
      this.showError(`Error: ${error.message || 'Failed to fetch lyrics. Please try again.'}`);
    } finally {
      // Re-enable generate button
      this.isFetching = false;
      this.updateGenerateButtonState();
    }
  }

  updateSongInfo(songInfo) {
    const songTitleEl = this.panel.querySelector('.lyricsio-song-title');
    if (songTitleEl) {
      songTitleEl.textContent = songInfo.artist 
        ? `${songInfo.title} - ${songInfo.artist}`
        : songInfo.title;
    }
  }

  showLoading() {
    const content = this.panel.querySelector('.lyricsio-content');
    content.innerHTML = `
      <div class="lyricsio-loading">
        <div class="lyricsio-spinner"></div>
        <p>Fetching lyrics...</p>
      </div>
    `;
  }

  showLyrics(lyricsData) {
    const content = this.panel.querySelector('.lyricsio-content');
    
    // Store API lyrics for toggling
    this.apiLyrics = lyricsData;
    
    // Handle both string and object responses
    let displayLyrics = '';
    if (typeof lyricsData === 'string') {
      displayLyrics = lyricsData;
      this.syncedLyrics = null;
    } else if (lyricsData && typeof lyricsData === 'object') {
      displayLyrics = lyricsData.formatted || '';
      this.syncedLyrics = lyricsData.syncedLyrics || null;
    }
    
    // Format lyrics with proper line breaks and styling
    const formattedLyrics = this.formatLyrics(displayLyrics);
    
    content.innerHTML = `
      <div class="lyricsio-lyrics">
        ${formattedLyrics}
      </div>
    `;
    
    // If we have synced lyrics, enable the overlay
    if (this.syncedLyrics && this.settings.showOverlay) {
      this.parsedLyrics = this.parseLRC(this.syncedLyrics);
      this.startLyricsSync();
      this.showSyncStatus(true);
    } else {
      this.stopLyricsSync();
      this.showSyncStatus(false);
    }
    
    // Check for existing generated lyrics and show toggle if available
    this.checkForGeneratedLyrics();
  }

  // Check if we have generated lyrics saved for this video
  async checkForGeneratedLyrics() {
    const existing = await this.loadGeneratedLyrics();
    if (existing) {
      this.generatedLyrics = existing;
      this.showSourceToggle();
    }
  }

  showSyncStatus(hasSynced) {
    const footer = this.panel.querySelector('.lyricsio-status');
    if (footer) {
      footer.innerHTML = hasSynced 
        ? '🎤 <span style="color: #2ed573;">Synced lyrics active</span>'
        : 'Powered by AI';
    }
  }

  // Parse LRC format lyrics into timed array
  parseLRC(lrcString) {
    const lines = lrcString.split('\n');
    const parsed = [];
    
    for (const line of lines) {
      // Match timestamp format [mm:ss.xx] or [mm:ss]
      const match = line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
        const time = minutes * 60 + seconds + ms / 1000;
        const text = match[4].trim();
        
        if (text) { // Only add non-empty lines
          parsed.push({ time, text });
        }
      }
    }
    
    // Sort by time
    parsed.sort((a, b) => a.time - b.time);
    return parsed;
  }

  startLyricsSync() {
    this.stopLyricsSync(); // Clear any existing interval
    
    const video = document.querySelector('video');
    if (!video || this.parsedLyrics.length === 0) return;
    
    // Show overlay
    if (this.overlay) {
      this.overlay.classList.remove('lyricsio-overlay-hidden');
    }
    
    // Update lyrics every 100ms
    this.syncInterval = setInterval(() => {
      this.updateOverlayLyrics(video.currentTime);
    }, 100);
    
    // Also listen to video events
    video.addEventListener('seeking', () => this.updateOverlayLyrics(video.currentTime));
    video.addEventListener('pause', () => {
      if (this.overlay) {
        this.overlay.classList.add('lyricsio-overlay-paused');
      }
    });
    video.addEventListener('play', () => {
      if (this.overlay) {
        this.overlay.classList.remove('lyricsio-overlay-paused');
      }
    });
  }

  stopLyricsSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.overlay) {
      this.overlay.classList.add('lyricsio-overlay-hidden');
    }
  }

  updateOverlayLyrics(currentTime) {
    if (!this.overlay || this.parsedLyrics.length === 0) return;
    
    // Find current and next lyrics
    let currentLine = null;
    let nextLine = null;
    
    for (let i = 0; i < this.parsedLyrics.length; i++) {
      if (this.parsedLyrics[i].time <= currentTime) {
        currentLine = this.parsedLyrics[i];
        nextLine = this.parsedLyrics[i + 1] || null;
      } else {
        break;
      }
    }
    
    const currentEl = this.overlay.querySelector('.lyricsio-overlay-current');
    const nextEl = this.overlay.querySelector('.lyricsio-overlay-next');
    
    if (currentEl) {
      const newText = currentLine?.text || '♪ ♪ ♪';
      if (currentEl.textContent !== newText) {
        currentEl.style.animation = 'none';
        currentEl.offsetHeight; // Trigger reflow
        currentEl.style.animation = 'lyricsio-fadeIn 0.3s ease';
        currentEl.textContent = newText;
      }
    }
    
    if (nextEl) {
      nextEl.textContent = nextLine?.text || '';
    }
  }

  // Handle generate button click
  async handleGenerateClick() {
    // Block if currently fetching from API
    if (this.isFetching) {
      this.updateStatus('Wait for API fetch to complete...', true);
      return;
    }
    
    if (this.isRecording) {
      this.stopRecording();
    } else {
      // Always start recording - user wants new/fresh lyrics
      this.startRecording();
    }
  }

  // Clear generated lyrics from storage
  async clearGeneratedLyrics() {
    const videoId = this.getVideoId();
    if (!videoId) return;
    
    const key = `generated_lyrics_${videoId}`;
    await chrome.storage.local.remove(key);
  }

  // Start recording audio from the video
  async startRecording() {
    const video = document.querySelector('video');
    if (!video) {
      this.updateStatus('No video found', true);
      return;
    }

    try {
      // Get video duration and current position
      const videoDuration = video.duration;
      let currentTime = video.currentTime;
      
      // If more than 10 seconds in, seek to beginning for complete lyrics
      if (currentTime > 10) {
        video.currentTime = 0;
        currentTime = 0;
        // Small delay to let seek complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const remainingTime = videoDuration - currentTime;
      
      // Make sure video is playing
      if (video.paused) {
        video.play();
      }
      
      // Calculate recording duration (record remaining song time, max 10 minutes)
      const maxRecordTime = 10 * 60 * 1000; // 10 minutes max
      this.recordDuration = Math.min(remainingTime * 1000, maxRecordTime);
      this.recordStartTime = Date.now();
      
      // Create audio context only if needed, or reuse existing
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioContext();
        this.audioSource = this.audioContext.createMediaElementSource(video);
        this.audioDestination = this.audioContext.createMediaStreamDestination();
        this.audioSource.connect(this.audioDestination);
        this.audioSource.connect(this.audioContext.destination); // Keep audio playing
      } else if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.mediaRecorder = new MediaRecorder(this.audioDestination.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };
      
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      
      // Update UI
      this.updateGenerateButton(true);
      this.showRecordingOverlay(true, remainingTime);
      
      // Format expected duration
      const expectedMins = Math.floor(remainingTime / 60);
      const expectedSecs = Math.floor(remainingTime % 60);
      this.updateStatus(`🔴 Recording full song... (~${expectedMins}:${expectedSecs.toString().padStart(2, '0')} remaining)`);
      
      // Progress timer - update every second
      this.progressInterval = setInterval(() => {
        if (!this.isRecording) return;
        const elapsed = Math.floor((Date.now() - this.recordStartTime) / 1000);
        const total = Math.floor(this.recordDuration / 1000);
        const remaining = total - elapsed;
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        this.updateStatus(`🔴 Recording... ${mins}:${secs.toString().padStart(2, '0')} remaining (click to stop early)`);
        this.updateRecordingProgress(elapsed, total);
        
        // Stop 1 second early to avoid losing content on page navigation
        if (remaining <= 1 && this.isRecording) {
          this.stopRecording();
        }
      }, 1000);
      
      // Auto-stop when song ends (or max time reached) - backup safety net
      this.recordingTimeout = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.recordDuration - 1000); // Stop 1 second early
      
      // Also stop recording if video ends
      this.videoEndHandler = () => {
        if (this.isRecording) {
          this.stopRecording();
        }
      };
      video.addEventListener('ended', this.videoEndHandler);
      
    } catch (error) {
      console.error('LyricsIO: Recording error:', error);
      this.updateStatus('Could not capture audio. Try refreshing.', true);
    }
  }

  // Stop recording and process
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearTimeout(this.recordingTimeout);
      clearInterval(this.progressInterval);
      this.updateGenerateButton(false);
      this.showRecordingOverlay(false);
      this.panel.classList.remove('lyricsio-recording');
      
      // Pause the video when stopping recording
      const video = document.querySelector('video');
      if (video) {
        video.pause();
        
        // Remove video end listener
        if (this.videoEndHandler) {
          video.removeEventListener('ended', this.videoEndHandler);
          this.videoEndHandler = null;
        }
      }
    }
  }

  // Show/hide recording overlay on lyrics panel
  showRecordingOverlay(show, totalSeconds = 0) {
    const content = this.panel.querySelector('.lyricsio-content');
    if (!content) return;
    
    // Remove existing overlay
    const existing = content.querySelector('.lyricsio-recording-overlay');
    if (existing) existing.remove();
    
    // Toggle recording class for expanded height
    if (show) {
      this.panel.classList.add('lyricsio-recording');
    } else {
      this.panel.classList.remove('lyricsio-recording');
    }
    
    if (show) {
      const mins = Math.floor(totalSeconds / 60);
      const secs = Math.floor(totalSeconds % 60);
      
      const overlay = document.createElement('div');
      overlay.className = 'lyricsio-recording-overlay';
      overlay.innerHTML = `
        <div class="lyricsio-recording-pulse">
          <div class="lyricsio-recording-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
        </div>
        <div class="lyricsio-recording-title">${t('aiListening', this.language)}</div>
        <div class="lyricsio-recording-subtitle">${t('recordingForLyrics', this.language)}</div>
        <div class="lyricsio-recording-timer">
          <span class="lyricsio-recording-elapsed">0:00</span>
          <span class="lyricsio-recording-separator"> / </span>
          <span class="lyricsio-recording-total">${mins}:${secs.toString().padStart(2, '0')}</span>
        </div>
        <div class="lyricsio-recording-progress">
          <div class="lyricsio-recording-progress-bar"></div>
        </div>
        <div class="lyricsio-recording-warning">${t('dontCloseTab', this.language)}</div>
        <button class="lyricsio-recording-stop">${t('stopRecording', this.language)}</button>
      `;
      
      content.appendChild(overlay);
      
      // Add stop button handler
      overlay.querySelector('.lyricsio-recording-stop').addEventListener('click', () => {
        this.stopRecording();
      });
    }
  }

  // Update recording progress
  updateRecordingProgress(elapsed, total) {
    const overlay = this.panel.querySelector('.lyricsio-recording-overlay');
    if (!overlay) return;
    
    const elapsedEl = overlay.querySelector('.lyricsio-recording-elapsed');
    const progressBar = overlay.querySelector('.lyricsio-recording-progress-bar');
    
    if (elapsedEl) {
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      elapsedEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    if (progressBar) {
      const percent = Math.min((elapsed / total) * 100, 100);
      progressBar.style.width = `${percent}%`;
    }
  }

  // Process the recorded audio
  async processRecording() {
    if (this.audioChunks.length === 0) {
      this.updateStatus('No audio recorded', true);
      return;
    }

    this.updateStatus('🔄 Processing audio...');
    
    try {
      // Combine chunks into blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      this.updateStatus('🎵 Transcribing lyrics with AI...');
      
      // Send to background for transcription
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSCRIBE_AUDIO',
        audioBlob: audioBase64
      });

      if (response.success) {
        // Format the transcription into lyrics with timestamps
        const { formatted, syncedLyrics } = this.formatTranscription(response.transcription);
        this.generatedLyrics = {
          formatted,
          syncedLyrics,
          raw: response.transcription,
          timestamp: Date.now()
        };
        
        // Save locally
        await this.saveGeneratedLyrics(this.generatedLyrics);
        
        // Show source toggle and switch to generated
        this.showSourceToggle();
        this.switchLyricsSource('generated');
        
        // Enable karaoke overlay if we have synced lyrics
        if (syncedLyrics) {
          this.updateStatus('✅ Synced lyrics ready for karaoke!');
        } else {
          this.updateStatus('✅ Lyrics generated and saved!');
        }
      } else {
        this.updateStatus('Transcription failed: ' + response.error, true);
      }
    } catch (error) {
      console.error('LyricsIO: Processing error:', error);
      this.updateStatus('Error processing audio', true);
    }
  }

  // Format transcription into lyrics format with LRC timestamps
  formatTranscription(transcription) {
    const songInfo = this.getSongInfo();
    let lyrics = `🎵 ${songInfo.title}${songInfo.artist ? ` - ${songInfo.artist}` : ''}\n\n`;
    lyrics += '[AI Generated from Audio]\n\n';
    
    // Build synced LRC format
    let syncedLyrics = '';
    
    // Add metadata to LRC
    syncedLyrics += `[ti:${songInfo.title}]\n`;
    if (songInfo.artist) syncedLyrics += `[ar:${songInfo.artist}]\n`;
    syncedLyrics += `[by:LyricsIO AI]\n\n`;
    
    if (transcription.segments && transcription.segments.length > 0) {
      // Group segments into verse-like chunks for display
      let currentChunk = [];
      let chunkCount = 0;
      
      transcription.segments.forEach((segment, i) => {
        const text = segment.text.trim();
        if (!text) return;
        
        // Add to LRC with timestamp
        const timestamp = this.formatLRCTimestamp(segment.start);
        syncedLyrics += `${timestamp}${text}\n`;
        
        // Also build the formatted display version
        currentChunk.push(text);
        
        // Create a new section every 4-6 lines or on long pauses
        const nextSegment = transcription.segments[i + 1];
        const hasLongPause = nextSegment && (nextSegment.start - segment.end) > 2;
        
        if (currentChunk.length >= 4 || hasLongPause || i === transcription.segments.length - 1) {
          if (currentChunk.length > 0) {
            chunkCount++;
            lyrics += `[Section ${chunkCount}]\n`;
            lyrics += currentChunk.join('\n') + '\n\n';
            currentChunk = [];
          }
        }
      });
    } else if (transcription.text) {
      // Simple text output - split into lines (no sync available)
      const sentences = transcription.text.match(/[^.!?]+[.!?]+/g) || [transcription.text];
      sentences.forEach((sentence, i) => {
        const text = sentence.trim();
        lyrics += text + '\n';
        if ((i + 1) % 4 === 0) lyrics += '\n';
      });
      syncedLyrics = ''; // No timestamps available
    }
    
    lyrics += '\n— Generated by AI (may not be 100% accurate)';
    
    return {
      formatted: lyrics,
      syncedLyrics: syncedLyrics || null
    };
  }

  // Convert seconds to LRC timestamp format [mm:ss.xx]
  formatLRCTimestamp(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toFixed(2).padStart(5, '0');
    return `[${mm}:${ss}]`;
  }

  // Save generated lyrics to local storage
  async saveGeneratedLyrics(lyrics) {
    const videoId = this.getVideoId();
    if (!videoId) return;
    
    await chrome.runtime.sendMessage({
      type: 'SAVE_GENERATED_LYRICS',
      videoId,
      lyrics
    });
  }

  // Load generated lyrics from local storage
  async loadGeneratedLyrics() {
    const videoId = this.getVideoId();
    if (!videoId) return null;
    
    const response = await chrome.runtime.sendMessage({
      type: 'GET_GENERATED_LYRICS',
      videoId
    });
    
    return response.success ? response.lyrics : null;
  }

  // Publish generated lyrics to LRCLIB
  async publishLyrics() {
    if (!this.generatedLyrics) {
      this.updateStatus('No generated lyrics to publish', true);
      return;
    }

    const publishBtn = this.panel.querySelector('.lyricsio-publish-btn');
    if (!publishBtn) return;

    // Get video info
    const video = document.querySelector('video');
    const duration = video ? Math.round(video.duration) : 0;
    const songInfo = this.getSongInfo();

    if (!songInfo.title || !duration) {
      this.updateStatus('Could not get song info for publishing', true);
      return;
    }

    // Show loading state
    const originalContent = publishBtn.innerHTML;
    publishBtn.innerHTML = '<span class="lyricsio-spinner"></span> Publishing...';
    publishBtn.disabled = true;

    try {
      // Extract plain lyrics (remove headers/formatting)
      let plainLyrics = this.generatedLyrics.formatted || '';
      // Remove the song title header and "[AI Generated from Audio]" line
      plainLyrics = plainLyrics.replace(/^🎵.*\n\n/m, '');
      plainLyrics = plainLyrics.replace(/\[AI Generated from Audio\]\n\n/m, '');
      // Remove section markers like [Section 1], [Verse 1], etc.
      plainLyrics = plainLyrics.replace(/\[Section \d+\]\n?/g, '');
      plainLyrics = plainLyrics.replace(/\[(Verse|Chorus|Bridge|Outro|Intro).*?\]\n?/gi, '');
      plainLyrics = plainLyrics.trim();

      // Get synced lyrics (LRC format) - remove metadata lines
      let syncedLyrics = this.generatedLyrics.syncedLyrics || '';
      // Remove metadata lines like [ti:...], [ar:...], [by:...]
      syncedLyrics = syncedLyrics.replace(/^\[(ti|ar|al|by|offset):.*\]\n/gm, '');
      syncedLyrics = syncedLyrics.trim();

      const response = await chrome.runtime.sendMessage({
        type: 'PUBLISH_LYRICS',
        trackInfo: {
          trackName: songInfo.title,
          artistName: songInfo.artist || 'Unknown',
          albumName: songInfo.artist || 'Unknown', // Use artist as album fallback
          duration: duration,
          plainLyrics: plainLyrics,
          syncedLyrics: syncedLyrics
        }
      });

      if (response.success) {
        this.updateStatus('✅ Lyrics published to LRCLIB! Thank you for contributing!');
        publishBtn.innerHTML = '✓ Published';
        publishBtn.classList.add('published');
      } else {
        throw new Error(response.error || 'Failed to publish');
      }
    } catch (error) {
      console.error('LyricsIO: Publish error:', error);
      this.updateStatus('Failed to publish: ' + error.message, true);
      publishBtn.innerHTML = originalContent;
      publishBtn.disabled = false;
    }
  }

  // Show/hide source toggle
  showSourceToggle() {
    const toggle = this.panel.querySelector('.lyricsio-source-toggle');
    if (toggle) {
      toggle.style.display = 'flex';
      
      // Update AI Generated button to show if synced
      const generatedBtn = toggle.querySelector('[data-source="generated"]');
      if (generatedBtn && this.generatedLyrics?.syncedLyrics) {
        generatedBtn.innerHTML = t('aiKaraoke', this.language);
        generatedBtn.title = t('aiGenerated', this.language);
      }

      // Show publish button when generated lyrics exist
      const publishBtn = toggle.querySelector('.lyricsio-publish-btn');
      if (publishBtn && this.generatedLyrics) {
        publishBtn.style.display = 'flex';
        // Reset state if previously published
        if (!publishBtn.classList.contains('published')) {
          publishBtn.disabled = false;
        }
      }
    }
  }

  // Switch between API and generated lyrics
  switchLyricsSource(source) {
    this.currentLyricsSource = source;
    
    // Update button states
    this.panel.querySelectorAll('.lyricsio-source-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.source === source);
    });
    
    // Display the appropriate lyrics
    if (source === 'generated' && this.generatedLyrics) {
      this.displayLyrics(this.generatedLyrics.formatted);
      
      // Enable karaoke overlay if we have synced lyrics
      if (this.generatedLyrics.syncedLyrics && this.settings.showOverlay) {
        this.syncedLyrics = this.generatedLyrics.syncedLyrics;
        this.parsedLyrics = this.parseLRC(this.syncedLyrics);
        this.startLyricsSync();
        this.showSyncStatus(true);
      } else {
        this.stopLyricsSync();
        this.showSyncStatus(false);
      }
    } else if (source === 'api' && this.apiLyrics) {
      this.showLyrics(this.apiLyrics);
    }
  }

  // Display lyrics without processing (for switching)
  displayLyrics(lyricsText) {
    const content = this.panel.querySelector('.lyricsio-content');
    const formattedLyrics = this.formatLyrics(lyricsText);
    content.innerHTML = `
      <div class="lyricsio-lyrics">
        ${formattedLyrics}
      </div>
    `;
  }

  // Update generate button state
  updateGenerateButton(isRecording) {
    const btn = this.panel.querySelector('.lyricsio-generate-btn');
    if (btn) {
      if (isRecording) {
        btn.classList.add('recording');
        btn.classList.remove('disabled');
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
          <span>Stop</span>
        `;
      } else {
        btn.classList.remove('recording');
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          <span>Generate</span>
        `;
      }
    }
  }

  // Update generate button disabled state (during API fetch)
  updateGenerateButtonState() {
    const btn = this.panel.querySelector('.lyricsio-generate-btn');
    if (btn) {
      if (this.isFetching) {
        btn.classList.add('disabled');
        btn.disabled = true;
        btn.title = 'Wait for lyrics to load...';
      } else {
        btn.classList.remove('disabled');
        btn.disabled = false;
        btn.title = 'Generate lyrics from audio';
      }
    }
  }

  // Update status text
  updateStatus(message, isError = false) {
    const status = this.panel.querySelector('.lyricsio-status');
    if (status) {
      status.textContent = message;
      status.style.color = isError ? '#ff6b6b' : '';
    }
  }

  formatLyrics(lyrics) {
    // Convert plain text to HTML with proper formatting
    return lyrics
      .split('\n')
      .map(line => {
        // Style section headers
        if (line.match(/^\[.*\]$/)) {
          return `<div class="lyricsio-section">${line}</div>`;
        }
        // Style the song title line
        if (line.startsWith('🎵')) {
          return `<div class="lyricsio-title-line">${line}</div>`;
        }
        // Empty lines become spacing
        if (line.trim() === '') {
          return '<div class="lyricsio-spacer"></div>';
        }
        // Regular lyrics lines
        return `<div class="lyricsio-line">${line}</div>`;
      })
      .join('');
  }

  showError(message) {
    const content = this.panel.querySelector('.lyricsio-content');
    content.innerHTML = `
      <div class="lyricsio-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>${message}</p>
        <button class="lyricsio-retry-btn">Try Again</button>
      </div>
    `;

    content.querySelector('.lyricsio-retry-btn')?.addEventListener('click', () => {
      this.fetchLyricsForCurrentVideo();
    });
  }
}

// Initialize LyricsIO when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new LyricsIO());
} else {
  new LyricsIO();
}
