import { useState } from 'react'

export default function TestPage() {
  const [formData, setFormData] = useState({
    nif: '12345678',
    company: 'NeuroLearn',
    email: 'test@test.com'
  })

  console.log('TestPage render, formData:', formData)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget
    console.log(`Input change: ${name} = ${value}`)
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      console.log('State updated to:', updated)
      return updated
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">🧪 Test Inputs</h1>

      <div className="bg-white rounded-lg shadow p-8 space-y-6">
        
        <div>
          <label className="block font-bold mb-2">NIF</label>
          <input
            type="text"
            name="nif"
            value={formData.nif}
            onChange={handleChange}
            placeholder="NIF"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-600 mt-1">Valor atual: {formData.nif}</p>
        </div>

        <div>
          <label className="block font-bold mb-2">Empresa</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Empresa"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-600 mt-1">Valor atual: {formData.company}</p>
        </div>

        <div>
          <label className="block font-bold mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-600 mt-1">Valor atual: {formData.email}</p>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold mb-2">State completo:</h3>
          <pre className="text-sm overflow-auto">{JSON.stringify(formData, null, 2)}</pre>
        </div>

      </div>
    </div>
  )
}
