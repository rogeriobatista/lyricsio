document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const autoDetectToggle = document.getElementById('autoDetect');
  const showPanelToggle = document.getElementById('showPanel');
  const darkThemeToggle = document.getElementById('darkTheme');
  const saveBtn = document.getElementById('saveBtn');
  const fetchLyricsBtn = document.getElementById('fetchLyricsBtn');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  const settings = await chrome.storage.sync.get([
    'apiKey',
    'autoDetect',
    'showPanel',
    'darkTheme'
  ]);

  if (settings.apiKey) apiKeyInput.value = settings.apiKey;
  if (settings.autoDetect !== undefined) autoDetectToggle.checked = settings.autoDetect;
  if (settings.showPanel !== undefined) showPanelToggle.checked = settings.showPanel;
  if (settings.darkTheme !== undefined) darkThemeToggle.checked = settings.darkTheme;

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
      apiKey: apiKeyInput.value.trim(),
      autoDetect: autoDetectToggle.checked,
      showPanel: showPanelToggle.checked,
      darkTheme: darkThemeToggle.checked
    };

    if (!settings.apiKey) {
      showStatus('Please enter your OpenAI API key', true);
      return;
    }

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

    if (!apiKeyInput.value.trim()) {
      showStatus('Please enter your API key first', true);
      return;
    }

    // Save API key if not saved
    await chrome.storage.sync.set({ apiKey: apiKeyInput.value.trim() });

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
