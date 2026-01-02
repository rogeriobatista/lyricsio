// LyricsIO Content Script - Runs on YouTube pages

class LyricsIO {
  constructor() {
    this.panel = null;
    this.currentVideoId = null;
    this.settings = {
      autoDetect: true,
      showPanel: true,
      darkTheme: true
    };
    this.isMinimized = false;
    this.init();
  }

  async init() {
    // Load settings
    const stored = await chrome.storage.sync.get(['autoDetect', 'showPanel', 'darkTheme']);
    this.settings = { ...this.settings, ...stored };

    // Create the lyrics panel
    this.createPanel();

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
        this.updatePanelVisibility();
        sendResponse({ success: true });
      }
      return true;
    });

    // Watch for video changes
    this.observeVideoChanges();

    // Initial check if on a video page
    if (this.isVideoPage()) {
      this.onVideoChange();
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
          <button class="lyricsio-btn lyricsio-refresh" title="Refresh lyrics">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button class="lyricsio-btn lyricsio-minimize" title="Minimize">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button class="lyricsio-btn lyricsio-close" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="lyricsio-song-info">
        <div class="lyricsio-song-title">Detecting song...</div>
      </div>
      <div class="lyricsio-content">
        <div class="lyricsio-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <p>Play a song to see lyrics</p>
        </div>
      </div>
      <div class="lyricsio-footer">
        <span>Powered by AI</span>
      </div>
    `;

    document.body.appendChild(this.panel);

    // Add event listeners
    this.panel.querySelector('.lyricsio-close').addEventListener('click', () => {
      this.panel.classList.add('lyricsio-hidden');
    });

    this.panel.querySelector('.lyricsio-minimize').addEventListener('click', () => {
      this.toggleMinimize();
    });

    this.panel.querySelector('.lyricsio-refresh').addEventListener('click', () => {
      this.fetchLyricsForCurrentVideo();
    });

    // Make panel draggable
    this.makeDraggable();

    // Update visibility based on settings
    this.updatePanelVisibility();
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

  observeVideoChanges() {
    // Watch for URL changes (SPA navigation)
    let lastUrl = location.href;
    
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        this.onVideoChange();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Also listen for popstate events
    window.addEventListener('popstate', () => this.onVideoChange());
    window.addEventListener('yt-navigate-finish', () => this.onVideoChange());
  }

  onVideoChange() {
    this.updatePanelVisibility();

    if (!this.isVideoPage()) {
      this.panel?.classList.add('lyricsio-hidden');
      return;
    }

    const videoId = this.getVideoId();
    if (videoId && videoId !== this.currentVideoId) {
      this.currentVideoId = videoId;
      
      if (this.settings.autoDetect) {
        // Wait for page to load video title
        setTimeout(() => this.fetchLyricsForCurrentVideo(), 1500);
      }
    }
  }

  getSongInfo() {
    // Try to get song info from YouTube's video title
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata');
    let title = titleElement?.textContent?.trim() || document.title.replace(' - YouTube', '');

    // Try to get artist from channel name
    const channelElement = document.querySelector('#channel-name a, ytd-channel-name a');
    let artist = channelElement?.textContent?.trim() || '';

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

    return { title, artist };
  }

  async fetchLyricsForCurrentVideo() {
    if (!this.panel) {
      this.createPanel();
    }

    const songInfo = this.getSongInfo();
    console.log('LyricsIO: Fetching lyrics for:', songInfo);
    
    // Update UI to show loading
    this.updateSongInfo(songInfo);
    this.showLoading();

    try {
      // Get API key from storage
      const { apiKey } = await chrome.storage.sync.get('apiKey');
      
      if (!apiKey) {
        this.showError('Please set your Groq API key in the extension settings (click the extension icon)');
        return;
      }

      console.log('LyricsIO: Sending request to background script...');

      // Request lyrics from background script
      const response = await chrome.runtime.sendMessage({
        type: 'GET_LYRICS',
        songInfo,
        apiKey
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

  showLyrics(lyrics) {
    const content = this.panel.querySelector('.lyricsio-content');
    
    // Format lyrics with proper line breaks and styling
    const formattedLyrics = this.formatLyrics(lyrics);
    
    content.innerHTML = `
      <div class="lyricsio-lyrics">
        ${formattedLyrics}
      </div>
    `;
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
