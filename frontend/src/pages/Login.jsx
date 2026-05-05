import { useState } from 'react';

const API_URL = 'http://127.0.0.1:5000';

export default function Login({ setCurrentUser }) {
  const [mode, setMode] = useState('login');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), senha })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.erro || 'Falha ao fazer login.');
      }

      setCurrentUser(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!nome.trim() || !login.trim() || !senha || !confirmarSenha) {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), login: login.trim(), senha, papel: 'comum' })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.erro || 'Falha ao criar usuário.');
      }

      setMessage('Usuário criado com sucesso! Agora faça login com suas credenciais.');
      setNome('');
      setLogin('');
      setSenha('');
      setConfirmarSenha('');
      setMode('login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>{mode === 'login' ? 'Login' : 'Criar Conta'}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {mode === 'login'
            ? 'Entre com seu login e senha para acessar o sistema.'
            : 'Cadastre um novo usuário com login e senha para acessar o sistema.'}
        </p>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
            <label style={{ textAlign: 'left' }}>
              Login
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="Digite seu login"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}
              />
            </label>

            <label style={{ textAlign: 'left' }}>
              Senha
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}
              />
            </label>

            <button type="submit" className="btn" style={{ width: '100%' }}>
              Entrar
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
            <label style={{ textAlign: 'left' }}>
              Nome
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Digite seu nome"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}
              />
            </label>

            <label style={{ textAlign: 'left' }}>
              Login
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="Escolha um login"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}
              />
            </label>

            <label style={{ textAlign: 'left' }}>
              Senha
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}
              />
            </label>

            <label style={{ textAlign: 'left' }}>
              Confirmar senha
              <input
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                placeholder="Repita sua senha"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}
              />
            </label>

            <button type="submit" className="btn" style={{ width: '100%' }}>
              Criar Conta
            </button>
          </form>
        )}

        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setMessage('');
            setError('');
          }}
        >
          {mode === 'login' ? 'Criar uma nova conta' : 'Voltar para login'}
        </button>

        {(message || error) && (
          <div style={{ marginTop: '1.5rem', color: error ? '#b91c1c' : '#065f46', fontWeight: 600 }}>
            {error || message}
          </div>
        )}
      </div>
    </main>
  );
}
