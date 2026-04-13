import { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:5000';

export default function Home({ user }) {
  const [salas, setSalas] = useState([]);
  const [detalhes, setDetalhes] = useState(null); // Sala selecionada no modal
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Form State
  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/salas`)
      .then(res => res.json())
      .then(data => setSalas(data))
      .catch(err => console.error(err));
  }, []);

  const abrirModal = async (id) => {
    setErro('');
    setSucesso('');
    setData(''); setHoraInicio(''); setHoraFim('');
    try {
      const res = await fetch(`${API_URL}/salas/${id}`);
      const data = await res.json();
      setDetalhes(data);
    } catch (err) {
      setErro('Falha ao carregar detalhes da sala.');
    }
  };

  const fecharModal = () => {
    setDetalhes(null);
  };

  const fazerReserva = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const payload = {
      sala_id: detalhes.id,
      usuario_id: user.id,
      data: data,
      horario_inicio: horaInicio,
      horario_fim: horaFim
    };

    try {
      const res = await fetch(`${API_URL}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        setErro(result.erro || 'Erro ao realizar reserva.');
      } else {
        setSucesso('Reserva confirmada com sucesso!');
        setTimeout(fecharModal, 2000);
      }
    } catch (err) {
      setErro('Servidor indisponível.');
    }
  };

  return (
    <>
      <div className="animate-enter">
        <h1>Descubra nossos Espaços</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
          Selecione uma sala abaixo para visualizar seus equipamentos e realizar um agendamento.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {salas.map(sala => (
            <div key={sala.id} className="glass-panel" style={{ cursor: 'pointer', transition: 'box-shadow 0.3s ease, transform 0.2s ease' }} 
                 onClick={() => abrirModal(sala.id)}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h2 style={{ marginBottom: '0.5rem' }}>{sala.nome}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 500 }}>
                <span>👥 {sala.capacidade} pessoas</span>
              </div>
              <button className="btn" style={{ width: '100%' }}>Verificar Disponibilidade</button>
            </div>
          ))}
          {salas.length === 0 && <p>Nenhuma sala encontrada. O servidor Flask está rodando?</p>}
        </div>
      </div>

      {/* Modal de Reserva - Moved outside of animated div to fix position: fixed containment issue */}
      {detalhes && (
        <div style={{
          position: 'fixed', inset: 0, 
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '500px', margin: '20px', maxHeight: '90vh', overflowY: 'auto', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--text-main)' }}>{detalhes.nome}</h2>
              <button type="button" onClick={fecharModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <span style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                👥 {detalhes.capacidade} Pessoas
              </span>
              {detalhes.recursos && detalhes.recursos.map(r => (
                <span key={r} style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--accent-color)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚡ {r}
                </span>
              ))}
            </div>

            <form onSubmit={fazerReserva}>
              <div className="input-group">
                <label>Data</label>
                <input type="date" required value={data} onChange={e => setData(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Horário Início</label>
                  <input type="time" required value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Horário Fim</label>
                  <input type="time" required value={horaFim} onChange={e => setHoraFim(e.target.value)} />
                </div>
              </div>

              {erro && <div className="toast-error">⚠️ {erro}</div>}
              {sucesso && <div style={{ color: 'var(--success-color)', marginBottom: '1rem', fontWeight: 'bold' }}>✅ {sucesso}</div>}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={fecharModal}>Cancelar</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>Confirmar Agendamento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
