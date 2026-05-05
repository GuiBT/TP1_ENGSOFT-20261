import { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
};

export default function RoomAdminDashboard({ user }) {
  const [salas, setSalas] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [salasMap, setSalasMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [newRoom, setNewRoom] = useState({ nome: '', capacidade: '', recursos_ids: [] });
  const [newResource, setNewResource] = useState({ nome: '' });
  const [editingRoom, setEditingRoom] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [adminReservaToDelete, setAdminReservaToDelete] = useState(null);

  const [toast, setToast] = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 4000);
  };

  const carregarDados = async () => {
    try {
      const resSalas = await fetch(`${API_URL}/salas`, { headers: getAuthHeaders() });
      const salasData = await resSalas.json();
      setSalas(salasData);
      const mapS = {};
      salasData.forEach(s => mapS[s.id] = s.nome);
      setSalasMap(mapS);

      const resRec = await fetch(`${API_URL}/recursos`, { headers: getAuthHeaders() });
      setRecursos(await resRec.json());

      const resReservas = await fetch(`${API_URL}/reservas/todas`, { headers: getAuthHeaders() });
      const reservasData = await resReservas.json();
      reservasData.sort((a, b) => new Date(a.data) - new Date(b.data) || a.horario_inicio.localeCompare(b.horario_inicio));
      setReservas(reservasData);
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar dados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/salas`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          nome: newRoom.nome, 
          capacidade: parseInt(newRoom.capacidade), 
          recursos_ids: newRoom.recursos_ids 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      showToast('Sala criada com sucesso!');
      setNewRoom({ nome: '', capacidade: '', recursos_ids: [] });
      carregarDados();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/recursos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nome: newResource.nome })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      showToast('Recurso criado com sucesso!');
      setNewResource({ nome: '' });
      carregarDados();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const confirmDeleteResource = async () => {
    if (!resourceToDelete) return;
    try {
      const res = await fetch(`${API_URL}/recursos/${resourceToDelete}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      showToast('Recurso removido.');
      carregarDados();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setResourceToDelete(null);
    }
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      const res = await fetch(`${API_URL}/salas/${roomToDelete}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      showToast('Sala removida com sucesso.');
      carregarDados();
      setEditingRoom(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRoomToDelete(null);
    }
  };

  const confirmDeleteAdminReserva = async () => {
    if (!adminReservaToDelete) return;
    try {
      const res = await fetch(`${API_URL}/reservas/${adminReservaToDelete}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      showToast('Reserva removida com sucesso.');
      carregarDados();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAdminReservaToDelete(null);
    }
  };

  const openEditRoom = async (sala) => {
    try {
      const res = await fetch(`${API_URL}/salas/${sala.id}`);
      const data = await res.json();
      const existingRecursosIds = recursos
        .filter(r => data.recursos && data.recursos.includes(r.nome))
        .map(r => r.id);

      setEditingRoom({
        id: sala.id,
        nome: data.nome,
        capacidade: data.capacidade,
        recursos_ids: existingRecursosIds
      });
    } catch (err) {
      showToast('Erro ao abrir edição de sala', 'error');
    }
  };

  const saveEditRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/salas/${editingRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ 
          nome: editingRoom.nome, 
          capacidade: parseInt(editingRoom.capacidade), 
          recursos_ids: editingRoom.recursos_ids 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      showToast('Sala alterada com sucesso!');
      setEditingRoom(null);
      carregarDados();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const formatarData = (dataEUA) => {
    if (!dataEUA) return '';
    const partes = dataEUA.split('-');
    if (partes.length !== 3) return dataEUA;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
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

  const calendarYear = parseInt(calendarMonth.split('-')[0], 10);
  const calendarMonthIndex = parseInt(calendarMonth.split('-')[1], 10) - 1;
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonthIndex);
  const selectedDayReservations = reservationsByDate[selectedCalendarDate] || [];

  return (
    <>
      <div className="animate-enter">
        <h1>Painel do Administrador de Salas</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Gerencie salas, recursos e visualize todas as reservas sem acesso direto à gestão de usuários.
        </p>

        {toast.msg && (
          <div className={toast.type === 'error' ? 'toast-error' : ''} style={{
            backgroundColor: toast.type === 'success' ? '#d1fae5' : undefined,
            color: toast.type === 'success' ? '#065f46' : undefined,
            padding: toast.type === 'success' ? '12px 16px' : undefined,
            borderRadius: toast.type === 'success' ? '4px' : undefined,
            marginBottom: '1rem',
            borderLeft: toast.type === 'success' ? '4px solid #10b981' : undefined
          }}>
            {toast.msg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem', alignItems: 'stretch' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
            <h3>🚪 Cadastrar Sala</h3>
            <form style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }} onSubmit={handleCreateRoom}>
              <div className="input-group">
                <label>Nome da Sala</label>
                <input type="text" required value={newRoom.nome} onChange={e => setNewRoom({...newRoom, nome: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Capacidade</label>
                <input type="number" required min="1" value={newRoom.capacidade} onChange={e => setNewRoom({...newRoom, capacidade: e.target.value})} />
              </div>
              <div className="input-group" style={{ marginBottom: 'auto' }}>
                <label>Recursos da Sala</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '10px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  {recursos.length === 0 && <span style={{fontSize: '0.85rem'}}>Nenhum recurso cadastrado.</span>}
                  {recursos.map(rec => (
                    <label key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', margin: 0, fontSize: '0.9rem' }}>
                      <input 
                        type="checkbox" 
                        style={{ width: 'auto' }}
                        checked={newRoom.recursos_ids.includes(rec.id)}
                        onChange={(e) => {
                          const ids = newRoom.recursos_ids;
                          if (e.target.checked) setNewRoom({...newRoom, recursos_ids: [...ids, rec.id]});
                          else setNewRoom({...newRoom, recursos_ids: ids.filter(i => i !== rec.id)});
                        }}
                      />
                      {rec.nome}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>Adicionar Sala</button>
            </form>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
            <h3>⚡ Gerenciar Recursos</h3>
            <form style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', marginTop: '1rem' }} onSubmit={handleCreateResource}>
              <input type="text" required placeholder="Novo Recurso..." style={{ flexGrow: 1 }} value={newResource.nome} onChange={e => setNewResource({nome: e.target.value})} />
              <button type="submit" className="btn">Adicionar</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flexGrow: 1, maxHeight: '280px', paddingRight: '10px' }}>
              {recursos.length === 0 ? <p style={{ fontSize: '0.85rem' }}>Nenhum recurso.</p> : recursos.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                  <span>{r.nome}</span>
                  <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setResourceToDelete(r.id)}>Remover</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <h2>Gerenciar Salas</h2>
          <div className="glass-panel" style={{ marginBottom: 0 }}>
            {salas.length === 0 ? <p>Nenhuma sala cadastrada.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {salas.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '15px 20px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{s.nome}</h4>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Capacidade: {s.capacidade}</div>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => openEditRoom(s)}>Editar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ marginBottom: '3rem' }}>
          <h2>Filtros e Calendário de Reservas</h2>
          <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Selecione um mês para visualizar a agenda de reservas.</p>
              <input type="month" value={calendarMonth} onChange={e => setCalendarMonth(e.target.value)} style={{ maxWidth: '220px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '8px', marginBottom: '1rem' }}>
              {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                <div key={d} style={{ fontWeight: 700, textAlign: 'center', color: 'var(--text-muted)' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '8px' }}>
              {new Array(new Date(calendarYear, calendarMonthIndex, 1).getDay()).fill(null).map((_, idx) => (
                <div key={`blank-${idx}`} style={{ minHeight: '70px' }} />
              ))}
              {daysInMonth.map(day => {
                const key = day.toISOString().slice(0, 10);
                const count = reservationsByDate[key]?.length || 0;
                const selected = key === selectedCalendarDate;
                return (
                  <button key={key} type="button" onClick={() => setSelectedCalendarDate(key)} style={{
                    minHeight: '70px',
                    borderRadius: '10px',
                    border: selected ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
                    background: selected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-color)',
                    color: 'inherit',
                    padding: '10px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}>
                    <div style={{ fontWeight: 700 }}>{day.getDate()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {count} reserva{count !== 1 ? 's' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0' }}>Reservas em {formatarData(selectedCalendarDate)}</h4>
              {selectedDayReservations.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Nenhuma reserva nesta data.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {selectedDayReservations.map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--surface-border)' }}>
                      <div>
                        <strong>Reserva #{r.id}</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{salasMap[r.sala_id] || `Sala #${r.sala_id}`}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div>{r.horario_inicio} às {r.horario_fim}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Usuário #{r.usuario_id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <h2>Todas as Reservas</h2>
        {loading ? (
          <p>Carregando reservas...</p>
        ) : reservas.length === 0 ? (
          <p>Nenhuma reserva encontrada no sistema inteiro.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reservas.map(r => (
              <div key={r.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', marginBottom: 0 }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>{salasMap[r.sala_id] || `Sala #${r.sala_id}`}</h4>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Reserva #{r.id} • Usuário #{r.usuario_id}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div>
                    <span style={{ marginRight: '15px' }}>📅 {formatarData(r.data)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>⏱️ {r.horario_inicio} às {r.horario_fim}</span>
                  </div>
                  <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setAdminReservaToDelete(r.id)}>Cancelar Reserva</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingRoom && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '500px', margin: '20px', maxHeight: '90vh', overflowY: 'auto', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Editar Sala</h2>
              <button type="button" onClick={() => setEditingRoom(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={saveEditRoom}>
              <div className="input-group">
                <label>Nome da Sala</label>
                <input type="text" required value={editingRoom.nome} onChange={e => setEditingRoom({...editingRoom, nome: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Capacidade</label>
                <input type="number" required min="1" value={editingRoom.capacidade} onChange={e => setEditingRoom({...editingRoom, capacidade: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Recursos da Sala</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '10px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  {recursos.map(rec => (
                    <label key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', margin: 0, fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={editingRoom.recursos_ids.includes(rec.id)}
                        onChange={(e) => {
                          const ids = editingRoom.recursos_ids;
                          if (e.target.checked) setEditingRoom({...editingRoom, recursos_ids: [...ids, rec.id]});
                          else setEditingRoom({...editingRoom, recursos_ids: ids.filter(i => i !== rec.id)});
                        }}
                      />
                      {rec.nome}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, minWidth: '120px' }} onClick={() => setEditingRoom(null)}>Cancelar</button>
                <button type="submit" className="btn" style={{ flex: 1, minWidth: '120px' }}>Salvar Alterações</button>
              </div>
              <hr style={{ margin: '1.5rem 0', borderColor: 'var(--surface-border)' }} />
              <button type="button" className="btn btn-danger" style={{ width: '100%' }} onClick={() => setRoomToDelete(editingRoom.id)}>
                Remover Sala Definitivamente
              </button>
            </form>
          </div>
        </div>
      )}

      {resourceToDelete && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
        }}>
          <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '400px', margin: '20px', textAlign: 'center', background: '#fff' }}>
            <h2>Apagar Recurso?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Tem certeza que deseja apagar este recurso permanentemente?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setResourceToDelete(null)}>Não, manter</button>
              <button className="btn btn-danger" onClick={confirmDeleteResource}>Sim, apagar</button>
            </div>
          </div>
        </div>
      )}

      {roomToDelete && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
        }}>
          <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '400px', margin: '20px', textAlign: 'center', background: '#fff' }}>
            <h2>Remover Sala?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Tem certeza que deseja apagar esta sala permanentemente?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setRoomToDelete(null)}>Cancelar exclusão</button>
              <button className="btn btn-danger" onClick={confirmDeleteRoom}>Apagar Sala</button>
            </div>
          </div>
        </div>
      )}

      {adminReservaToDelete && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
        }}>
          <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '400px', margin: '20px', textAlign: 'center', background: '#fff' }}>
            <h2>Cancelar Reserva</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Tem certeza que deseja cancelar esta reserva?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setAdminReservaToDelete(null)}>Não, manter</button>
              <button className="btn btn-danger" onClick={confirmDeleteAdminReserva}>Sim, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
