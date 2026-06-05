'use client';

import { useState, useTransition } from 'react';
import { Link } from '@/i18n/routing';
import { loginAsPersonaAction } from './actions';
import { Crown, Shield, UserCog, GraduationCap, Briefcase, Users, Loader2, AlertCircle, Building2 } from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  email: string;
  role: string;
  redirectTo: string;
  description: string;
  icon: any;
  color: string;
  features: string[];
}

const PERSONAS: Persona[] = [
  {
    id: 'owner', name: 'Owner Demo Inc', email: 'demo-owner@neurolearn.demo', role: 'Owner empresa',
    redirectTo: '/pt/empresa/demo-inc',
    description: 'Acesso total ao workspace da empresa. Gere membros, subscrições, talento, instrutores corporate.',
    icon: Crown, color: 'from-purple-500 to-violet-600',
    features: ['Gerir membros', 'Subscrever cursos', 'Contratar instrutores', 'Contratar talento'],
  },
  {
    id: 'admin', name: 'Admin Demo Inc', email: 'demo-admin@neurolearn.demo', role: 'Admin empresa',
    redirectTo: '/pt/empresa/demo-inc',
    description: 'Administrador da empresa. Pode tudo excepto eliminar a organização.',
    icon: Shield, color: 'from-blue-500 to-indigo-600',
    features: ['Gerir membros', 'Subscrever cursos', 'Marketplace instrutores', 'Pipeline talent'],
  },
  {
    id: 'manager', name: 'Manager Demo Inc', email: 'demo-manager@neurolearn.demo', role: 'Manager empresa',
    redirectTo: '/pt/empresa/demo-inc',
    description: 'Gestor de equipa. Pode subscrever cursos, contratar instrutores, ver progresso da equipa.',
    icon: UserCog, color: 'from-cyan-500 to-blue-600',
    features: ['Inscrever membros', 'Pedir orçamentos', 'Ver progresso'],
  },
  {
    id: 'aluno', name: 'Aluno Demo', email: 'demo-aluno@neurolearn.demo', role: 'Aluno empresa',
    redirectTo: '/pt/learn',
    description: 'Funcionário da empresa enrolled em cursos. Vê o LMS do lado do aluno.',
    icon: GraduationCap, color: 'from-emerald-500 to-teal-600',
    features: ['Cursos enrolled', 'Quizzes', 'Certificados', 'Progresso'],
  },
  {
    id: 'instrutor', name: 'Instrutor Demo', email: 'demo-instrutor@neurolearn.demo', role: 'Instrutor independente',
    redirectTo: '/pt/teach',
    description: 'Criador de cursos. Vende no marketplace B2C, oferece serviços corporate.',
    icon: Briefcase, color: 'from-amber-500 to-orange-600',
    features: ['Cursos publicados', 'Serviços Corporate', 'Pedidos recebidos', 'Earnings B2B'],
  },
  {
    id: 'talent', name: 'Talent Demo', email: 'demo-talent@neurolearn.demo', role: 'Candidato talent marketplace',
    redirectTo: '/pt/talento',
    description: 'Aluno certificado disponível para contratação. Vê pedidos de empresas interessadas.',
    icon: Users, color: 'from-rose-500 to-pink-600',
    features: ['Perfil talent', 'Visibility', 'Pedidos recebidos', 'Skills certificadas'],
  },
];

export function DemoClient() {
  const [pending, startTransition] = useTransition();
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loginAs(persona: Persona) {
    setError(null);
    setLoadingPersona(persona.id);
    startTransition(async () => {
      const r = await loginAsPersonaAction(persona.id);
      if (r.ok && r.url) {
        window.location.href = r.url;
      } else {
        setError(r.error || 'Login failed');
        setLoadingPersona(null);
      }
    });
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="bg-gradient-to-br from-slate-900 via-brand-900 to-violet-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-6 w-6 text-brand-300" />
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-300">Sales Demo</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-3 tracking-tight">Equipa Comercial</h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Acesso instantâneo à Demo Inc. Escolhe uma persona para mostrar a plataforma ao cliente — sem precisar de password.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const isLoading = loadingPersona === p.id;
            return (
              <button key={p.id} onClick={() => loginAs(p)} disabled={pending}
                className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:border-brand-300 transition-all disabled:opacity-50 disabled:cursor-wait group">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Icon className="h-6 w-6 text-white" />
                  )}
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{p.name}</h3>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">{p.role}</p>
                <p className="text-sm text-slate-600 mb-3 leading-relaxed">{p.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.features.slice(0, 3).map((f) => (
                    <span key={f} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">{f}</span>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 font-mono truncate">{p.email}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <h3 className="font-bold text-amber-900 mb-1">⚠️ Para uso interno apenas</h3>
          <p className="text-amber-800">
            Estas contas têm a password <code className="bg-white px-1.5 py-0.5 rounded">demo-2026</code> mas o ideal é usar
            os botões aqui — geram magic-link de uma vez. A organização <strong>Demo Inc</strong> tem todos os módulos enabled
            (LMS, AI, Marketplace B2C, Talent, Instrutores Corporate, White-label, SSO, API).
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href={'/' as any} className="text-sm text-slate-600 hover:text-brand-700">← Voltar ao site</Link>
        </div>
      </section>
    </main>
  );
}
