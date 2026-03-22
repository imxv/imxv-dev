import { useState } from 'react';

export default function Demo() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '1rem', border: '1px solid #d0d8d8', borderRadius: '0.5rem' }}>
      <p style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
        Interactive Demo Component
      </p>
      <button
        onClick={() => setCount((c) => c + 1)}
        style={{
          padding: '0.25rem 0.75rem',
          background: '#b4637a',
          color: '#faf4ed',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
        }}
      >
        Count: {count}
      </button>
    </div>
  );
}
