import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HierarchyView from './pages/HierarchyView';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Members from './pages/Members';
import AddMember from './pages/AddMember';
import EditMember from './pages/EditMember';
import ViewMember from './pages/ViewMember';
import { ToastProvider } from './components/ToastContainer';
import ActionItems from './pages/ActionItems';
import Masters from './pages/Masters';
import Emails from './pages/Emails';
import Bench from './pages/Bench';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<HierarchyView />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/add" element={<AddMember />} />
            <Route path="/members/:id" element={<ViewMember />} />
            <Route path="/members/:id/edit" element={<EditMember />} />
            <Route path="/action-items" element={<ActionItems />} />
            <Route path="/emails" element={<Emails />} />
            <Route path="/bench" element={<Bench />} />
            <Route path="/masters" element={<Masters />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ToastProvider>
  );
}

export default App;
