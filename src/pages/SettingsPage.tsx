import Input from '@/components/Input'
import Button from '@/components/Button'
import { useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    company_name: 'NeuroLearn',
    nif: '12',
    country: 'PT',
    fiscal_address: '',
    email_support: 'suporte@neurolearn.pt',
  })

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Definições da Empresa</h1>

      <div className="bg-white rounded-lg shadow p-8 space-y-6">
        <Input
          label="Nome da Empresa"
          value={settings.company_name}
          onChange={(e) => setSettings({...settings, company_name: e.target.value})}
        />

        <Input
          label="NIF/NIPC"
          value={settings.nif}
          onChange={(e) => setSettings({...settings, nif: e.target.value})}
        />

        <Input
          label="País"
          value={settings.country}
          onChange={(e) => setSettings({...settings, country: e.target.value})}
        />

        <Input
          label="Morada Fiscal"
          value={settings.fiscal_address}
          onChange={(e) => setSettings({...settings, fiscal_address: e.target.value})}
        />

        <Input
          label="Email de Suporte"
          type="email"
          value={settings.email_support}
          onChange={(e) => setSettings({...settings, email_support: e.target.value})}
        />

        <Button fullWidth>Guardar Definições</Button>
      </div>
    </div>
  )
}
