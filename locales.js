// LyricsIO Translations

const LOCALES = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    translations: {
      // Popup
      settings: 'Settings',
      language: 'Language',
      autoDetect: 'Auto-detect songs',
      showPanel: 'Show lyrics panel',
      darkTheme: 'Dark theme',
      syncedOverlay: '🎤 Synced lyrics overlay',
      saveSettings: 'Save Settings',
      getLyrics: 'Get Lyrics for Current Video',
      settingsSaved: 'Settings saved successfully!',
      openYouTubeFirst: 'Please open a YouTube video first',
      lyricsOpened: 'Lyrics panel opened! Check the YouTube page.',
      fetchingLyrics: 'Fetching lyrics... Check the YouTube page.',
      refreshPage: 'Please refresh the YouTube page and try again',
      
      // Panel
      lyricsio: 'LyricsIO',
      poweredByAI: 'Powered by AI',
      loading: 'Loading...',
      loadingNewSong: 'Loading new song...',
      searchingLyrics: 'Searching for lyrics...',
      noLyricsFound: 'No lyrics found',
      apiSource: 'Online',
      aiGenerated: 'AI Generated',
      aiKaraoke: '🎤 AI',
      generate: 'AI Generate',
      publish: 'Publish',
      published: '✓ Published',
      publishing: 'Publishing...',
      
      // Panel buttons
      refreshLyrics: 'Refresh lyrics',
      minimize: 'Minimize',
      close: 'Close',
      detectingSong: 'Detecting song...',
      playSongToSeeLyrics: 'Play a song to see lyrics',
      generateFromAudio: 'Generate lyrics from audio',
      publishToHelp: 'Publish these lyrics to help others find them',
      recordingForLyrics: 'Recording song for lyrics generation',
      
      // Recording
      aiListening: '🎵 AI is listening...',
      recordingSong: 'Recording song for lyrics generation',
      dontCloseTab: "⚠️ Don't close this tab or navigate away!",
      stopRecording: 'Stop Recording Early',
      recording: '🔴 Recording...',
      remaining: 'remaining',
      clickToStop: '(click to stop early)',
      processingAudio: '🔄 Processing audio...',
      transcribingLyrics: '🎵 Transcribing lyrics with AI...',
      syncedLyricsReady: '✅ Synced lyrics ready for karaoke!',
      lyricsGenerated: '✅ Lyrics generated and saved!',
      
      // Publish
      lyricsPublished: '✅ Lyrics published to LRCLIB! Thank you for contributing!',
      publishFailed: 'Failed to publish',
      noLyricsToPublish: 'No generated lyrics to publish',
      
      // Errors
      noVideoFound: 'No video found',
      errorCapturingAudio: 'Could not capture audio. Try refreshing.',
      setApiKey: 'Please set your API key first',
      transcriptionFailed: 'Transcription failed',
      errorProcessingAudio: 'Error processing audio',
      
      // Sync status
      syncedLyrics: '🎤 Synced',
      notSynced: 'Not synced'
    }
  },
  
  es: {
    name: 'Español',
    flag: '🇪🇸',
    translations: {
      settings: 'Configuración',
      language: 'Idioma',
      autoDetect: 'Detectar canciones automáticamente',
      showPanel: 'Mostrar panel de letras',
      darkTheme: 'Tema oscuro',
      syncedOverlay: '🎤 Letras sincronizadas',
      saveSettings: 'Guardar Configuración',
      getLyrics: 'Obtener Letras del Video Actual',
      settingsSaved: '¡Configuración guardada!',
      openYouTubeFirst: 'Por favor, abre un video de YouTube primero',
      lyricsOpened: '¡Panel de letras abierto! Revisa la página de YouTube.',
      fetchingLyrics: 'Buscando letras... Revisa la página de YouTube.',
      refreshPage: 'Por favor, actualiza la página de YouTube e intenta de nuevo',
      
      lyricsio: 'LyricsIO',
      poweredByAI: 'Impulsado por IA',
      loading: 'Cargando...',
      loadingNewSong: 'Cargando nueva canción...',
      searchingLyrics: 'Buscando letras...',
      noLyricsFound: 'No se encontraron letras',
      apiSource: 'Online',
      aiGenerated: 'Generado por IA',
      aiKaraoke: '🎤 IA',
      generate: 'IA Generar',
      publish: 'Publicar',
      published: '✓ Publicado',
      publishing: 'Publicando...',
      
      refreshLyrics: 'Actualizar letras',
      minimize: 'Minimizar',
      close: 'Cerrar',
      detectingSong: 'Detectando canción...',
      playSongToSeeLyrics: 'Reproduce una canción para ver la letra',
      generateFromAudio: 'Generar letras desde audio',
      publishToHelp: 'Publicar letras para ayudar a otros',
      recordingForLyrics: 'Grabando canción para generar letras',
      
      aiListening: '🎵 La IA está escuchando...',
      recordingSong: 'Grabando canción para generar letras',
      dontCloseTab: '⚠️ ¡No cierres esta pestaña ni navegues!',
      stopRecording: 'Detener Grabación',
      recording: '🔴 Grabando...',
      remaining: 'restante',
      clickToStop: '(clic para detener)',
      processingAudio: '🔄 Procesando audio...',
      transcribingLyrics: '🎵 Transcribiendo letras con IA...',
      syncedLyricsReady: '✅ ¡Letras sincronizadas listas para karaoke!',
      lyricsGenerated: '✅ ¡Letras generadas y guardadas!',
      
      lyricsPublished: '✅ ¡Letras publicadas en LRCLIB! ¡Gracias por contribuir!',
      publishFailed: 'Error al publicar',
      noLyricsToPublish: 'No hay letras generadas para publicar',
      
      noVideoFound: 'No se encontró video',
      errorCapturingAudio: 'No se pudo capturar el audio. Intenta actualizar.',
      setApiKey: 'Por favor, configura tu clave API primero',
      transcriptionFailed: 'Transcripción fallida',
      errorProcessingAudio: 'Error al procesar audio',
      
      syncedLyrics: '🎤 Sincronizado',
      notSynced: 'No sincronizado'
    }
  },
  
  pt: {
    name: 'Português',
    flag: '🇧🇷',
    translations: {
      settings: 'Configurações',
      language: 'Idioma',
      autoDetect: 'Detectar músicas automaticamente',
      showPanel: 'Mostrar painel de letras',
      darkTheme: 'Tema escuro',
      syncedOverlay: '🎤 Letras sincronizadas',
      saveSettings: 'Salvar Configurações',
      getLyrics: 'Obter Letras do Vídeo Atual',
      settingsSaved: 'Configurações salvas com sucesso!',
      openYouTubeFirst: 'Por favor, abra um vídeo do YouTube primeiro',
      lyricsOpened: 'Painel de letras aberto! Verifique a página do YouTube.',
      fetchingLyrics: 'Buscando letras... Verifique a página do YouTube.',
      refreshPage: 'Por favor, atualize a página do YouTube e tente novamente',
      
      lyricsio: 'LyricsIO',
      poweredByAI: 'Desenvolvido com IA',
      loading: 'Carregando...',
      loadingNewSong: 'Carregando nova música...',
      searchingLyrics: 'Buscando letras...',
      noLyricsFound: 'Nenhuma letra encontrada',
      apiSource: 'Online',
      aiGenerated: 'Gerado por IA',
      aiKaraoke: '🎤 IA',
      generate: 'IA Gerar',
      publish: 'Publicar',
      published: '✓ Publicado',
      publishing: 'Publicando...',
      
      refreshLyrics: 'Atualizar letras',
      minimize: 'Minimizar',
      close: 'Fechar',
      detectingSong: 'Detectando música...',
      playSongToSeeLyrics: 'Reproduza uma música para ver a letra',
      generateFromAudio: 'Gerar letras do áudio',
      publishToHelp: 'Publicar letras para ajudar outros',
      recordingForLyrics: 'Gravando música para gerar letras',
      
      aiListening: '🎵 A IA está ouvindo...',
      recordingSong: 'Gravando música para gerar letras',
      dontCloseTab: '⚠️ Não feche esta aba nem navegue!',
      stopRecording: 'Parar Gravação',
      recording: '🔴 Gravando...',
      remaining: 'restante',
      clickToStop: '(clique para parar)',
      processingAudio: '🔄 Processando áudio...',
      transcribingLyrics: '🎵 Transcrevendo letras com IA...',
      syncedLyricsReady: '✅ Letras sincronizadas prontas para karaoke!',
      lyricsGenerated: '✅ Letras geradas e salvas!',
      
      lyricsPublished: '✅ Letras publicadas no LRCLIB! Obrigado por contribuir!',
      publishFailed: 'Falha ao publicar',
      noLyricsToPublish: 'Nenhuma letra gerada para publicar',
      
      noVideoFound: 'Nenhum vídeo encontrado',
      errorCapturingAudio: 'Não foi possível capturar o áudio. Tente atualizar.',
      setApiKey: 'Por favor, configure sua chave API primeiro',
      transcriptionFailed: 'Transcrição falhou',
      errorProcessingAudio: 'Erro ao processar áudio',
      
      syncedLyrics: '🎤 Sincronizado',
      notSynced: 'Não sincronizado'
    }
  },
  
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    translations: {
      settings: 'Paramètres',
      language: 'Langue',
      autoDetect: 'Détecter les chansons automatiquement',
      showPanel: 'Afficher le panneau de paroles',
      darkTheme: 'Thème sombre',
      syncedOverlay: '🎤 Paroles synchronisées',
      saveSettings: 'Enregistrer',
      getLyrics: 'Obtenir les Paroles de la Vidéo',
      settingsSaved: 'Paramètres enregistrés !',
      openYouTubeFirst: 'Veuillez ouvrir une vidéo YouTube d\'abord',
      lyricsOpened: 'Panneau de paroles ouvert ! Vérifiez la page YouTube.',
      fetchingLyrics: 'Recherche de paroles... Vérifiez la page YouTube.',
      refreshPage: 'Veuillez actualiser la page YouTube et réessayer',
      
      lyricsio: 'LyricsIO',
      poweredByAI: 'Propulsé par IA',
      loading: 'Chargement...',
      loadingNewSong: 'Chargement nouvelle chanson...',
      searchingLyrics: 'Recherche de paroles...',
      noLyricsFound: 'Aucune parole trouvée',
      apiSource: 'Online',
      aiGenerated: 'Généré par IA',
      aiKaraoke: '🎤 IA',
      generate: 'IA Générer',
      publish: 'Publier',
      published: '✓ Publié',
      publishing: 'Publication...',
      
      refreshLyrics: 'Actualiser les paroles',
      minimize: 'Réduire',
      close: 'Fermer',
      detectingSong: 'Détection de la chanson...',
      playSongToSeeLyrics: 'Jouez une chanson pour voir les paroles',
      generateFromAudio: 'Générer les paroles depuis l\'audio',
      publishToHelp: 'Publier les paroles pour aider les autres',
      recordingForLyrics: 'Enregistrement pour générer les paroles',
      
      aiListening: '🎵 L\'IA écoute...',
      recordingSong: 'Enregistrement pour générer les paroles',
      dontCloseTab: '⚠️ Ne fermez pas cet onglet !',
      stopRecording: 'Arrêter l\'Enregistrement',
      recording: '🔴 Enregistrement...',
      remaining: 'restant',
      clickToStop: '(cliquez pour arrêter)',
      processingAudio: '🔄 Traitement audio...',
      transcribingLyrics: '🎵 Transcription des paroles avec IA...',
      syncedLyricsReady: '✅ Paroles synchronisées prêtes pour le karaoké !',
      lyricsGenerated: '✅ Paroles générées et sauvegardées !',
      
      lyricsPublished: '✅ Paroles publiées sur LRCLIB ! Merci pour votre contribution !',
      publishFailed: 'Échec de la publication',
      noLyricsToPublish: 'Aucune parole générée à publier',
      
      noVideoFound: 'Aucune vidéo trouvée',
      errorCapturingAudio: 'Impossible de capturer l\'audio. Essayez d\'actualiser.',
      setApiKey: 'Veuillez d\'abord configurer votre clé API',
      transcriptionFailed: 'Échec de la transcription',
      errorProcessingAudio: 'Erreur de traitement audio',
      
      syncedLyrics: '🎤 Synchronisé',
      notSynced: 'Non synchronisé'
    }
  },
  
  de: {
    name: 'Deutsch',
    flag: '🇩🇪',
    translations: {
      settings: 'Einstellungen',
      language: 'Sprache',
      autoDetect: 'Lieder automatisch erkennen',
      showPanel: 'Liedtext-Panel anzeigen',
      darkTheme: 'Dunkles Thema',
      syncedOverlay: '🎤 Synchronisierte Texte',
      saveSettings: 'Einstellungen Speichern',
      getLyrics: 'Liedtext für Aktuelles Video',
      settingsSaved: 'Einstellungen erfolgreich gespeichert!',
      openYouTubeFirst: 'Bitte öffnen Sie zuerst ein YouTube-Video',
      lyricsOpened: 'Liedtext-Panel geöffnet! Überprüfen Sie die YouTube-Seite.',
      fetchingLyrics: 'Suche nach Liedtexten... Überprüfen Sie die YouTube-Seite.',
      refreshPage: 'Bitte aktualisieren Sie die YouTube-Seite und versuchen Sie es erneut',
      
      lyricsio: 'LyricsIO',
      poweredByAI: 'Unterstützt von KI',
      loading: 'Laden...',
      loadingNewSong: 'Neues Lied laden...',
      searchingLyrics: 'Suche nach Liedtexten...',
      noLyricsFound: 'Keine Liedtexte gefunden',
      apiSource: 'Online',
      aiGenerated: 'KI Generiert',
      aiKaraoke: '🎤 KI',
      generate: 'KI Generieren',
      publish: 'Veröffentlichen',
      published: '✓ Veröffentlicht',
      publishing: 'Veröffentlichen...',
      
      refreshLyrics: 'Liedtexte aktualisieren',
      minimize: 'Minimieren',
      close: 'Schließen',
      detectingSong: 'Lied erkennen...',
      playSongToSeeLyrics: 'Spielen Sie ein Lied ab, um den Text zu sehen',
      generateFromAudio: 'Liedtexte aus Audio generieren',
      publishToHelp: 'Liedtexte veröffentlichen, um anderen zu helfen',
      recordingForLyrics: 'Aufnahme für Liedtext-Generierung',
      
      aiListening: '🎵 KI hört zu...',
      recordingSong: 'Aufnahme für Liedtext-Generierung',
      dontCloseTab: '⚠️ Schließen Sie diesen Tab nicht!',
      stopRecording: 'Aufnahme Stoppen',
      recording: '🔴 Aufnahme...',
      remaining: 'verbleibend',
      clickToStop: '(klicken zum Stoppen)',
      processingAudio: '🔄 Audio verarbeiten...',
      transcribingLyrics: '🎵 Liedtexte mit KI transkribieren...',
      syncedLyricsReady: '✅ Synchronisierte Texte bereit für Karaoke!',
      lyricsGenerated: '✅ Liedtexte generiert und gespeichert!',
      
      lyricsPublished: '✅ Liedtexte auf LRCLIB veröffentlicht! Danke für Ihren Beitrag!',
      publishFailed: 'Veröffentlichung fehlgeschlagen',
      noLyricsToPublish: 'Keine generierten Liedtexte zum Veröffentlichen',
      
      noVideoFound: 'Kein Video gefunden',
      errorCapturingAudio: 'Audio konnte nicht aufgenommen werden. Versuchen Sie zu aktualisieren.',
      setApiKey: 'Bitte richten Sie zuerst Ihren API-Schlüssel ein',
      transcriptionFailed: 'Transkription fehlgeschlagen',
      errorProcessingAudio: 'Fehler bei der Audioverarbeitung',
      
      syncedLyrics: '🎤 Synchronisiert',
      notSynced: 'Nicht synchronisiert'
    }
  },
  
  zh: {
    name: '中文',
    flag: '🇨🇳',
    translations: {
      settings: '设置',
      language: '语言',
      autoDetect: '自动检测歌曲',
      showPanel: '显示歌词面板',
      darkTheme: '深色主题',
      syncedOverlay: '🎤 同步歌词叠加',
      saveSettings: '保存设置',
      getLyrics: '获取当前视频歌词',
      settingsSaved: '设置保存成功！',
      openYouTubeFirst: '请先打开一个YouTube视频',
      lyricsOpened: '歌词面板已打开！请查看YouTube页面。',
      fetchingLyrics: '正在搜索歌词...请查看YouTube页面。',
      refreshPage: '请刷新YouTube页面后重试',
      
      lyricsio: 'LyricsIO',
      poweredByAI: 'AI驱动',
      loading: '加载中...',
      loadingNewSong: '加载新歌曲...',
      searchingLyrics: '搜索歌词中...',
      noLyricsFound: '未找到歌词',
      apiSource: '在线',
      aiGenerated: 'AI生成',
      aiKaraoke: '🎤 AI',
      generate: 'AI生成',
      publish: '发布',
      published: '✓ 已发布',
      publishing: '发布中...',
      
      refreshLyrics: '刷新歌词',
      minimize: '最小化',
      close: '关闭',
      detectingSong: '正在检测歌曲...',
      playSongToSeeLyrics: '播放歌曲以查看歌词',
      generateFromAudio: '从音频生成歌词',
      publishToHelp: '发布歌词以帮助他人',
      recordingForLyrics: '正在录制歌曲以生成歌词',
      
      aiListening: '🎵 AI正在聆听...',
      recordingSong: '正在录制歌曲以生成歌词',
      dontCloseTab: '⚠️ 请勿关闭此标签页！',
      stopRecording: '停止录制',
      recording: '🔴 录制中...',
      remaining: '剩余',
      clickToStop: '(点击停止)',
      processingAudio: '🔄 处理音频中...',
      transcribingLyrics: '🎵 AI转录歌词中...',
      syncedLyricsReady: '✅ 同步歌词已准备好！',
      lyricsGenerated: '✅ 歌词已生成并保存！',
      
      lyricsPublished: '✅ 歌词已发布到LRCLIB！感谢您的贡献！',
      publishFailed: '发布失败',
      noLyricsToPublish: '没有可发布的生成歌词',
      
      noVideoFound: '未找到视频',
      errorCapturingAudio: '无法捕获音频。请尝试刷新。',
      setApiKey: '请先设置您的API密钥',
      transcriptionFailed: '转录失败',
      errorProcessingAudio: '音频处理错误',
      
      syncedLyrics: '🎤 已同步',
      notSynced: '未同步'
    }
  },
  
  it: {
    name: 'Italiano',
    flag: '🇮🇹',
    translations: {
      settings: 'Impostazioni',
      language: 'Lingua',
      autoDetect: 'Rileva brani automaticamente',
      showPanel: 'Mostra pannello testi',
      darkTheme: 'Tema scuro',
      syncedOverlay: '🎤 Testi sincronizzati',
      saveSettings: 'Salva Impostazioni',
      getLyrics: 'Ottieni Testi del Video Attuale',
      settingsSaved: 'Impostazioni salvate con successo!',
      openYouTubeFirst: 'Per favore apri prima un video di YouTube',
      lyricsOpened: 'Pannello testi aperto! Controlla la pagina di YouTube.',
      fetchingLyrics: 'Ricerca testi... Controlla la pagina di YouTube.',
      refreshPage: 'Per favore aggiorna la pagina di YouTube e riprova',
      
      lyricsio: 'LyricsIO',
      poweredByAI: 'Alimentato da IA',
      loading: 'Caricamento...',
      loadingNewSong: 'Caricamento nuovo brano...',
      searchingLyrics: 'Ricerca testi...',
      noLyricsFound: 'Nessun testo trovato',
      apiSource: 'Online',
      aiGenerated: 'Generato da IA',
      aiKaraoke: '🎤 IA',
      generate: 'IA Genera',
      publish: 'Pubblica',
      published: '✓ Pubblicato',
      publishing: 'Pubblicazione...',
      
      refreshLyrics: 'Aggiorna testi',
      minimize: 'Riduci',
      close: 'Chiudi',
      detectingSong: 'Rilevamento brano...',
      playSongToSeeLyrics: 'Riproduci un brano per vedere i testi',
      generateFromAudio: 'Genera testi dall\'audio',
      publishToHelp: 'Pubblica testi per aiutare gli altri',
      recordingForLyrics: 'Registrazione brano per generare testi',
      
      aiListening: '🎵 L\'IA sta ascoltando...',
      recordingSong: 'Registrazione brano per generare testi',
      dontCloseTab: '⚠️ Non chiudere questa scheda!',
      stopRecording: 'Ferma Registrazione',
      recording: '🔴 Registrazione...',
      remaining: 'rimanente',
      clickToStop: '(clicca per fermare)',
      processingAudio: '🔄 Elaborazione audio...',
      transcribingLyrics: '🎵 Trascrizione testi con IA...',
      syncedLyricsReady: '✅ Testi sincronizzati pronti per il karaoke!',
      lyricsGenerated: '✅ Testi generati e salvati!',
      
      lyricsPublished: '✅ Testi pubblicati su LRCLIB! Grazie per il contributo!',
      publishFailed: 'Pubblicazione fallita',
      noLyricsToPublish: 'Nessun testo generato da pubblicare',
      
      noVideoFound: 'Nessun video trovato',
      errorCapturingAudio: 'Impossibile catturare l\'audio. Prova ad aggiornare.',
      setApiKey: 'Per favore imposta prima la tua chiave API',
      transcriptionFailed: 'Trascrizione fallita',
      errorProcessingAudio: 'Errore elaborazione audio',
      
      syncedLyrics: '🎤 Sincronizzato',
      notSynced: 'Non sincronizzato'
    }
  }
};

// Get translation for a key
function t(key, lang = 'en') {
  const locale = LOCALES[lang] || LOCALES.en;
  return locale.translations[key] || LOCALES.en.translations[key] || key;
}

// Detect browser language
function detectBrowserLanguage() {
  const browserLang = navigator.language.split('-')[0];
  return LOCALES[browserLang] ? browserLang : 'en';
}

// Get all available languages
function getAvailableLanguages() {
  return Object.entries(LOCALES).map(([code, data]) => ({
    code,
    name: data.name,
    flag: data.flag
  }));
}
