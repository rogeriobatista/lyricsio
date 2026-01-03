document.addEventListener('DOMContentLoaded', async () => {
  const autoDetectToggle = document.getElementById('autoDetect');
  const showPanelToggle = document.getElementById('showPanel');
  const darkThemeToggle = document.getElementById('darkTheme');
  const showOverlayToggle = document.getElementById('showOverlay');
  const saveBtn = document.getElementById('saveBtn');
  const fetchLyricsBtn = document.getElementById('fetchLyricsBtn');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  const settings = await chrome.storage.sync.get([
    'autoDetect',
    'showPanel',
    'darkTheme',
    'showOverlay'
  ]);

  if (settings.autoDetect !== undefined) autoDetectToggle.checked = settings.autoDetect;
  if (settings.showPanel !== undefined) showPanelToggle.checked = settings.showPanel;
  if (settings.darkTheme !== undefined) darkThemeToggle.checked = settings.darkTheme;
  if (settings.showOverlay !== undefined) showOverlayToggle.checked = settings.showOverlay;

  // Show status message
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + (isError ? 'error' : 'success');
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 3000);
  }

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const settings = {
      autoDetect: autoDetectToggle.checked,
      showPanel: showPanelToggle.checked,
      darkTheme: darkThemeToggle.checked,
      showOverlay: showOverlayToggle.checked
    };

    await chrome.storage.sync.set(settings);
    showStatus('Settings saved successfully!');

    // Notify content script of settings change
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url?.includes('youtube.com')) {
      chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings });
    }
  });

  // Fetch lyrics for current video
  fetchLyricsBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url?.includes('youtube.com/watch')) {
      showStatus('Please open a YouTube video first', true);
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'FETCH_LYRICS' });
      if (response && response.success) {
        showStatus('Lyrics panel opened! Check the YouTube page.');
      } else {
        showStatus('Fetching lyrics... Check the YouTube page.');
      }
    } catch (error) {
      // Content script might not be loaded, try reloading the tab
      showStatus('Please refresh the YouTube page and try again', true);
    }
  });
});
