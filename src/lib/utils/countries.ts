// Lista de países (ISO 2-letter) com nome em PT e indicativo telefónico.
// Ordem: Portugal primeiro, depois mercados-chave, depois alfabético.
export interface Country { code: string; name_pt: string; name_en: string; dial: string }

export const COUNTRIES: Country[] = [
  { code: 'PT', name_pt: 'Portugal', name_en: 'Portugal', dial: '+351' },
  { code: 'BR', name_pt: 'Brasil', name_en: 'Brazil', dial: '+55' },
  { code: 'ES', name_pt: 'Espanha', name_en: 'Spain', dial: '+34' },
  { code: 'FR', name_pt: 'França', name_en: 'France', dial: '+33' },
  { code: 'GB', name_pt: 'Reino Unido', name_en: 'United Kingdom', dial: '+44' },
  { code: 'US', name_pt: 'Estados Unidos', name_en: 'United States', dial: '+1' },
  { code: 'DE', name_pt: 'Alemanha', name_en: 'Germany', dial: '+49' },
  { code: 'IT', name_pt: 'Itália', name_en: 'Italy', dial: '+39' },
  { code: 'NL', name_pt: 'Países Baixos', name_en: 'Netherlands', dial: '+31' },
  { code: 'BE', name_pt: 'Bélgica', name_en: 'Belgium', dial: '+32' },
  { code: 'CH', name_pt: 'Suíça', name_en: 'Switzerland', dial: '+41' },
  { code: 'IE', name_pt: 'Irlanda', name_en: 'Ireland', dial: '+353' },
  { code: 'LU', name_pt: 'Luxemburgo', name_en: 'Luxembourg', dial: '+352' },
  { code: 'AO', name_pt: 'Angola', name_en: 'Angola', dial: '+244' },
  { code: 'MZ', name_pt: 'Moçambique', name_en: 'Mozambique', dial: '+258' },
  { code: 'CV', name_pt: 'Cabo Verde', name_en: 'Cape Verde', dial: '+238' },
  { code: 'GW', name_pt: 'Guiné-Bissau', name_en: 'Guinea-Bissau', dial: '+245' },
  { code: 'ST', name_pt: 'São Tomé e Príncipe', name_en: 'Sao Tome and Principe', dial: '+239' },
  { code: 'TL', name_pt: 'Timor-Leste', name_en: 'East Timor', dial: '+670' },
  { code: 'MO', name_pt: 'Macau', name_en: 'Macau', dial: '+853' },
  // Restante por ordem alfabética PT
  { code: 'AR', name_pt: 'Argentina', name_en: 'Argentina', dial: '+54' },
  { code: 'AT', name_pt: 'Áustria', name_en: 'Austria', dial: '+43' },
  { code: 'AU', name_pt: 'Austrália', name_en: 'Australia', dial: '+61' },
  { code: 'CA', name_pt: 'Canadá', name_en: 'Canada', dial: '+1' },
  { code: 'CL', name_pt: 'Chile', name_en: 'Chile', dial: '+56' },
  { code: 'CN', name_pt: 'China', name_en: 'China', dial: '+86' },
  { code: 'CO', name_pt: 'Colômbia', name_en: 'Colombia', dial: '+57' },
  { code: 'DK', name_pt: 'Dinamarca', name_en: 'Denmark', dial: '+45' },
  { code: 'FI', name_pt: 'Finlândia', name_en: 'Finland', dial: '+358' },
  { code: 'GR', name_pt: 'Grécia', name_en: 'Greece', dial: '+30' },
  { code: 'HU', name_pt: 'Hungria', name_en: 'Hungary', dial: '+36' },
  { code: 'IN', name_pt: 'Índia', name_en: 'India', dial: '+91' },
  { code: 'IL', name_pt: 'Israel', name_en: 'Israel', dial: '+972' },
  { code: 'JP', name_pt: 'Japão', name_en: 'Japan', dial: '+81' },
  { code: 'MX', name_pt: 'México', name_en: 'Mexico', dial: '+52' },
  { code: 'NO', name_pt: 'Noruega', name_en: 'Norway', dial: '+47' },
  { code: 'NZ', name_pt: 'Nova Zelândia', name_en: 'New Zealand', dial: '+64' },
  { code: 'PL', name_pt: 'Polónia', name_en: 'Poland', dial: '+48' },
  { code: 'RO', name_pt: 'Roménia', name_en: 'Romania', dial: '+40' },
  { code: 'SE', name_pt: 'Suécia', name_en: 'Sweden', dial: '+46' },
  { code: 'TR', name_pt: 'Turquia', name_en: 'Turkey', dial: '+90' },
  { code: 'ZA', name_pt: 'África do Sul', name_en: 'South Africa', dial: '+27' },
];

export function countryName(code: string | null | undefined, lang: string = 'pt'): string {
  if (!code) return '';
  const c = COUNTRIES.find((x) => x.code === code);
  if (!c) return code;
  return lang === 'pt' ? c.name_pt : c.name_en;
}

export function defaultCountryByLocale(locale: string): string {
  switch (locale) {
    case 'pt': return 'PT';
    case 'en': return 'GB';
    case 'es': return 'ES';
    case 'fr': return 'FR';
    default: return 'PT';
  }
}
