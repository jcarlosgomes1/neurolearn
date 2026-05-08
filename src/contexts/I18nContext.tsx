import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/services/supabase'

type Language = 'pt-PT' | 'en-US' | 'es-ES' | 'fr-FR'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaults?: Record<string, string>) => string
  availableLanguages: Language[]
  isLoading: boolean
}

const FALLBACK_CHAINS: Record<Language, Language[]> = {
  'pt-PT': ['pt-PT', 'en-US', 'es-ES', 'fr-FR'],
  'en-US': ['en-US', 'pt-PT', 'es-ES', 'fr-FR'],
  'es-ES': ['es-ES', 'en-US', 'pt-PT', 'fr-FR'],
  'fr-FR': ['fr-FR', 'en-US', 'pt-PT', 'es-ES'],
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt-PT')
  const [cache, setCache] = useState<Record<Language, Record<string, string>>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load from localStorage or detect browser language
    const saved = localStorage.getItem('language') as Language | null
    if (saved) {
      setLanguageState(saved)
    } else {
      const detected = detectLanguage()
      setLanguageState(detected)
    }
  }, [])

  const detectLanguage = (): Language => {
    const nav = navigator.language || 'pt-PT'
    const langMap: Record<string, Language> = {
      'pt': 'pt-PT',
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
    }
    const base = nav.split('-')[0].toLowerCase()
    return langMap[base] || 'pt-PT'
  }

  const loadTranslations = async (lang: Language) => {
    if (cache[lang]) return

    setIsLoading(true)
    try {
      const { data } = await supabase
        .from('nl_i18n')
        .select('key,value')
        .eq('lang', lang.split('-')[0])

      if (data) {
        const translations: Record<string, string> = {}
        data.forEach(row => {
          translations[row.key] = row.value
        })
        setCache(prev => ({ ...prev, [lang]: translations }))
      }
    } catch (error) {
      console.error(`Failed to load ${lang}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    loadTranslations(lang)
  }

  const t = (key: string, defaults: Record<string, string> = {}): string => {
    const chain = FALLBACK_CHAINS[language] || FALLBACK_CHAINS['pt-PT']

    for (const lang of chain) {
      if (cache[lang]?.[key]) {
        let value = cache[lang][key]
        // Interpolate variables
        Object.entries(defaults).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, v)
        })
        return value
      }
    }

    return key
  }

  return (
    <I18nContext.Provider value={{
      language,
      setLanguage,
      t,
      availableLanguages: ['pt-PT', 'en-US', 'es-ES', 'fr-FR'],
      isLoading,
    }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
