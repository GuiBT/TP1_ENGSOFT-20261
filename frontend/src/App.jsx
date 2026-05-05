import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Navbar from './components/Navbar';

const API_URL = 'http://127.0.0.1:5000';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setCurrentUser(data);
        setCurrentView('home');
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setCurrentView('login');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Verificando sessão...</div>;
  }

  if (!currentUser) {
    return (
      <Login
        setCurrentUser={(user) => {
          setCurrentUser(user);
          setCurrentView('home');
        }}
      />
    );
  }

  return (
    <>
      <Navbar currentView={currentView} setView={setCurrentView} user={currentUser} logout={logout} />
      <main style={{ padding: '0 2rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
        {currentView === 'home' && <Home user={currentUser} />}
        {currentView === 'dashboard' && <Dashboard user={currentUser} setCurrentUser={setCurrentUser} />}
        {currentView === 'admin' && currentUser.papel === 'admin' && <AdminDashboard user={currentUser} />}
      </main>
    </>
  )
}

export default App;
