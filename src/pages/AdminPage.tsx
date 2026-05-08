import { useState, useEffect } from 'react'
import { supabase } from '@/services/supabase'
import Button from '@/components/Button'
import Input from '@/components/Input'

export default function AdminPage() {
  const [translations, setTranslations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLang, setSelectedLang] = useState('pt')

  useEffect(() => {
    loadTranslations()
  }, [])

  const loadTranslations = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('nl_i18n')
        .select('*')
      setTranslations(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  const filtered = translations.filter(t =>
    (selectedLang === 'all' || t.lang === selectedLang) &&
    (searchTerm === '' || t.key.includes(searchTerm) || t.value.includes(searchTerm))
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">🌐 Admin Dashboard - Traduções</h1>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Procurar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">Todos</option>
          <option value="pt">Português</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
        <Button onClick={loadTranslations}>Recarregar</Button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Chave</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Idioma</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i} className="border-b hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm font-mono">{t.key}</td>
                  <td className="px-6 py-3 text-sm">{t.lang}</td>
                  <td className="px-6 py-3 text-sm">{t.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
