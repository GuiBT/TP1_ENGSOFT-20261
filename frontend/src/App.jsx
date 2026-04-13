import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';

const API_URL = 'http://127.0.0.1:5000';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const carregarUsuarios = () => {
    fetch(`${API_URL}/usuarios`)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        if (!currentUser && data.length > 0) {
          setCurrentUser(data[0]);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const changeUser = (id) => {
    const user = users.find(u => u.id === parseInt(id));
    if (user) {
      setCurrentUser(user);
      if (user.papel !== 'admin' && currentView === 'admin') {
        setCurrentView('home');
      }
    }
  };

  if (!currentUser) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados... Certifique-se de que o backend Flask está rodando.</div>;

  return (
    <>
      <Navbar currentView={currentView} setView={setCurrentView} user={currentUser} users={users} changeUser={changeUser} />
      <main style={{ padding: '0 2rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
        {currentView === 'home' && <Home user={currentUser} />}
        {currentView === 'dashboard' && <Dashboard user={currentUser} />}
        {currentView === 'admin' && currentUser.papel === 'admin' && <AdminDashboard user={currentUser} refreshUsers={carregarUsuarios} />}
      </main>
    </>
  )
}

export default App;
