import { Suspense } from 'react';
import { PessoasHub } from './PessoasHub';

export const metadata = { title: 'Pessoas · Admin' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PessoasHub />
    </Suspense>
  );
}
