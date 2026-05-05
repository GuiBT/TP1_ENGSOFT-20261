export default function Navbar({ currentView, setView, user, logout }) {
  return (
    <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 2rem', 
        background: '#ffffff', 
        borderBottom: '1px solid var(--surface-border)', 
        marginBottom: '3rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
      
      <h2 
        style={{ margin: 0, fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} 
        onClick={() => setView('home')}
      >
        <span style={{ color: 'var(--primary-color)' }}>Room</span>Booker
      </h2>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          className="btn" 
          style={{ 
            background: currentView === 'home' ? 'var(--primary-color)' : 'transparent', 
            color: currentView === 'home' ? '#fff' : 'var(--text-muted)',
            boxShadow: 'none'
          }}
          onClick={() => setView('home')}
        >
          Explorar Salas
        </button>
        
        <button 
          className="btn" 
          style={{ 
            background: currentView === 'dashboard' ? 'var(--primary-color)' : 'transparent', 
            color: currentView === 'dashboard' ? '#fff' : 'var(--text-muted)',
            boxShadow: 'none'
          }}
          onClick={() => setView('dashboard')}
        >
          Meus Agendamentos
        </button>

        {(user.papel === 'admin' || user.papel === 'room_admin') && (
          <button 
            className="btn" 
            style={{ 
              background: currentView === 'admin' ? 'var(--accent-color)' : 'transparent', 
              color: currentView === 'admin' ? '#fff' : 'var(--text-muted)',
              boxShadow: 'none'
            }}
            onClick={() => setView('admin')}
          >
            Administração
          </button>
        )}

        <button 
          className="btn btn-secondary" 
          style={{ padding: '6px 12px', marginLeft: '0.5rem' }}
          onClick={logout}
        >
          Sair
        </button>

        <div style={{ 
            marginLeft: '0.5rem', 
            padding: '6px 16px', 
            background: 'var(--bg-color)', 
            borderRadius: '20px', 
            fontSize: '0.9rem',
            border: '1px solid var(--surface-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 500
          }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
          {user.nome}
        </div>
      </div>
    </nav>
  )
}
