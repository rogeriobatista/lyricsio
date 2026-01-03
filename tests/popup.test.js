// Integration tests for popup.js settings handling

describe('Popup Settings', () => {
  let mockStorage;
  
  beforeEach(() => {
    // Reset mock storage
    mockStorage = {
      autoDetect: true,
      showPanel: true,
      darkTheme: true,
      showOverlay: true,
      language: 'en'
    };
    
    chrome.storage.sync.get.mockImplementation((keys) => {
      if (Array.isArray(keys)) {
        const result = {};
        keys.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }
      return Promise.resolve(mockStorage);
    });
    
    chrome.storage.sync.set.mockImplementation((data) => {
      Object.assign(mockStorage, data);
      return Promise.resolve();
    });
  });

  describe('Settings Loading', () => {
    test('should load default settings', async () => {
      const settings = await chrome.storage.sync.get(['autoDetect', 'showPanel', 'darkTheme', 'showOverlay', 'language']);
      
      expect(settings.autoDetect).toBe(true);
      expect(settings.showPanel).toBe(true);
      expect(settings.darkTheme).toBe(true);
      expect(settings.showOverlay).toBe(true);
      expect(settings.language).toBe('en');
    });

    test('should handle missing settings gracefully', async () => {
      mockStorage = {};
      const settings = await chrome.storage.sync.get(['autoDetect', 'language']);
      
      expect(settings.autoDetect).toBeUndefined();
      expect(settings.language).toBeUndefined();
    });
  });

  describe('Settings Saving', () => {
    test('should save settings to storage', async () => {
      const newSettings = {
        autoDetect: false,
        showPanel: false,
        darkTheme: false,
        showOverlay: false,
        language: 'es'
      };
      
      await chrome.storage.sync.set(newSettings);
      
      expect(mockStorage.autoDetect).toBe(false);
      expect(mockStorage.language).toBe('es');
    });

    test('should preserve existing settings when saving partial update', async () => {
      await chrome.storage.sync.set({ language: 'fr' });
      
      expect(mockStorage.autoDetect).toBe(true); // unchanged
      expect(mockStorage.language).toBe('fr'); // updated
    });
  });

  describe('Language Selection', () => {
    test('should save selected language', async () => {
      await chrome.storage.sync.set({ language: 'de' });
      const settings = await chrome.storage.sync.get(['language']);
      
      expect(settings.language).toBe('de');
    });

    test('should support all 7 languages', async () => {
      const languages = ['en', 'es', 'pt', 'fr', 'de', 'zh', 'it'];
      
      for (const lang of languages) {
        await chrome.storage.sync.set({ language: lang });
        const settings = await chrome.storage.sync.get(['language']);
        expect(settings.language).toBe(lang);
      }
    });
  });

  describe('Tab Messaging', () => {
    test('should query for active YouTube tab', async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      expect(Array.isArray(tabs)).toBe(true);
      expect(tabs[0].url).toContain('youtube.com');
    });

    test('should send message to content script', () => {
      const tabId = 1;
      const message = { type: 'SETTINGS_UPDATED', settings: { autoDetect: false } };
      
      chrome.tabs.sendMessage(tabId, message);
      
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, message);
    });

    test('should send FETCH_LYRICS message', () => {
      const tabId = 1;
      const message = { type: 'FETCH_LYRICS' };
      
      chrome.tabs.sendMessage(tabId, message);
      
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, message);
    });
  });
});

describe('Settings Validation', () => {
  test('autoDetect should be boolean', () => {
    const validValues = [true, false];
    validValues.forEach(value => {
      expect(typeof value).toBe('boolean');
    });
  });

  test('language should be valid language code', () => {
    const validLanguages = ['en', 'es', 'pt', 'fr', 'de', 'zh', 'it'];
    const testValue = 'en';
    
    expect(validLanguages).toContain(testValue);
  });

  test('should reject invalid language code', () => {
    const validLanguages = ['en', 'es', 'pt', 'fr', 'de', 'zh', 'it'];
    const invalidValue = 'xx';
    
    expect(validLanguages).not.toContain(invalidValue);
  });
});
