'use client';

import { Teleprompter } from '@/components/course-editor/Teleprompter';

const SAMPLE = [
  'Bem-vindo a esta aula. Antes de começarmos, respira fundo e fala com calma — estás a ir muito bem.',
  'Hoje vamos explorar os conceitos essenciais passo a passo, com exemplos práticos que vais conseguir aplicar logo a seguir.',
  'Primeiro, vamos perceber o problema que estamos a tentar resolver e porque é importante para o teu dia a dia.',
  'De seguida, mostro-te um exemplo concreto. Repara neste pormenor — é aqui que a maioria das pessoas se engana no início.',
  'Agora aplicamos o que aprendemos a um caso real, do princípio ao fim, sem saltar etapas.',
  'Para terminar, resumo os pontos-chave e deixo-te um pequeno desafio para praticares por tua conta.',
  'Obrigado por teres estado comigo. Vemo-nos na próxima aula!',
];

export default function TelepontoPreviewPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teleponto — pré-visualização</h1>
        <p className="text-sm text-slate-500 mt-1">
          Apoio de leitura para gravar. Carrega em <strong>Iniciar rolagem</strong>, ajusta a velocidade e o tamanho da letra,
          e edita o guião à vontade. Não aparece no vídeo — é só para ti. No gravador, arranca já com o conteúdo da lição.
        </p>
      </div>
      <Teleprompter paragraphs={SAMPLE} defaultOpen />
      <p className="text-xs text-slate-400">
        Dica: o texto fica centrado e grande para leres de longe enquanto olhas para a câmara.
      </p>
    </div>
  );
}
