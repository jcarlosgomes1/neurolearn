import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/Button'
import Input from '@/components/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    email: 'maria@email.com',
    password: '1234',
    name: '',
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.email) newErrors.email = 'Email é obrigatório'
    if (!formData.password) newErrors.password = 'Password é obrigatória'
    if (!isLogin && !formData.name) newErrors.name = 'Nome é obrigatório'
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateForm()
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (error: any) {
      setErrors({ submit: error.message || 'Erro ao fazer login' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-slate-900">NeuroLearn</h1>
        <p className="text-center text-slate-600 mb-8">Plataforma de aprendizagem inteligente</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
          />

          {!isLogin && (
            <Input
              label="Nome Completo"
              type="text"
              placeholder="João Silva"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />
          )}

          <Button
            type="submit"
            isLoading={loading}
            fullWidth
            className="mt-6"
          >
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </Button>

          <div className="text-center text-sm text-slate-600">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setErrors({})
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              {isLogin ? 'Registar' : 'Entrar'}
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-slate-700">
          <p><strong>Demo:</strong></p>
          <p>Email: maria@email.com</p>
          <p>Password: 1234</p>
        </div>
      </div>
    </div>
  )
}
