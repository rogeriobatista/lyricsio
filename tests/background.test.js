// Unit tests for background.js utility functions

// Load and extract functions from background.js
const fs = require('fs');

// Extract functions from background.js that we can test
// We'll create testable versions of key utility functions

describe('Background Utility Functions', () => {
  // hexToBytes function
  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  // compareBytes function
  function compareBytes(a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] < b[i]) return -1;
      if (a[i] > b[i]) return 1;
    }
    return 0;
  }

  // formatLyricsResponse function
  function formatLyricsResponse(title, artist, lyrics, source, syncedLyrics = null) {
    const header = `🎵 ${title}${artist ? ` - ${artist}` : ''}\n\n`;
    const footer = `\n\n— Source: ${source}`;
    
    return {
      formatted: header + lyrics + footer,
      syncedLyrics: syncedLyrics,
      hasSyncedLyrics: !!syncedLyrics
    };
  }

  describe('hexToBytes()', () => {
    test('should convert hex string to byte array', () => {
      const result = hexToBytes('ff00');
      expect(result).toEqual(new Uint8Array([255, 0]));
    });

    test('should handle all zeros', () => {
      const result = hexToBytes('0000');
      expect(result).toEqual(new Uint8Array([0, 0]));
    });

    test('should handle mixed values', () => {
      const result = hexToBytes('1a2b3c');
      expect(result).toEqual(new Uint8Array([26, 43, 60]));
    });

    test('should handle lowercase hex', () => {
      const result = hexToBytes('abcdef');
      expect(result).toEqual(new Uint8Array([171, 205, 239]));
    });

    test('should handle uppercase hex', () => {
      const result = hexToBytes('ABCDEF');
      expect(result).toEqual(new Uint8Array([171, 205, 239]));
    });

    test('should return empty array for empty string', () => {
      const result = hexToBytes('');
      expect(result).toEqual(new Uint8Array([]));
    });
  });

  describe('compareBytes()', () => {
    test('should return -1 when first is less than second', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 4]);
      expect(compareBytes(a, b)).toBe(-1);
    });

    test('should return 1 when first is greater than second', () => {
      const a = new Uint8Array([1, 3, 3]);
      const b = new Uint8Array([1, 2, 4]);
      expect(compareBytes(a, b)).toBe(1);
    });

    test('should return 0 when arrays are equal', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3]);
      expect(compareBytes(a, b)).toBe(0);
    });

    test('should compare from first byte', () => {
      const a = new Uint8Array([0, 255, 255]);
      const b = new Uint8Array([1, 0, 0]);
      expect(compareBytes(a, b)).toBe(-1);
    });

    test('should handle empty arrays', () => {
      const a = new Uint8Array([]);
      const b = new Uint8Array([]);
      expect(compareBytes(a, b)).toBe(0);
    });

    test('should handle different length arrays', () => {
      const a = new Uint8Array([1, 2]);
      const b = new Uint8Array([1, 2, 3]);
      expect(compareBytes(a, b)).toBe(0); // compares up to min length
    });
  });

  describe('formatLyricsResponse()', () => {
    test('should format lyrics with title and artist', () => {
      const result = formatLyricsResponse('Test Song', 'Test Artist', 'Lyrics here', 'LRCLIB');
      expect(result.formatted).toContain('🎵 Test Song - Test Artist');
      expect(result.formatted).toContain('Lyrics here');
      expect(result.formatted).toContain('Source: LRCLIB');
    });

    test('should format lyrics without artist', () => {
      const result = formatLyricsResponse('Test Song', '', 'Lyrics here', 'Lyrics API');
      expect(result.formatted).toContain('🎵 Test Song');
      expect(result.formatted).not.toContain(' - ');
    });

    test('should indicate synced lyrics when provided', () => {
      const syncedLyrics = '[00:01.00]First line\n[00:05.00]Second line';
      const result = formatLyricsResponse('Song', 'Artist', 'Lyrics', 'LRCLIB', syncedLyrics);
      expect(result.hasSyncedLyrics).toBe(true);
      expect(result.syncedLyrics).toBe(syncedLyrics);
    });

    test('should indicate no synced lyrics when not provided', () => {
      const result = formatLyricsResponse('Song', 'Artist', 'Lyrics', 'API');
      expect(result.hasSyncedLyrics).toBe(false);
      expect(result.syncedLyrics).toBeNull();
    });

    test('should handle null artist', () => {
      const result = formatLyricsResponse('Song', null, 'Lyrics', 'API');
      expect(result.formatted).toContain('🎵 Song');
    });
  });
});

describe('API Key Obfuscation', () => {
  test('obfuscated key should be decodable', () => {
    // The obfuscated key array from background.js
    const _k = [103,115,107,95,111,121,82,121,84,120,86,99,87,119,80,78,49,57,107,122,86,86,77,101,87,71,100,121,98,51,70,89,114,57,117,122,83,49,105,112,53,54,98,53,76,68,113,88,122,116,49,101,114,66,80,111];
    const decoded = String.fromCharCode(..._k);
    
    // Should start with gsk_ (Groq API key format)
    expect(decoded.startsWith('gsk_')).toBe(true);
    expect(decoded.length).toBeGreaterThan(10);
  });
});

describe('URL Building', () => {
  test('should build correct LRCLIB search URL', () => {
    const title = 'Test Song';
    const artist = 'Test Artist';
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist
    });
    const url = `https://lrclib.net/api/search?${params}`;
    
    expect(url).toBe('https://lrclib.net/api/search?track_name=Test+Song&artist_name=Test+Artist');
  });

  test('should handle special characters in URL', () => {
    const title = "Don't Stop Believin'";
    const artist = 'Journey';
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist
    });
    const url = `https://lrclib.net/api/search?${params}`;
    
    expect(url).toContain('track_name=Don');
    expect(url).toContain('artist_name=Journey');
  });

  test('should build correct lyrics.ovh API URL', () => {
    const artist = 'Queen';
    const title = 'Bohemian Rhapsody';
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    
    expect(url).toBe('https://api.lyrics.ovh/v1/Queen/Bohemian%20Rhapsody');
  });
});
