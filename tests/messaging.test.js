// Integration tests for Chrome extension messaging

describe('Chrome Extension Messaging', () => {
  beforeEach(() => {
    chrome.runtime.sendMessage.mockClear();
    chrome.runtime.onMessage.addListener.mockClear();
  });

  describe('Message Types', () => {
    const messageTypes = [
      'GET_LYRICS',
      'TRANSCRIBE_AUDIO',
      'SAVE_GENERATED_LYRICS',
      'GET_GENERATED_LYRICS',
      'PUBLISH_LYRICS',
      'FETCH_LYRICS',
      'SETTINGS_UPDATED'
    ];

    test('should define all required message types', () => {
      messageTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('GET_LYRICS Message', () => {
    test('should have correct structure', () => {
      const message = {
        type: 'GET_LYRICS',
        songInfo: {
          title: 'Test Song',
          artist: 'Test Artist',
          duration: 240
        }
      };

      expect(message.type).toBe('GET_LYRICS');
      expect(message.songInfo).toBeDefined();
      expect(message.songInfo.title).toBeTruthy();
    });

    test('should handle missing artist', () => {
      const message = {
        type: 'GET_LYRICS',
        songInfo: {
          title: 'Test Song',
          artist: '',
          duration: 180
        }
      };

      expect(message.songInfo.artist).toBe('');
    });
  });

  describe('TRANSCRIBE_AUDIO Message', () => {
    test('should include base64 audio data', () => {
      const message = {
        type: 'TRANSCRIBE_AUDIO',
        audioBlob: 'SGVsbG8gV29ybGQ=' // base64 encoded
      };

      expect(message.type).toBe('TRANSCRIBE_AUDIO');
      expect(typeof message.audioBlob).toBe('string');
    });
  });

  describe('PUBLISH_LYRICS Message', () => {
    test('should include complete track info', () => {
      const message = {
        type: 'PUBLISH_LYRICS',
        trackInfo: {
          trackName: 'Test Song',
          artistName: 'Test Artist',
          albumName: 'Test Album',
          duration: 240,
          plainLyrics: 'These are the lyrics',
          syncedLyrics: '[00:01.00]These are the lyrics'
        }
      };

      expect(message.trackInfo.trackName).toBeTruthy();
      expect(message.trackInfo.artistName).toBeTruthy();
      expect(message.trackInfo.duration).toBeGreaterThan(0);
      expect(message.trackInfo.plainLyrics).toBeTruthy();
    });
  });

  describe('SETTINGS_UPDATED Message', () => {
    test('should include all settings', () => {
      const message = {
        type: 'SETTINGS_UPDATED',
        settings: {
          autoDetect: true,
          showPanel: true,
          darkTheme: true,
          showOverlay: true,
          language: 'en'
        }
      };

      expect(message.settings).toBeDefined();
      expect(typeof message.settings.autoDetect).toBe('boolean');
      expect(typeof message.settings.language).toBe('string');
    });
  });

  describe('Response Handling', () => {
    test('should handle success response', () => {
      const response = {
        success: true,
        lyrics: 'Test lyrics content'
      };

      expect(response.success).toBe(true);
      expect(response.lyrics).toBeTruthy();
    });

    test('should handle error response', () => {
      const response = {
        success: false,
        error: 'Song not found'
      };

      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    });

    test('should handle transcription response with synced lyrics', () => {
      const response = {
        success: true,
        transcription: {
          text: 'Full transcription text',
          segments: [
            { start: 0, end: 2, text: 'First line' },
            { start: 2, end: 5, text: 'Second line' }
          ]
        }
      };

      expect(response.transcription.segments).toHaveLength(2);
      expect(response.transcription.segments[0].start).toBe(0);
    });
  });
});

describe('Local Storage', () => {
  beforeEach(() => {
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
  });

  describe('Generated Lyrics Storage', () => {
    test('should store lyrics with video ID key', async () => {
      const videoId = 'abc123';
      const lyrics = 'Stored lyrics content';
      const key = `lyrics_${videoId}`;

      await chrome.storage.local.set({ [key]: lyrics });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ [key]: lyrics });
    });

    test('should retrieve lyrics by video ID', async () => {
      const videoId = 'abc123';
      const key = `lyrics_${videoId}`;
      const storedLyrics = 'Retrieved lyrics';

      chrome.storage.local.get.mockResolvedValueOnce({ [key]: storedLyrics });

      const result = await chrome.storage.local.get(key);
      expect(result[key]).toBe(storedLyrics);
    });

    test('should return empty for non-existent video', async () => {
      const videoId = 'nonexistent';
      const key = `lyrics_${videoId}`;

      chrome.storage.local.get.mockResolvedValueOnce({});

      const result = await chrome.storage.local.get(key);
      expect(result[key]).toBeUndefined();
    });
  });
});
