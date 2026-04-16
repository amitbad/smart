import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Network, Table, Settings, User, LogOut, Key, ListTodo, Layers, Mail, Briefcase } from 'lucide-react';

export default function Layout({ children, user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

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
        {children}
      </main>
    </div>
  );
}
