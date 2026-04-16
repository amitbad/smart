import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Network, Table, Settings, User, LogOut, Key, ListTodo, Layers, Mail, Briefcase, Bell } from 'lucide-react';
import axios from 'axios';

export default function Layout({ children, user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [todayCount, setTodayCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [todayActions, setTodayActions] = useState([]);
  const [todayEmails, setTodayEmails] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [ai, em] = await Promise.all([
          axios.get('/api/action-items', { params: { date: today } }),
          axios.get('/api/emails', { params: { reply_by: today } })
        ]);
        const a = Array.isArray(ai.data) ? ai.data : [];
        const e = Array.isArray(em.data) ? em.data : [];
        setTodayActions(a);
        setTodayEmails(e);
        setTodayCount(a.length + e.length);
      } catch {
        setTodayActions([]);
        setTodayEmails([]);
        setTodayCount(0);
      }
    };
    fetchAll();
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      <aside
        className={`${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
          } bg-black border-r border-gray-800 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h1 className="text-lg font-bold text-cyan-400">SMART</h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-500 hover:text-white"
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Network size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Hierarchy</span>}
          </Link>

          <Link
            to="/emails"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/emails')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Mail size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Emails</span>}
          </Link>

          <Link
            to="/bench"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/bench')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Briefcase size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Bench</span>}
          </Link>

          <Link
            to="/masters"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/masters')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Layers size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Masters</span>}
          </Link>

          <Link
            to="/action-items"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/action-items')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <ListTodo size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Action Items</span>}
          </Link>

          <Link
            to="/members"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/members') || location.pathname.startsWith('/members')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Table size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Members</span>}
          </Link>

          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/settings')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Settings size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </Link>

          <Link
            to="/change-password"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/change-password')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Key size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Change Password</span>}
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0">
              <User size={14} />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.username || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'USER'}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-900 hover:text-red-400 transition"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-gray-950">
        <div className="h-12 flex items-center justify-end px-4 border-b border-gray-800 bg-black relative">
          <button onClick={() => setNotifOpen(v => !v)} className="relative p-2 rounded hover:bg-gray-900 text-gray-300" title="Today's Items">
            <Bell size={18} />
            {todayCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">{todayCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-4 top-12 w-96 bg-black border border-gray-800 rounded shadow-lg z-20">
              <div className="px-3 py-2 border-b border-gray-800 text-sm text-gray-400">Today's Overview</div>
              <div className="max-h-80 overflow-auto">
                <div className="px-3 py-2 text-xs text-gray-500">Emails to reply today</div>
                {todayEmails.length === 0 ? (
                  <div className="px-3 pb-2 text-xs text-gray-600">None</div>
                ) : todayEmails.map(em => (
                  <div key={em.id} className="px-3 py-2 hover:bg-gray-900 cursor-pointer" onClick={() => { setNotifOpen(false); navigate('/emails'); }}>
                    <div className="text-sm text-gray-200 truncate" title={em.subject}>{em.subject}</div>
                    <div className="text-xs text-gray-500 truncate">{em.sender}</div>
                  </div>
                ))}
                <div className="px-3 pt-3 text-xs text-gray-500">Action items for today</div>
                {todayActions.length === 0 ? (
                  <div className="px-3 pb-3 text-xs text-gray-600">None</div>
                ) : todayActions.map(ai => (
                  <div key={ai.id} className="px-3 py-2 hover:bg-gray-900 cursor-pointer" onClick={() => { setNotifOpen(false); navigate('/action-items'); }}>
                    <div className="text-sm text-gray-200 truncate" title={ai.description}>{ai.description}</div>
                    <div className="text-xs text-gray-500">{ai.priority}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
