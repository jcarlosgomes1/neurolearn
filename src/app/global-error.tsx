'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt">
      <body style={{ 
        margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#f8fafc', color: '#0f172a', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '400px', textAlign: 'center', padding: '24px' }}>
          <div style={{ 
            display: 'inline-flex', width: '64px', height: '64px', borderRadius: '50%',
            background: '#fee2e2', color: '#dc2626', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 'bold', marginBottom: '16px'
          }}>!</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Erro crítico</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
            Algo correu muito mal. Recarrega a página.
          </p>
          {error.digest && (
            <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '8px' }}>
              ID: {error.digest}
            </p>
          )}
          <button onClick={() => reset()} style={{
            marginTop: '24px', padding: '10px 20px', borderRadius: '8px',
            background: '#6366f1', color: 'white', border: 'none', fontWeight: 'bold',
            cursor: 'pointer', fontSize: '14px'
          }}>Recarregar</button>
        </div>
      </body>
    </html>
  );
}
