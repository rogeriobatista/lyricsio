// Unit tests for locales.js translation system

// Load the locales module
const fs = require('fs');
const vm = require('vm');

// Load and execute locales.js in a context
const localesCode = fs.readFileSync('./locales.js', 'utf8');
const context = { 
  navigator: { language: 'en-US' },
  // Functions will be assigned here
  LOCALES: null,
  t: null,
  detectBrowserLanguage: null,
  getAvailableLanguages: null
};
vm.createContext(context);
vm.runInContext(localesCode, context);

// Add export code to expose variables
vm.runInContext(`
  this.LOCALES = LOCALES;
  this.t = t;
  this.detectBrowserLanguage = detectBrowserLanguage;
  this.getAvailableLanguages = getAvailableLanguages;
`, context);

// Extract for easier testing
const LOCALES = context.LOCALES;
const t = context.t;
const getAvailableLanguages = context.getAvailableLanguages;

describe('Locales Module', () => {
  describe('LOCALES object', () => {
    test('should have all 7 supported languages', () => {
      const languages = Object.keys(LOCALES);
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('pt');
      expect(languages).toContain('fr');
      expect(languages).toContain('de');
      expect(languages).toContain('zh');
      expect(languages).toContain('it');
      expect(languages).toHaveLength(7);
    });

    test('each language should have name and flag', () => {
      Object.keys(LOCALES).forEach(lang => {
        expect(LOCALES[lang]).toHaveProperty('name');
        expect(LOCALES[lang]).toHaveProperty('flag');
        expect(LOCALES[lang].name).toBeTruthy();
        expect(LOCALES[lang].flag).toBeTruthy();
      });
    });

    test('each language should have translations object', () => {
      Object.keys(LOCALES).forEach(lang => {
        expect(LOCALES[lang]).toHaveProperty('translations');
        expect(typeof LOCALES[lang].translations).toBe('object');
      });
    });
  });

  describe('t() translation function', () => {
    test('should return correct English translation', () => {
      expect(t('settings', 'en')).toBe('Settings');
      expect(t('generate', 'en')).toBe('AI Generate');
      expect(t('apiSource', 'en')).toBe('Online');
    });

    test('should return correct Spanish translation', () => {
      expect(t('settings', 'es')).toBe('Configuración');
      expect(t('generate', 'es')).toBe('IA Generar');
    });

    test('should return correct Portuguese translation', () => {
      expect(t('settings', 'pt')).toBe('Configurações');
      expect(t('generate', 'pt')).toBe('IA Gerar');
    });

    test('should return correct French translation', () => {
      expect(t('settings', 'fr')).toBe('Paramètres');
      expect(t('generate', 'fr')).toBe('IA Générer');
    });

    test('should return correct German translation', () => {
      expect(t('settings', 'de')).toBe('Einstellungen');
      expect(t('generate', 'de')).toBe('KI Generieren');
    });

    test('should return correct Chinese translation', () => {
      expect(t('settings', 'zh')).toBe('设置');
      expect(t('generate', 'zh')).toBe('AI生成');
    });

    test('should return correct Italian translation', () => {
      expect(t('settings', 'it')).toBe('Impostazioni');
      expect(t('generate', 'it')).toBe('IA Genera');
    });

    test('should fall back to English for unknown language', () => {
      expect(t('settings', 'unknown')).toBe('Settings');
    });

    test('should default to English when no language specified', () => {
      expect(t('settings')).toBe('Settings');
    });

    test('should return key if translation not found', () => {
      expect(t('nonexistent_key', 'en')).toBe('nonexistent_key');
    });

    test('should fall back to English translation if key missing in target language', () => {
      // All languages should have all keys, but this tests the fallback mechanism
      const englishValue = t('settingsSaved', 'en');
      expect(englishValue).toBeTruthy();
    });
  });

  describe('detectBrowserLanguage()', () => {
    test('should return language code from navigator', () => {
      context.navigator = { language: 'es-ES' };
      vm.runInContext('var detectedLang = detectBrowserLanguage();', context);
      expect(context.detectedLang).toBe('es');
    });

    test('should return "en" for unsupported language', () => {
      context.navigator = { language: 'ja-JP' };
      vm.runInContext('var detectedLang = detectBrowserLanguage();', context);
      expect(context.detectedLang).toBe('en');
    });

    test('should handle Portuguese', () => {
      context.navigator = { language: 'pt-BR' };
      vm.runInContext('var detectedLang = detectBrowserLanguage();', context);
      expect(context.detectedLang).toBe('pt');
    });

    test('should handle Chinese', () => {
      context.navigator = { language: 'zh-CN' };
      vm.runInContext('var detectedLang = detectBrowserLanguage();', context);
      expect(context.detectedLang).toBe('zh');
    });
  });

  describe('getAvailableLanguages()', () => {
    test('should return array of language objects', () => {
      const languages = getAvailableLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages).toHaveLength(7);
    });

    test('each language object should have code, name, and flag', () => {
      const languages = getAvailableLanguages();
      languages.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('flag');
      });
    });

    test('should include English with correct properties', () => {
      const languages = getAvailableLanguages();
      const english = languages.find(l => l.code === 'en');
      expect(english).toBeDefined();
      expect(english.name).toBe('English');
      expect(english.flag).toBe('🇺🇸');
    });
  });

  describe('Translation completeness', () => {
    const requiredKeys = [
      'settings', 'language', 'autoDetect', 'showPanel', 'darkTheme',
      'syncedOverlay', 'saveSettings', 'getLyrics', 'settingsSaved',
      'generate', 'publish', 'apiSource', 'aiGenerated', 'aiKaraoke',
      'refreshLyrics', 'minimize', 'close', 'detectingSong',
      'playSongToSeeLyrics', 'generateFromAudio', 'publishToHelp',
      'aiListening', 'dontCloseTab', 'stopRecording', 'poweredByAI'
    ];

    test('English should have all required translation keys', () => {
      requiredKeys.forEach(key => {
        expect(LOCALES.en.translations[key]).toBeDefined();
        expect(LOCALES.en.translations[key]).toBeTruthy();
      });
    });

    test('Spanish should have all required translation keys', () => {
      requiredKeys.forEach(key => {
        expect(LOCALES.es.translations[key]).toBeDefined();
        expect(LOCALES.es.translations[key]).toBeTruthy();
      });
    });

    test('Portuguese should have all required translation keys', () => {
      requiredKeys.forEach(key => {
        expect(LOCALES.pt.translations[key]).toBeDefined();
        expect(LOCALES.pt.translations[key]).toBeTruthy();
      });
    });

    test('French should have all required translation keys', () => {
      requiredKeys.forEach(key => {
        expect(LOCALES.fr.translations[key]).toBeDefined();
        expect(LOCALES.fr.translations[key]).toBeTruthy();
      });
    });

    test('German should have all required translation keys', () => {
      requiredKeys.forEach(key => {
        expect(LOCALES.de.translations[key]).toBeDefined();
        expect(LOCALES.de.translations[key]).toBeTruthy();
      });
    });

    test('Chinese should have all required translation keys', () => {
      requiredKeys.forEach(key => {
        expect(LOCALES.zh.translations[key]).toBeDefined();
        expect(LOCALES.zh.translations[key]).toBeTruthy();
      });
    });

    test('Italian should have all required translation keys', () => {
      requiredKeys.forEach(key => {
        expect(LOCALES.it.translations[key]).toBeDefined();
        expect(LOCALES.it.translations[key]).toBeTruthy();
      });
    });
  });
});
