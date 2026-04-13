import { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:5000';

export default function Dashboard({ user }) {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salasMap, setSalasMap] = useState({});
  const [reservaToDelete, setReservaToDelete] = useState(null);

  const carregarDados = async () => {
    try {
      const resSalas = await fetch(`${API_URL}/salas`);
      const salasData = await resSalas.json();
      const mapa = {};
      salasData.forEach(s => mapa[s.id] = s.nome);
      setSalasMap(mapa);

      const resReservas = await fetch(`${API_URL}/reservas?usuario_id=${user.id}`);
      const reservasData = await resReservas.json();
      
      reservasData.sort((a, b) => new Date(a.data) - new Date(b.data));
      setReservas(reservasData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    carregarDados();
  }, [user.id]);

  const solicitarCancelamento = (id) => {
    setReservaToDelete(id);
  };

  const confirmarCancelamento = async () => {
    if (!reservaToDelete) return;
    try {
      await fetch(`${API_URL}/reservas/${reservaToDelete}`, { method: 'DELETE' });
      carregarDados();
    } catch (err) {
      alert('Erro ao cancelar.');
    } finally {
      setReservaToDelete(null);
    }
  };

  const cancelarCancelamento = () => {
    setReservaToDelete(null);
  };

  const formatarData = (dataEUA) => {
    if (!dataEUA) return '';
    const partes = dataEUA.split('-');
    if (partes.length !== 3) return dataEUA;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <>
      <div className="animate-enter">
        <h1>Meus Agendamentos</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
          Acompanhe seus compromissos futuros ou libere salas cancelando reservas.
        </p>

      {loading ? (
        <p>Carregando seus dados...</p>
      ) : reservas.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2>Você não possui reservas no momento.</h2>
          <p style={{ color: 'var(--text-muted)' }}>Volte na aba Explorar Salas e faça seu primeiro agendamento!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {reservas.map(r => (
            <div key={r.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', marginBottom: 0 }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>{salasMap[r.sala_id] || `Sala #${r.sala_id}`}</h3>
                <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  <span>📅 {formatarData(r.data)}</span>
                  <span>⏱️ {r.horario_inicio} às {r.horario_fim}</span>
                </div>
              </div>
              <button 
                className="btn btn-danger" 
                onClick={() => solicitarCancelamento(r.id)}
              >
                Cancelar
              </button>
            </div>
          ))}
        </div>
      )}

      </div>
      
      {/* Modal de Confirmação de Cancelamento */}
      {reservaToDelete && (
        <div style={{
          position: 'fixed', inset: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
        }}>
          <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '400px', margin: '20px', textAlign: 'center', background: '#fff' }}>
            <h2>Cancelar Reserva</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={cancelarCancelamento}>Não, manter</button>
              <button className="btn btn-danger" onClick={confirmarCancelamento}>Sim, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
