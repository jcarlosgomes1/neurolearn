import React from 'react'
import { useI18n } from '@/contexts/I18nContext'

export default function DashboardPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('nav.dashboard', {})}</h1>
        <p className="text-slate-600">Bem-vindo ao seu painel de controlo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-semibold text-slate-900">Cursos</h3>
          <p className="text-slate-600 text-sm">0 cursos</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">📝</div>
          <h3 className="font-semibold text-slate-900">Lições</h3>
          <p className="text-slate-600 text-sm">0 lições</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="font-semibold text-slate-900">Completas</h3>
          <p className="text-slate-600 text-sm">0%</p>
        </div>
      </div>
    </div>
  )
}
