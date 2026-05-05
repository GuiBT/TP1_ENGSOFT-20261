import { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Dashboard({ user, setCurrentUser }) {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salasMap, setSalasMap] = useState({});
  const [reservaToDelete, setReservaToDelete] = useState(null);
  const [userData, setUserData] = useState({ nome: user.nome, login: user.login, senha: '' });
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setUserData({ nome: user.nome, login: user.login, senha: '' });
  }, [user]);

  const carregarDados = async () => {
    try {
      const resSalas = await fetch(`${API_URL}/salas`);
      const salasData = await resSalas.json();
      const mapa = {};
      salasData.forEach(s => mapa[s.id] = s.nome);
      setSalasMap(mapa);

      const resReservas = await fetch(`${API_URL}/reservas`, {
        headers: getAuthHeaders()
      });
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
      await fetch(`${API_URL}/reservas/${reservaToDelete}`, { method: 'DELETE', headers: getAuthHeaders() });
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');

    try {
      const res = await fetch(`${API_URL}/me`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: userData.nome,
          login: userData.login,
          senha: userData.senha || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.erro || 'Erro ao atualizar perfil.');
      }

      setProfileMessage('Perfil atualizado com sucesso.');
      setUserData(prev => ({ ...prev, senha: '' }));
      if (setCurrentUser) {
        setCurrentUser(data);
      }
    } catch (err) {
      setProfileError(err.message);
    }
  };

  const getDaysInMonth = (year, month) => {
    const days = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const reservationsByDate = reservas.reduce((acc, reserva) => {
    acc[reserva.data] = acc[reserva.data] ? [...acc[reserva.data], reserva] : [reserva];
    return acc;
  }, {});

  const selectedDayReservations = reservationsByDate[selectedCalendarDate] || [];

  const today = new Date();
  const calendarYear = today.getFullYear();
  const calendarMonth = today.getMonth();
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);

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
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Acompanhe seus compromissos, edite seus dados pessoais e visualize suas reservas no calendário.
        </p>

        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h2>Editar Perfil</h2>
          <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            <div className="input-group">
              <label>Nome</label>
              <input type="text" required value={userData.nome} onChange={e => setUserData({...userData, nome: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Login</label>
              <input type="text" required value={userData.login} onChange={e => setUserData({...userData, login: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Nova Senha <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(deixe vazio para manter)</span></label>
              <input type="password" value={userData.senha} onChange={e => setUserData({...userData, senha: e.target.value})} />
            </div>
            {profileError && <div className="toast-error">{profileError}</div>}
            {profileMessage && <div style={{ color: 'var(--success-color)', fontWeight: 600 }}>{profileMessage}</div>}
            <button type="submit" className="btn" style={{ width: 'fit-content' }}>Salvar Alterações</button>
          </form>
        </div>

        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h2>Calendário de Reservas</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Visualize apenas suas reservas neste mês.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '8px', marginTop: '1rem', marginBottom: '1rem' }}>
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
              <div key={d} style={{ fontWeight: 700, textAlign: 'center', color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '8px' }}>
            {new Array(new Date(calendarYear, calendarMonth, 1).getDay()).fill(null).map((_, idx) => (
              <div key={`blank-${idx}`} style={{ minHeight: '80px' }} />
            ))}
            {daysInMonth.map(day => {
              const key = day.toISOString().slice(0, 10);
              const count = reservationsByDate[key]?.length || 0;
              const selected = key === selectedCalendarDate;
              return (
                <button key={key} type="button" onClick={() => setSelectedCalendarDate(key)} style={{
                  minHeight: '80px',
                  borderRadius: '12px',
                  border: selected ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
                  background: selected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-color)',
                  padding: '10px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>{day.getDate()}</span>
                    {count > 0 && <span style={{ background: 'var(--primary-color)', color: '#fff', borderRadius: '999px', minWidth: '24px', height: '24px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.75rem' }}>{count}</span>}
                  </div>
                  {count > 0 && <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{count} reserva{count !== 1 ? 's' : ''}</div>}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0' }}>Reservas em {formatarData(selectedCalendarDate)}</h3>
            {selectedDayReservations.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Nenhuma reserva nesta data.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {selectedDayReservations.map(r => (
                  <div key={r.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.2rem' }}>
                    <div>
                      <strong>{salasMap[r.sala_id] || `Sala #${r.sala_id}`}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formatarData(r.data)} • {r.horario_inicio} às {r.horario_fim}</div>
                    </div>
                    <button className="btn btn-danger" style={{ alignSelf: 'center' }} onClick={() => solicitarCancelamento(r.id)}>Cancelar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
                <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', fontWeight: 500, flexWrap: 'wrap' }}>
                  <span>📅 {formatarData(r.data)}</span>
                  <span>⏱️ {r.horario_inicio} às {r.horario_fim}</span>
                  <span>📝 Reserva #{r.id}</span>
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
