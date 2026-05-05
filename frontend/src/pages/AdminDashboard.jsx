import { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
};

export default function AdminDashboard({ user }) {
  const [reservas, setReservas] = useState([]);
  const [salas, setSalas] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [salasMap, setSalasMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Forms states
  const [newRoom, setNewRoom] = useState({ nome: '', capacidade: '', recursos_ids: [] });
  const [newResource, setNewResource] = useState({ nome: '' });
  const [newUser, setNewUser] = useState({ nome: '', login: '', senha: '', confirmar_senha: '', papel: 'comum' });

  // Modals States
  const [editingRoom, setEditingRoom] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [adminReservaToDelete, setAdminReservaToDelete] = useState(null);
  const [userActionConfirm, setUserActionConfirm] = useState(null);

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

      const resUsuarios = await fetch(`${API_URL}/usuarios`, { headers: getAuthHeaders() });
      setUsuarios(await resUsuarios.json());

      const resReservas = await fetch(`${API_URL}/reservas/todas`, { headers: getAuthHeaders() });
      const reservasData = await resReservas.json();
      reservasData.sort((a, b) => new Date(b.data) - new Date(a.data));
      setReservas(reservasData);
    } catch (err) {
      console.error(err);
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
        body: JSON.stringify({ 
          nome: newResource.nome
        })
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
      showToast('Sala e suas reservas removidas com sucesso.');
      carregarDados();
      setEditingRoom(null); // Fechar form de edit se aberto
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
      showToast('Reserva removida com sucesso (Modo Admin).');
      carregarDados();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAdminReservaToDelete(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      if (!newUser.nome.trim() || !newUser.login.trim() || !newUser.senha || !newUser.confirmar_senha) {
        throw new Error('Todos os campos de usuário são obrigatórios.');
      }
      if (newUser.senha !== newUser.confirmar_senha) {
        throw new Error('As senhas não coincidem.');
      }

      const res = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          nome: newUser.nome,
          login: newUser.login,
          senha: newUser.senha,
          papel: newUser.papel
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      showToast('Usuário criado com sucesso!');
      setNewUser({ nome: '', login: '', senha: '', confirmar_senha: '', papel: 'comum' });
      carregarDados();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handlePromoteUser = async (userToPromote) => {
    try {
      const res = await fetch(`${API_URL}/usuarios/${userToPromote.id}/promover`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      showToast('Usuário promovido a admin!');
      carregarDados();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRequestDemoteUser = (userToDemote) => {
    setUserActionConfirm({
      tipo: 'demote',
      title: 'Rebaixar Usuário?',
      message: `Deseja rebaixar ${userToDemote.nome} (${userToDemote.login}) para usuário comum?`,
      confirmText: 'Rebaixar',
      payload: userToDemote
    });
  };

  const handleRequestDeleteUser = (userToDelete) => {
    setUserActionConfirm({
      tipo: 'delete',
      title: 'Excluir Usuário?',
      message: `Tem certeza que deseja excluir ${userToDelete.nome} (${userToDelete.login}) do sistema?`,
      confirmText: 'Excluir',
      payload: userToDelete
    });
  };

  const confirmUserAction = async () => {
    if (!userActionConfirm) return;
    const { tipo, payload } = userActionConfirm;
    setUserActionConfirm(null);

    if (tipo === 'demote') {
      return await handleDemoteUser(payload);
    }
    if (tipo === 'delete') {
      return await handleDeleteUser(payload);
    }
  };

  const handleDemoteUser = async (userToDemote) => {
    try {
      const res = await fetch(`${API_URL}/usuarios/${userToDemote.id}/demote`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      showToast('Usuário rebaixado para comum!');
      carregarDados();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    try {
      const res = await fetch(`${API_URL}/usuarios/${userToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      showToast('Usuário removido com sucesso!');
      carregarDados();
    } catch (err) {
      showToast(err.message, 'error');
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
      showToast("Erro ao abrir edição de sala", 'error');
    }
  };

  const saveEditRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/salas/${editingRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <>
      <div className="animate-enter">
        <h1>Painel Administrativo</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Gerencie as salas, recursos, usuários e visualize todas as reservas do sistema.
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

        {/* Grid for Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem', alignItems: 'stretch' }}>
          
          {/* Adicionar Sala */}
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

          {/* Gerenciar Recursos Unidos */}
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

          {/* Adicionar Usuário */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
            <h3>👤 Cadastrar Usuário</h3>
            <form style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }} onSubmit={handleCreateUser}>
              <div className="input-group">
                <label>Nome do Usuário</label>
                <input type="text" required value={newUser.nome} onChange={e => setNewUser({...newUser, nome: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Login</label>
                <input type="text" required value={newUser.login} onChange={e => setNewUser({...newUser, login: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Senha</label>
                <input type="password" required value={newUser.senha} onChange={e => setNewUser({...newUser, senha: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Confirmar Senha</label>
                <input type="password" required value={newUser.confirmar_senha} onChange={e => setNewUser({...newUser, confirmar_senha: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Papel</label>
                <select value={newUser.papel} onChange={e => setNewUser({...newUser, papel: e.target.value})}>
                  <option value="comum">Comum</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button type="submit" className="btn" style={{ width: '100%', marginTop: 'auto' }}>Adicionar Usuário</button>
            </form>
          </div>

          {/* Gerenciar Usuários */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
            <h3>👥 Gerenciar Usuários</h3>
            {usuarios.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Carregando usuários...</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {usuarios.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <div>
                      <strong>{u.nome}</strong> <span style={{ color: 'var(--text-muted)' }}>({u.login})</span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Papel: {u.papel}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {u.id === user.id ? (
                        <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>Você</span>
                      ) : (
                        <>
                          {u.papel !== 'admin' ? (
                            <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => handlePromoteUser(u)}>
                              Promover
                            </button>
                          ) : (
                            <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => handleRequestDemoteUser(u)}>
                              Rebaixar
                            </button>
                          )}
                          <button className="btn btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleRequestDeleteUser(u)}>
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Gerenciar Salas */}
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

        <h2>Todas as Reservas (Global)</h2>
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
                    Reserva #{r.id} • Usuário ID: {r.usuario_id}
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

      {/* Modals outside animate-enter */}

      {/* Modal de Edição de Sala */}
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

      {/* Custom in-app Confirmation Modals */}
      {resourceToDelete && (
        <div style={{
          position: 'fixed', inset: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
        }}>
          <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '400px', margin: '20px', textAlign: 'center', background: '#fff' }}>
            <h2>Apagar Recurso?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Tem certeza que deseja apagar este recurso permanentemente? Essa ação desvinculará este recurso de todas as salas.</p>
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
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Tem certeza que deseja apagar a sala #{roomToDelete} permanentemente? Isso exluirá também as requisições de reserva futuras.</p>
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
            <h2>Cancelar Reserva (Admin)</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Tem certeza que deseja cancelar ativamente esta reserva no banco de dados?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setAdminReservaToDelete(null)}>Não, manter</button>
              <button className="btn btn-danger" onClick={confirmDeleteAdminReserva}>Sim, remover</button>
            </div>
          </div>
        </div>
      )}

      {userActionConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
        }}>
          <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '420px', margin: '20px', textAlign: 'center', background: '#fff' }}>
            <h2>{userActionConfirm.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{userActionConfirm.message}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setUserActionConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmUserAction}>{userActionConfirm.confirmText}</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
