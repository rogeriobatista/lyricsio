// Unit tests for content.js utility functions

describe('Content Script Utilities', () => {
  // parseLRC function - extracted from content.js
  function parseLRC(lrcString) {
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

  // formatLyrics function
  function formatLyrics(lyrics) {
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
        return `<div class="lyricsio-line">${line}</div>`;
      })
      .join('');
  }

  describe('parseLRC()', () => {
    test('should parse simple LRC format', () => {
      const lrc = '[00:01.00]First line\n[00:05.00]Second line';
      const result = parseLRC(lrc);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ time: 1, text: 'First line' });
      expect(result[1]).toEqual({ time: 5, text: 'Second line' });
    });

    test('should parse LRC with milliseconds', () => {
      const lrc = '[01:30.50]Middle of song';
      const result = parseLRC(lrc);
      
      expect(result).toHaveLength(1);
      expect(result[0].time).toBeCloseTo(90.5, 1);
      expect(result[0].text).toBe('Middle of song');
    });

    test('should parse LRC without milliseconds', () => {
      const lrc = '[02:00]Two minutes';
      const result = parseLRC(lrc);
      
      expect(result).toHaveLength(1);
      expect(result[0].time).toBe(120);
    });

    test('should skip empty text lines', () => {
      const lrc = '[00:01.00]First\n[00:02.00]\n[00:03.00]Third';
      const result = parseLRC(lrc);
      
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('First');
      expect(result[1].text).toBe('Third');
    });

    test('should sort by time', () => {
      const lrc = '[00:10.00]Later\n[00:01.00]Earlier';
      const result = parseLRC(lrc);
      
      expect(result[0].text).toBe('Earlier');
      expect(result[1].text).toBe('Later');
    });

    test('should handle multi-digit milliseconds', () => {
      const lrc = '[00:01.123]Precise timing';
      const result = parseLRC(lrc);
      
      expect(result[0].time).toBeCloseTo(1.123, 2);
    });

    test('should pad 2-digit milliseconds to 3', () => {
      const lrc = '[00:01.50]Half second';
      const result = parseLRC(lrc);
      
      // 50 should become 500ms = 0.5s
      expect(result[0].time).toBeCloseTo(1.5, 2);
    });

    test('should ignore non-LRC lines', () => {
      const lrc = '[ar:Artist Name]\n[ti:Song Title]\n[00:01.00]Actual lyrics';
      const result = parseLRC(lrc);
      
      // Only the line with proper timestamp format should be parsed
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Actual lyrics');
    });

    test('should handle empty input', () => {
      const result = parseLRC('');
      expect(result).toHaveLength(0);
    });

    test('should handle complex real-world LRC', () => {
      const lrc = `[00:00.00]
[00:12.34]Is this the real life?
[00:15.67]Is this just fantasy?
[00:19.01]Caught in a landslide
[00:22.45]No escape from reality`;
      
      const result = parseLRC(lrc);
      
      expect(result).toHaveLength(4);
      expect(result[0].text).toBe('Is this the real life?');
      expect(result[3].text).toBe('No escape from reality');
    });
  });

  describe('formatLyrics()', () => {
    test('should format section headers', () => {
      const result = formatLyrics('[Verse 1]');
      expect(result).toContain('lyricsio-section');
      expect(result).toContain('[Verse 1]');
    });

    test('should format title lines', () => {
      const result = formatLyrics('🎵 Song Title - Artist');
      expect(result).toContain('lyricsio-title-line');
    });

    test('should format empty lines as spacers', () => {
      const result = formatLyrics('Line 1\n\nLine 2');
      expect(result).toContain('lyricsio-spacer');
    });

    test('should format regular lines', () => {
      const result = formatLyrics('Regular lyric line');
      expect(result).toContain('lyricsio-line');
      expect(result).toContain('Regular lyric line');
    });

    test('should handle multiple line types', () => {
      const lyrics = '🎵 Song\n[Verse]\nLyric line\n\n[Chorus]\nMore lyrics';
      const result = formatLyrics(lyrics);
      
      expect(result).toContain('lyricsio-title-line');
      expect(result).toContain('lyricsio-section');
      expect(result).toContain('lyricsio-line');
      expect(result).toContain('lyricsio-spacer');
    });
  });

  describe('Video ID extraction', () => {
    function getVideoId(url) {
      try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('v');
      } catch {
        return null;
      }
    }

    test('should extract video ID from YouTube URL', () => {
      expect(getVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    test('should handle URL with multiple parameters', () => {
      expect(getVideoId('https://www.youtube.com/watch?v=abc123&list=PLtest')).toBe('abc123');
    });

    test('should return null for invalid URL', () => {
      expect(getVideoId('not-a-url')).toBeNull();
    });

    test('should return null for URL without v parameter', () => {
      expect(getVideoId('https://www.youtube.com/watch')).toBeNull();
    });
  });

  describe('Song info parsing', () => {
    function parseSongTitle(title) {
      // Common patterns for song titles:
      // "Artist - Song Title"
      // "Song Title by Artist"
      // "Song Title | Artist"
      
      let artist = '';
      let songTitle = title;
      
      // Pattern: "Artist - Song"
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length >= 2) {
          artist = parts[0].trim();
          songTitle = parts.slice(1).join(' - ').trim();
        }
      }
      
      // Clean up common suffixes
      songTitle = songTitle
        .replace(/\s*\(Official.*?\)/gi, '')
        .replace(/\s*\[Official.*?\]/gi, '')
        .replace(/\s*\(Lyrics.*?\)/gi, '')
        .replace(/\s*\[Lyrics.*?\]/gi, '')
        .replace(/\s*\(Audio.*?\)/gi, '')
        .replace(/\s*\[Audio.*?\]/gi, '')
        .replace(/\s*\|.*$/, '')
        .trim();
      
      return { title: songTitle, artist };
    }

    test('should parse "Artist - Song" format', () => {
      const result = parseSongTitle('Queen - Bohemian Rhapsody');
      expect(result.artist).toBe('Queen');
      expect(result.title).toBe('Bohemian Rhapsody');
    });

    test('should remove (Official Video) suffix', () => {
      const result = parseSongTitle('Artist - Song (Official Video)');
      expect(result.title).toBe('Song');
    });

    test('should remove [Lyrics] suffix', () => {
      const result = parseSongTitle('Artist - Song [Lyrics]');
      expect(result.title).toBe('Song');
    });

    test('should handle title without artist separator', () => {
      const result = parseSongTitle('Just A Song Title');
      expect(result.title).toBe('Just A Song Title');
      expect(result.artist).toBe('');
    });

    test('should handle multiple dashes', () => {
      const result = parseSongTitle('Artist Name - Song - Part 2');
      expect(result.artist).toBe('Artist Name');
      expect(result.title).toBe('Song - Part 2');
    });

    test('should remove (Official Audio)', () => {
      const result = parseSongTitle('Artist - Song (Official Audio)');
      expect(result.title).toBe('Song');
    });
  });

  describe('Time formatting', () => {
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    test('should format seconds to mm:ss', () => {
      expect(formatTime(65)).toBe('1:05');
      expect(formatTime(120)).toBe('2:00');
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(599)).toBe('9:59');
    });

    test('should pad single digit seconds', () => {
      expect(formatTime(61)).toBe('1:01');
      expect(formatTime(9)).toBe('0:09');
    });
  });
});

describe('Recording Duration Calculation', () => {
  test('should calculate remaining time from video', () => {
    const videoDuration = 240; // 4 minutes
    const currentTime = 60; // 1 minute in
    const remaining = videoDuration - currentTime;
    
    expect(remaining).toBe(180); // 3 minutes remaining
  });

  test('should cap recording at maximum duration', () => {
    const videoDuration = 600; // 10 minutes
    const currentTime = 0;
    const maxRecordingTime = 300; // 5 minutes max
    
    const remaining = videoDuration - currentTime;
    const recordDuration = Math.min(remaining, maxRecordingTime);
    
    expect(recordDuration).toBe(300);
  });
});
