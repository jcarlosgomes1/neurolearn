import Input from '@/components/Input'
import Button from '@/components/Button'
import { useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    company_name: 'NeuroLearn',
    nif: '12345678',
    country: 'PT',
    fiscal_address: 'Rua da Inovação, 123',
    email_support: 'suporte@neurolearn.pt',
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('✅ Definições guardadas com sucesso!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-2 text-slate-900">⚙️ Definições da Empresa</h1>
      <p className="text-slate-600 mb-8">Configure os dados da sua empresa</p>

      <div className="bg-white rounded-lg shadow p-8 space-y-6">
        <Input
          label="Nome da Empresa"
          value={settings.company_name}
          onChange={(e) => handleInputChange('company_name', e.target.value)}
          placeholder="NeuroLearn"
        />

        <Input
          label="NIF / NIPC"
          value={settings.nif}
          onChange={(e) => handleInputChange('nif', e.target.value)}
          placeholder="12345678"
        />

        <Input
          label="País"
          value={settings.country}
          onChange={(e) => handleInputChange('country', e.target.value)}
          placeholder="PT"
        />

        <Input
          label="Morada Fiscal"
          value={settings.fiscal_address}
          onChange={(e) => handleInputChange('fiscal_address', e.target.value)}
          placeholder="Rua da Inovação, 123"
        />

        <Input
          label="Email de Suporte"
          type="email"
          value={settings.email_support}
          onChange={(e) => handleInputChange('email_support', e.target.value)}
          placeholder="suporte@neurolearn.pt"
        />

        <Button 
          fullWidth 
          isLoading={loading}
          onClick={handleSave}
        >
          💾 Guardar Definições
        </Button>
      </div>
    </div>
  )
}
