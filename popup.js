document.addEventListener('DOMContentLoaded', async () => {
  const autoDetectToggle = document.getElementById('autoDetect');
  const showPanelToggle = document.getElementById('showPanel');
  const darkThemeToggle = document.getElementById('darkTheme');
  const showOverlayToggle = document.getElementById('showOverlay');
  const languageSelect = document.getElementById('languageSelect');
  const saveBtn = document.getElementById('saveBtn');
  const fetchLyricsBtn = document.getElementById('fetchLyricsBtn');
  const statusDiv = document.getElementById('status');

  let currentLanguage = 'en';

  // Apply translations to all elements with data-i18n attribute
  function applyTranslations(lang) {
    currentLanguage = lang;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = t(key, lang);
      if (translation) {
        element.textContent = translation;
      }
    });
  }

  // Load saved settings
  const settings = await chrome.storage.sync.get([
    'autoDetect',
    'showPanel',
    'darkTheme',
    'showOverlay',
    'language'
  ]);

  // Determine language: saved > browser detection > default (en)
  if (settings.language) {
    currentLanguage = settings.language;
  } else {
    currentLanguage = detectBrowserLanguage();
    // Save detected language
    await chrome.storage.sync.set({ language: currentLanguage });
  }

  // Set language dropdown value
  languageSelect.value = currentLanguage;
  
  // Apply translations
  applyTranslations(currentLanguage);

  if (settings.autoDetect !== undefined) autoDetectToggle.checked = settings.autoDetect;
  if (settings.showPanel !== undefined) showPanelToggle.checked = settings.showPanel;
  if (settings.darkTheme !== undefined) darkThemeToggle.checked = settings.darkTheme;
  if (settings.showOverlay !== undefined) showOverlayToggle.checked = settings.showOverlay;

  // Handle language change
  languageSelect.addEventListener('change', () => {
    applyTranslations(languageSelect.value);
  });

  // Show status message
  function showStatus(messageKey, isError = false, isRawMessage = false) {
    const message = isRawMessage ? messageKey : t(messageKey, currentLanguage) || messageKey;
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + (isError ? 'error' : 'success');
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 3000);
  }

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const newSettings = {
      autoDetect: autoDetectToggle.checked,
      showPanel: showPanelToggle.checked,
      darkTheme: darkThemeToggle.checked,
      showOverlay: showOverlayToggle.checked,
      language: languageSelect.value
    };

    await chrome.storage.sync.set(newSettings);
    showStatus('settingsSaved');

    // Notify content script of settings change
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url?.includes('youtube.com')) {
      chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings: newSettings });
    }
  });

  // Fetch lyrics for current video
  fetchLyricsBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url?.includes('youtube.com/watch')) {
      showStatus('openYouTubeFirst', true);
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'FETCH_LYRICS' });
      if (response && response.success) {
        showStatus('lyricsOpened');
      } else {
        showStatus('fetchingLyrics');
      }
    } catch (error) {
      // Content script might not be loaded, try reloading the tab
      showStatus('refreshPage', true);
    }
  });
});
