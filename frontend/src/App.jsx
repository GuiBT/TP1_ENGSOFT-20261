import { useState } from 'react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Navbar from './components/Navbar';

const API_URL = 'http://127.0.0.1:5000';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

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
        {currentView === 'dashboard' && <Dashboard user={currentUser} />}
        {currentView === 'admin' && currentUser.papel === 'admin' && <AdminDashboard user={currentUser} />}
      </main>
    </>
  )
}

export default App;
