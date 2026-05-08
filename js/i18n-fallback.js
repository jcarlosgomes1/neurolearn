// VAGA 3: Multi-language Fallback Chain
// Enhanced i18n system with automatic language detection and fallback support

(function() {
  const SUPABASE_URL = 'https://obpezocujzdaznrdgwoo.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

  let cache = {};
  let currentLanguage = 'pt';
  let loading = false;

  // Language fallback chain: try lang → fallback langs → key
  const FALLBACK_CHAINS = {
    'pt': ['pt', 'pt-PT', 'en', 'en-US', 'es', 'fr'],
    'pt-PT': ['pt-PT', 'pt', 'en', 'en-US', 'es', 'fr'],
    'en': ['en', 'en-US', 'pt', 'pt-PT', 'es', 'fr'],
    'en-US': ['en-US', 'en', 'pt', 'pt-PT', 'es', 'fr'],
    'es': ['es', 'es-ES', 'en', 'en-US', 'pt', 'pt-PT'],
    'es-ES': ['es-ES', 'es', 'en', 'en-US', 'pt', 'pt-PT'],
    'fr': ['fr', 'fr-FR', 'en', 'en-US', 'pt', 'pt-PT'],
    'fr-FR': ['fr-FR', 'fr', 'en', 'en-US', 'pt', 'pt-PT'],
  };

  // Auto-detect user language
  function detectLanguage() {
    // Try in order: localStorage → navigator.language → default
    const stored = localStorage.getItem('neurolearn_lang');
    if (stored) return stored;

    const nav = navigator.language || navigator.userLanguage || 'pt';
    // Map common language codes
    const langMap = {
      'pt': 'pt-PT',
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR'
    };

    const lang = nav.split('-')[0].toLowerCase();
    return langMap[lang] || 'pt-PT';
  }

  // Load translations for language
  async function loadTranslations(lang) {
    if (cache[lang]) return;
    if (loading && cache[lang]) return;

    const baseLang = lang.split('-')[0]; // pt from pt-PT
    
    try {
      // First try exact language
      let response = await fetch(
        `${SUPABASE_URL}/rest/v1/nl_i18n?lang=eq.${baseLang}&select=key,value`,
        { headers: { 'apikey': SUPABASE_KEY } }
      );

      if (!response.ok) {
        // Fallback: try without region
        response = await fetch(
          `${SUPABASE_URL}/rest/v1/nl_i18n?lang=eq.${baseLang}&select=key,value`,
          { headers: { 'apikey': SUPABASE_KEY } }
        );
      }

      if (response.ok) {
        const data = await response.json();
        cache[lang] = {};
        cache[baseLang] = {};
        data.forEach(row => {
          cache[lang][row.key] = row.value;
          cache[baseLang][row.key] = row.value;
        });
      }
    } catch (e) {
      console.warn(`[i18n] Failed to load ${lang}:`, e);
    }
  }

  // Preload multiple languages
  async function preloadLanguages(langs) {
    await Promise.all(langs.map(lang => loadTranslations(lang)));
  }

  // Get translation with fallback chain
  async function getWithFallback(key, lang, defaults = {}) {
    const chain = FALLBACK_CHAINS[lang] || FALLBACK_CHAINS['pt-PT'];

    for (const fallbackLang of chain) {
      if (!cache[fallbackLang]) {
        await loadTranslations(fallbackLang);
      }

      if (cache[fallbackLang] && cache[fallbackLang][key]) {
        let value = cache[fallbackLang][key];
        
        // Interpolate variables
        for (const [k, v] of Object.entries(defaults)) {
          value = value.replace(`{${k}}`, v);
        }
        
        return value;
      }
    }

    // If not found in any language, return key
    return key;
  }

  // Get translation synchronously (with fallback)
  function getWithFallbackSync(key, lang, defaults = {}) {
    const chain = FALLBACK_CHAINS[lang] || FALLBACK_CHAINS['pt-PT'];

    for (const fallbackLang of chain) {
      if (cache[fallbackLang] && cache[fallbackLang][key]) {
        let value = cache[fallbackLang][key];
        
        for (const [k, v] of Object.entries(defaults)) {
          value = value.replace(`{${k}}`, v);
        }
        
        return value;
      }
    }

    return key;
  }

  // Set current language
  function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('neurolearn_lang', lang);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  // Get current language
  function getLanguage() {
    return currentLanguage;
  }

  // Get available languages
  function getAvailableLanguages() {
    return ['pt-PT', 'en-US', 'es-ES', 'fr-FR'];
  }

  // Get language name
  function getLanguageName(lang) {
    const names = {
      'pt-PT': 'Português',
      'en-US': 'English',
      'es-ES': 'Español',
      'fr-FR': 'Français'
    };
    return names[lang] || lang;
  }

  // Initialize on page load
  window.addEventListener('DOMContentLoaded', () => {
    currentLanguage = detectLanguage();
    preloadLanguages([currentLanguage, 'en-US', 'pt-PT']);
  });

  // Expose API
  window.i18n = {
    // Async get with fallback
    t: (key, lang = currentLanguage, defaults = {}) => getWithFallback(key, lang, defaults),
    
    // Sync get with fallback
    tSync: (key, lang = currentLanguage, defaults = {}) => getWithFallbackSync(key, lang, defaults),
    
    // Set language
    setLanguage: setLanguage,
    
    // Get current language
    getLanguage: getLanguage,
    
    // Get available languages
    getAvailableLanguages: getAvailableLanguages,
    
    // Get language display name
    getLanguageName: getLanguageName,
    
    // Preload languages
    preload: preloadLanguages,
    
    // Detect language
    detect: detectLanguage,
    
    // Get fallback chain for language
    getFallbackChain: (lang) => FALLBACK_CHAINS[lang] || FALLBACK_CHAINS['pt-PT'],
    
    // Manual cache clear
    clearCache: () => { cache = {}; }
  };

  // Log initialization
  console.log(`[i18n] Initialized. Current language: ${currentLanguage}`);
  console.log(`[i18n] Available: ${getAvailableLanguages().join(', ')}`);
})();
