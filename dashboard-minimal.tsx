"use client"

export default function MinimalDashboard() {
  console.log('MinimalDashboard: Rendering at', new Date().toISOString());

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '24px'
        }}>
          ✅ Dashboard Working!
        </h1>

        <div style={{
          backgroundColor: '#d1fae5',
          border: '1px solid #10b981',
          color: '#065f46',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <strong>Success!</strong> Dashboard is rendering correctly without any complex dependencies.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={{
            backgroundColor: '#dbeafe',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              Status
            </h2>
            <p style={{ color: '#4b5563' }}>Dashboard components are working perfectly.</p>
          </div>

          <div style={{
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => window.location.href = '/assessment'}
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Go to Assessment
              </button>
              <button
                onClick={() => window.location.href = '/auth'}
                style={{
                  width: '100%',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Go to Auth
              </button>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <p style={{ color: '#6b7280' }}>
            This is a minimal dashboard using inline styles to avoid any CSS conflicts.
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
            Rendered at: {new Date().toLocaleString()}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              backgroundColor: '#059669',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
